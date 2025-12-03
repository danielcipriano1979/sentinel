import type { Express, Request, Response, NextFunction } from "express";
import { UserAuthService, type UserToken } from "./user-auth";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertOrganizationUserSchema,
  insertUserInvitationSchema,
} from "@shared/schema";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: UserToken;
    }
  }
}

/**
 * Middleware to verify user token
 */
export async function verifyUserToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token format
    const decoded = UserAuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check session validity
    const isValid = await UserAuthService.isSessionValid(token);
    if (!isValid) {
      return res.status(401).json({ error: "Session expired or revoked" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

/**
 * Middleware to verify user belongs to organization
 */
export function requireOrganization(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orgId = req.query.orgId as string || req.params.orgId as string;
  if (orgId !== req.user.organizationId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  next();
}

/**
 * Middleware to check user role permission
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export async function registerUserRoutes(app: Express): Promise<void> {
  /**
   * Register new user with organization
   * POST /api/auth/register
   * Body: { email, password, firstName, lastName, organizationName, organizationSlug }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        organizationName,
        organizationSlug,
      } = req.body;

      // Validate input
      if (!email || !password || !organizationName || !organizationSlug) {
        return res.status(400).json({
          error: "Missing required fields: email, password, organizationName, organizationSlug",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
        });
      }

      const { user, organization, token } =
        await UserAuthService.registerWithOrganization(
          email,
          password,
          firstName || "",
          lastName || "",
          organizationName,
          organizationSlug
        );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        token,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * Login user
   * POST /api/auth/login
   * Body: { organizationSlug, email, password }
   */
  /**
   * Unified login endpoint - routes to correct tenant or creates tenant request
   * POST /api/auth/unified-login
   */
  app.post("/api/auth/unified-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Missing required fields: email, password",
        });
      }

      // Check if user is a system admin
      const adminUser = await storage.getAdminUserByEmail(email);
      if (adminUser) {
        // This is an admin user - they should use admin login
        return res.status(400).json({
          error: "Admin users should use the admin login",
          isAdmin: true,
        });
      }

      // Find all organizations where this user exists
      let userOrganizations: any[] = [];
      try {
        userOrganizations = await storage.getUserOrganizations(email);
      } catch (err) {
        console.error("Error fetching user organizations:", err);
        // Continue - user might have no organizations
      }

      if (userOrganizations && userOrganizations.length > 0) {
        // User exists in at least one organization - login to the first one
        const org = userOrganizations[0];
        try {
          const { user, token } = await UserAuthService.login(
            org.id,
            email,
            password
          );

          return res.json({
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              organizationId: user.organizationId,
            },
            organization: {
              id: org.id,
              name: org.name,
              slug: org.slug,
            },
            token,
            status: "authenticated",
          });
        } catch (loginErr: any) {
          console.error("Login error for organization:", loginErr);
          throw loginErr;
        }
      } else {
        // User doesn't exist in any organization
        // Return status asking for tenant creation
        return res.json({
          email: email,
          status: "no_tenant",
          message: "User has no organization. Please create or request an organization.",
        });
      }
    } catch (error: any) {
      console.error("Unified login error:", error);
      res.status(401).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { organizationSlug, email, password } = req.body;

      if (!organizationSlug || !email || !password) {
        return res.status(400).json({
          error: "Missing required fields: organizationSlug, email, password",
        });
      }

      // Get organization by slug
      const org = await storage.getOrganizationBySlug(organizationSlug);
      if (!org) {
        return res.status(401).json({ error: "Invalid organization or credentials" });
      }

      const { user, token } = await UserAuthService.login(
        org.id,
        email,
        password
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({ error: error.message });
    }
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  app.post(
    "/api/auth/logout",
    verifyUserToken,
    async (req: Request, res: Response) => {
      try {
        const token = req.headers.authorization?.split("Bearer ")[1];
        if (token) {
          await UserAuthService.logout(token);
        }
        res.json({ success: true });
      } catch (error: any) {
        console.error("Logout error:", error);
        res.status(400).json({ error: error.message });
      }
    }
  );

  /**
   * Get current user
   * GET /api/auth/me
   */
  app.get("/api/auth/me", verifyUserToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await UserAuthService.getUserById(
        req.user.userId,
        req.user.organizationId
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const org = await storage.getOrganization(req.user.organizationId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        organization: org,
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * Register with invitation token
   * POST /api/auth/register/invitation
   * Body: { invitationToken, password, firstName, lastName }
   */
  app.post("/api/auth/register/invitation", async (req: Request, res: Response) => {
    try {
      const { invitationToken, password, firstName, lastName } = req.body;

      if (!invitationToken || !password) {
        return res.status(400).json({
          error: "Missing required fields: invitationToken, password",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
        });
      }

      const { user, token } = await UserAuthService.registerAsOrganizationMember(
        invitationToken,
        password,
        firstName || "",
        lastName || ""
      );

      const org = await storage.getOrganization(user.organizationId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        organization: org,
        token,
      });
    } catch (error: any) {
      console.error("Invitation registration error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * Get organization members
   * GET /api/organizations/:id/members
   */
  app.get(
    "/api/organizations/:id/members",
    verifyUserToken,
    requireOrganization,
    async (req: Request, res: Response) => {
      try {
        const orgId = req.params.id;

        // Get all users in organization
        const users = await storage.getOrganizationUsers(orgId);

        res.json({
          members: users.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            emailVerified: u.emailVerified,
            lastLoginAt: u.lastLoginAt,
            createdAt: u.createdAt,
          })),
        });
      } catch (error: any) {
        console.error("Get members error:", error);
        res.status(400).json({ error: error.message });
      }
    }
  );

  /**
   * Update user role (admin/owner only)
   * PUT /api/organizations/:id/members/:userId
   */
  app.put(
    "/api/organizations/:id/members/:userId",
    verifyUserToken,
    requireOrganization,
    requireRole("owner", "admin"),
    async (req: Request, res: Response) => {
      try {
        const { id: orgId, userId } = req.params;
        const { role } = req.body;

        if (!["owner", "admin", "member", "viewer"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }

        const updated = await storage.updateOrganizationUserRole(
          userId,
          orgId,
          role
        );

        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          user: {
            id: updated.id,
            email: updated.email,
            role: updated.role,
          },
        });
      } catch (error: any) {
        console.error("Update member error:", error);
        res.status(400).json({ error: error.message });
      }
    }
  );

  /**
   * Remove user from organization
   * DELETE /api/organizations/:id/members/:userId
   */
  app.delete(
    "/api/organizations/:id/members/:userId",
    verifyUserToken,
    requireOrganization,
    requireRole("owner", "admin"),
    async (req: Request, res: Response) => {
      try {
        const { id: orgId, userId } = req.params;

        // Prevent removing the last owner
        const members = await storage.getOrganizationUsers(orgId);
        const owners = members.filter((m) => m.role === "owner");

        if (owners.length === 1 && owners[0].id === userId) {
          return res.status(400).json({
            error: "Cannot remove the last owner from organization",
          });
        }

        await storage.removeOrganizationUser(userId, orgId);

        res.json({ success: true });
      } catch (error: any) {
        console.error("Remove member error:", error);
        res.status(400).json({ error: error.message });
      }
    }
  );

  /**
   * Send invitation to join organization
   * POST /api/organizations/:id/invitations
   */
  app.post(
    "/api/organizations/:id/invitations",
    verifyUserToken,
    requireOrganization,
    requireRole("owner", "admin"),
    async (req: Request, res: Response) => {
      try {
        const orgId = req.params.id;
        const { email, role } = req.body;

        if (!email || !role) {
          return res.status(400).json({
            error: "Missing required fields: email, role",
          });
        }

        if (!["owner", "admin", "member", "viewer"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }

        const invitation = await storage.createUserInvitation(
          orgId,
          email,
          role,
          req.user!.userId
        );

        // TODO: Send invitation email with invitation token

        res.json({
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            token: invitation.token,
            expiresAt: invitation.expiresAt,
          },
        });
      } catch (error: any) {
        console.error("Send invitation error:", error);
        res.status(400).json({ error: error.message });
      }
    }
  );
}
