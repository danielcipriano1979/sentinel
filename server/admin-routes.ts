import type { Express, Request, Response, NextFunction } from "express";
import { AdminAuthService } from "./admin-auth";
import { storage } from "./storage";
import { db } from "./db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Middleware to verify admin token
export async function verifyAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const decoded = AdminAuthService.verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const isValid = await AdminAuthService.isSessionValid(token);
  if (!isValid) {
    res.status(401).json({ error: "Token expired or revoked" });
    return;
  }

  (req as any).admin = decoded;
  next();
}

export async function registerAdminRoutes(app: Express): Promise<void> {
  // ==================== Admin Auth ====================

  // Check if admin exists
  app.get("/api/admin/check", async (req, res) => {
    try {
      const admins = await storage.getAllAdminUsers();
      const exists = admins && admins.length > 0;
      res.json({ exists });
    } catch (error) {
      console.error("Error checking admin existence:", error);
      // If we can't check, assume admin might exist
      res.json({ exists: false });
    }
  });

  // Get current admin user info
  app.get("/api/admin/me", verifyAdminToken, async (req, res) => {
    try {
      const admin = await storage.getAdminUserByEmail((req as any).admin.email);
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      res.json({
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        mfaEnabled: admin.mfaEnabled,
      });
    } catch (error) {
      console.error("Error fetching admin info:", error);
      res.status(500).json({ error: "Failed to fetch admin info" });
    }
  });

  app.post("/api/admin/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if admin already exists
      const existing = await storage.getAdminUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Admin user already exists" });
      }

      const user = await AdminAuthService.createAdminUser(
        email,
        password,
        firstName,
        lastName
      );

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled,
      });
    } catch (error) {
      console.error("Error registering admin:", error);
      res.status(500).json({ error: "Failed to register admin" });
    }
  });

  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password, mfaToken } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const result = await AdminAuthService.loginAdmin(email, password, mfaToken);

      if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (result.requiresMFA) {
        return res.status(200).json({
          requiresMFA: true,
          message: "Please provide MFA token to complete login",
        });
      }

      res.json({
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          mfaEnabled: result.user.mfaEnabled,
        },
      });
    } catch (error) {
      console.error("Error logging in admin:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/auth/logout", verifyAdminToken, async (req, res) => {
    try {
      const token = req.headers.authorization?.split("Bearer ")[1];
      if (token) {
        await AdminAuthService.revokeToken(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // ==================== MFA Setup ====================

  app.post("/api/admin/mfa/setup", verifyAdminToken, async (req, res) => {
    try {
      const adminId = (req as any).admin.adminUserId;
      const user = await storage.getAdminUserByEmail((req as any).admin.email);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { secret, qrCode } = await AdminAuthService.setupMFA(user);

      res.json({
        secret,
        qrCode,
        message: "Scan QR code with authenticator app and provide token to enable",
      });
    } catch (error) {
      console.error("Error setting up MFA:", error);
      res.status(500).json({ error: "Failed to setup MFA" });
    }
  });

  app.post("/api/admin/mfa/enable", verifyAdminToken, async (req, res) => {
    try {
      const adminId = (req as any).admin.adminUserId;
      const { secret, token } = req.body;

      if (!secret || !token) {
        return res.status(400).json({ error: "Secret and token required" });
      }

      // Verify the token is valid for the secret
      if (!AdminAuthService.verifyMFAToken(secret, token)) {
        return res.status(400).json({ error: "Invalid MFA token" });
      }

      await AdminAuthService.enableMFA(adminId, secret);

      res.json({ message: "MFA enabled successfully" });
    } catch (error) {
      console.error("Error enabling MFA:", error);
      res.status(500).json({ error: "Failed to enable MFA" });
    }
  });

  app.post("/api/admin/mfa/disable", verifyAdminToken, async (req, res) => {
    try {
      const adminId = (req as any).admin.adminUserId;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      const user = await storage.getAdminUserByEmail((req as any).admin.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const valid = await AdminAuthService.verifyPassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      await AdminAuthService.disableMFA(adminId);

      res.json({ message: "MFA disabled successfully" });
    } catch (error) {
      console.error("Error disabling MFA:", error);
      res.status(500).json({ error: "Failed to disable MFA" });
    }
  });

  // ==================== Tenants Management ====================

  app.get("/api/admin/tenants", verifyAdminToken, async (req, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const plans = await storage.getSubscriptionPlans();
      const plansMap = new Map(plans.map((p) => [p.id, p]));

      const tenants = await Promise.all(
        orgs.map(async (org) => {
          const plan = await storage.getOrganizationPlan(org.id);
          const hosts = await storage.getHosts(org.id);
          return {
            ...org,
            status: plan?.status || "unknown",
            plan: plan ? plansMap.get(plan.planId) : null,
            hostCount: hosts.length,
          };
        })
      );

      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  app.get("/api/admin/tenants/:id", verifyAdminToken, async (req, res) => {
    try {
      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const plan = await storage.getOrganizationPlan(org.id);
      const hosts = await storage.getHosts(org.id);
      const alerts = await storage.getAlerts(org.id);

      res.json({
        ...org,
        status: plan?.status || "active",
        plan: plan ? await storage.getSubscriptionPlan(plan.planId) : null,
        hostCount: hosts.length,
        activeAlerts: alerts.filter((a) => a.status === "active").length,
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  // Update tenant status or general info
  app.patch("/api/admin/tenants/:id", verifyAdminToken, async (req, res) => {
    try {
      const { status } = req.body;
      const adminId = (req as any).admin.adminUserId;

      if (!status) {
        return res.status(400).json({ error: "Status required" });
      }

      if (!["active", "suspended", "canceled", "deactivated"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      await storage.updateOrganizationPlanStatus(req.params.id, status);

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: status === "suspended" ? "suspend_org" : `${status}_org`,
        resource: "organization",
        resourceId: req.params.id,
        organizationId: req.params.id as any,
        changes: { status },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ message: `Organization ${status}` });
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  // Keep the old status endpoint for backward compatibility
  app.patch("/api/admin/tenants/:id/status", verifyAdminToken, async (req, res) => {
    try {
      const { status } = req.body;
      const adminId = (req as any).admin.adminUserId;

      if (!["active", "suspended", "canceled", "deactivated"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      await storage.updateOrganizationPlanStatus(req.params.id, status);

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: status === "suspended" ? "suspend_org" : `${status}_org`,
        resource: "organization",
        resourceId: req.params.id,
        organizationId: req.params.id as any,
        changes: { status },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ message: `Organization ${status}` });
    } catch (error) {
      console.error("Error updating tenant status:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  app.patch("/api/admin/tenants/:id/plan", verifyAdminToken, async (req, res) => {
    try {
      const { planId } = req.body;
      const adminId = (req as any).admin.adminUserId;

      if (!planId) {
        return res.status(400).json({ error: "Plan ID required" });
      }

      const org = await storage.getOrganization(req.params.id);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      const currentPlan = await storage.getOrganizationPlan(req.params.id);
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      if (currentPlan) {
        // Update existing plan
        await storage.createOrganizationPlan({
          organizationId: req.params.id as any,
          planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        });
      } else {
        // Create new plan
        await storage.createOrganizationPlan({
          organizationId: req.params.id as any,
          planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        });
      }

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: "update_plan",
        resource: "organization_plan",
        resourceId: req.params.id,
        organizationId: req.params.id as any,
        changes: { planId },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ message: "Plan updated successfully", plan });
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  /**
   * Delete a tenant and all associated data
   * DELETE /api/admin/tenants/:id
   * This operation cascades to delete all related data
   */
  app.delete("/api/admin/tenants/:id", verifyAdminToken, async (req, res) => {
    try {
      const tenantId = req.params.id;
      const adminId = (req as any).admin.adminUserId;

      // Verify tenant exists
      const org = await storage.getOrganization(tenantId);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Record the tenant details before deletion for audit log
      const tenantDetails = {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
      };

      // Delete the organization - all cascading deletes will be handled by the database
      // Due to cascade delete constraints defined in the schema:
      // - hosts table: { onDelete: "cascade" } -> deletes all hosts and their agents
      // - agents table: { onDelete: "cascade" } (via hosts)
      // - organizationUsers table: { onDelete: "cascade" }
      // - organizationSessions table: { onDelete: "cascade" } (via users)
      // - userInvitations table: { onDelete: "cascade" }
      // - customFieldDefinitions table: { onDelete: "cascade" }
      // - alertRules table: { onDelete: "cascade" }
      // - alerts table: { onDelete: "cascade" } (via alertRules and hosts)
      // - notificationChannels table: { onDelete: "cascade" }
      // - organizationPlans table: { onDelete: "cascade" }
      // - auditLogs with organizationId: { onDelete: "set null" } (preserves audit trail)
      await db.delete(organizations).where(eq(organizations.id, tenantId));

      // Log audit event for tenant deletion
      await storage.createAuditLog({
        adminUserId: adminId,
        action: "delete_organization",
        resource: "organization",
        resourceId: tenantId,
        changes: { deleted: true, organization: tenantDetails },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({
        success: true,
        message: "Tenant and all associated data deleted successfully",
        deletedTenant: tenantDetails,
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ error: "Failed to delete tenant" });
    }
  });

  // ==================== Subscription Plans ====================

  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  app.get("/api/subscription-plans/:id", verifyAdminToken, async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ error: "Failed to fetch plan" });
    }
  });

  app.post("/api/admin/subscription-plans", verifyAdminToken, async (req, res) => {
    try {
      const { name, maxHosts, maxUsers, maxAlertRules, monthlyPrice, description } =
        req.body;

      if (!name || maxHosts === undefined || maxUsers === undefined ||
          maxAlertRules === undefined || monthlyPrice === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const plan = await storage.createSubscriptionPlan({
        name,
        maxHosts,
        maxUsers,
        maxAlertRules,
        monthlyPrice,
        description,
        isActive: true,
      });

      await storage.createAuditLog({
        adminUserId: (req as any).admin.adminUserId,
        action: "create_plan",
        resource: "subscription_plan",
        resourceId: plan.id,
        changes: { plan },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ error: "Failed to create plan" });
    }
  });

  // ==================== Tenant Users ====================

  // Get tenant users
  app.get("/api/admin/tenants/:id/users", verifyAdminToken, async (req, res) => {
    try {
      const tenantId = req.params.id;
      const org = await storage.getOrganization(tenantId);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      const users = await storage.getOrganizationUsers(tenantId);
      res.json({
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Add tenant user
  app.post("/api/admin/tenants/:id/users", verifyAdminToken, async (req, res) => {
    try {
      const { email, role, password } = req.body;
      const adminId = (req as any).admin.adminUserId;
      const tenantId = req.params.id;

      if (!email || !role || !password) {
        return res.status(400).json({
          error: "Email, role, and password required",
        });
      }

      // Hash the password
      const passwordHash = await AdminAuthService.hashPassword(password);

      // Create the user in the database
      const user = await storage.createOrganizationUser(
        tenantId,
        email,
        passwordHash,
        role
      );

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: "create_user",
        resource: "user",
        resourceId: user.id,
        organizationId: tenantId as any,
        changes: { email, role },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Return the created user (without password hash)
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error adding user:", error);
      res.status(500).json({ error: "Failed to add user" });
    }
  });

  // Update tenant user
  app.patch("/api/admin/tenants/:id/users/:userId", verifyAdminToken, async (req, res) => {
    try {
      const { role, status } = req.body;
      const adminId = (req as any).admin.adminUserId;
      const tenantId = req.params.id;
      const userId = req.params.userId;

      if (!role && !status) {
        return res.status(400).json({ error: "Role or status required" });
      }

      // Build update object with only provided fields
      const updates: { role?: string; status?: string } = {};
      if (role) updates.role = role;
      if (status) updates.status = status;

      // Update the user in the database
      const user = await storage.updateOrganizationUser(userId, tenantId, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: "update_user",
        resource: "user",
        resourceId: userId,
        organizationId: tenantId as any,
        changes: updates,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Return the updated user
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete tenant user
  app.delete("/api/admin/tenants/:id/users/:userId", verifyAdminToken, async (req, res) => {
    try {
      const adminId = (req as any).admin.adminUserId;
      const tenantId = req.params.id;
      const userId = req.params.userId;

      // Delete the user from the database
      await storage.removeOrganizationUser(userId, tenantId);

      // Log audit event
      await storage.createAuditLog({
        adminUserId: adminId,
        action: "delete_user",
        resource: "user",
        resourceId: userId,
        organizationId: tenantId as any,
        changes: { deleted: true },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ==================== Tenant Billing ====================

  // Get tenant billing info
  app.get("/api/admin/tenants/:id/billing", verifyAdminToken, async (req, res) => {
    try {
      const tenantId = req.params.id;
      const org = await storage.getOrganization(tenantId);
      if (!org) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Return mock billing data for now
      // In a real implementation, fetch actual billing data
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      res.json({
        currentPlan: {
          name: "professional",
          monthlyPrice: 9900,
        },
        billingCycle: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysRemaining,
        },
        invoices: [
          {
            id: "inv-001",
            date: new Date().toISOString(),
            amount: 9900,
            status: "paid",
            dueDate: new Date().toISOString(),
          },
        ],
        totalSpend: 9900,
      });
    } catch (error) {
      console.error("Error fetching billing info:", error);
      res.status(500).json({ error: "Failed to fetch billing" });
    }
  });

  // ==================== Audit Logs ====================

  app.get("/api/admin/audit-logs", verifyAdminToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const organizationId = req.query.organizationId as string;

      const logs = await storage.getAuditLogs({
        organizationId,
        limit,
      });

      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
}
