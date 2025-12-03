import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import {
  organizationUsers,
  organizationSessions,
  userInvitations,
  organizations,
  type OrganizationUser,
  type OrganizationSession,
  type InsertOrganizationUser,
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";
const JWT_EXPIRY = "24h";

export interface UserToken {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export class UserAuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token for user
   */
  static generateToken(payload: UserToken): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): UserToken | null {
    try {
      return jwt.verify(token, JWT_SECRET) as UserToken;
    } catch {
      return null;
    }
  }

  /**
   * Register new user and create organization
   */
  static async registerWithOrganization(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    organizationName: string,
    organizationSlug: string
  ): Promise<{
    user: OrganizationUser;
    organization: { id: string; name: string; slug: string };
    token: string;
  }> {
    // Check if slug already exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, organizationSlug));

    if (existingOrg.length > 0) {
      throw new Error("Organization slug already exists");
    }

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: organizationName,
        slug: organizationSlug,
      })
      .returning();

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user as owner
    const [user] = await db
      .insert(organizationUsers)
      .values({
        organizationId: org.id,
        email,
        passwordHash,
        firstName,
        lastName,
        role: "owner",
        emailVerified: true,
      })
      .returning();

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      organizationId: org.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await db.insert(organizationSessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return { user, organization: org, token };
  }

  /**
   * Register user as member of existing organization
   */
  static async registerAsOrganizationMember(
    invitationToken: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{
    user: OrganizationUser;
    token: string;
  }> {
    // Find valid invitation
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(
        and(
          eq(userInvitations.token, invitationToken),
          eq(userInvitations.acceptedAt, null),
          // Check expiry
          or(
            and(
              userInvitations.expiresAt
            )
          )
        )
      );

    if (!invitation || new Date() > invitation.expiresAt) {
      throw new Error("Invalid or expired invitation");
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const [user] = await db
      .insert(organizationUsers)
      .values({
        organizationId: invitation.organizationId,
        email: invitation.email,
        passwordHash,
        firstName,
        lastName,
        role: invitation.role,
        emailVerified: true,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.id, invitation.id));

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await db.insert(organizationSessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return { user, token };
  }

  /**
   * Login user with email and password
   */
  static async login(
    organizationId: string,
    email: string,
    password: string
  ): Promise<{
    user: OrganizationUser;
    token: string;
  }> {
    // Find user by email and organization
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.email, email)
        )
      );

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await db
      .update(organizationUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(organizationUsers.id, user.id));

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    await db.insert(organizationSessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    return { user, token };
  }

  /**
   * Logout user by revoking token
   */
  static async logout(token: string): Promise<void> {
    await db
      .update(organizationSessions)
      .set({ revokedAt: new Date() })
      .where(eq(organizationSessions.token, token));
  }

  /**
   * Verify token is valid and not revoked
   */
  static async isSessionValid(token: string): Promise<boolean> {
    const [session] = await db
      .select()
      .from(organizationSessions)
      .where(eq(organizationSessions.token, token));

    if (!session) return false;
    if (session.revokedAt) return false;
    if (new Date() > session.expiresAt) return false;

    return true;
  }

  /**
   * Get user by ID
   */
  static async getUserById(
    userId: string,
    organizationId: string
  ): Promise<OrganizationUser | null> {
    const [user] = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.id, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      );

    return user || null;
  }

  /**
   * Check if user has permission for action
   */
  static canPerformAction(
    userRole: string,
    action: string
  ): boolean {
    const permissions: Record<string, string[]> = {
      owner: [
        "manage_team",
        "manage_billing",
        "delete_organization",
        "view_audit_logs",
        "manage_hosts",
        "manage_alerts",
        "manage_settings",
        "view_metrics",
      ],
      admin: [
        "manage_team",
        "manage_hosts",
        "manage_alerts",
        "manage_settings",
        "view_metrics",
      ],
      member: ["manage_hosts", "manage_alerts", "view_metrics"],
      viewer: ["view_metrics"],
    };

    return (permissions[userRole] || []).includes(action);
  }
}
