import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";
const JWT_EXPIRY = "24h";

export interface AdminAuthToken {
  adminUserId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AdminAuthService {
  // Hash password for storage
  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 10);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(adminUserId: string, email: string): string {
    return jwt.sign(
      { adminUserId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): AdminAuthToken | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminAuthToken;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Setup MFA (TOTP)
  static async setupMFA(adminUser: AdminUser): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `HostWatch Admin (${adminUser.email})`,
      issuer: "HostWatch",
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  // Verify MFA token
  static verifyMFAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow ±2 time windows
    });
  }

  // Create admin user (returns user without password hash)
  static async createAdminUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AdminUser> {
    const passwordHash = await this.hashPassword(password);

    const user = await storage.createAdminUser({
      email,
      passwordHash,
      firstName,
      lastName,
      mfaEnabled: false,
    });

    return user;
  }

  // Login admin
  static async loginAdmin(
    email: string,
    password: string,
    mfaToken?: string
  ): Promise<{ token: string; user: AdminUser; requiresMFA: boolean } | null> {
    const user = await storage.getAdminUserByEmail(email);
    if (!user) return null;

    // Verify password
    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) return null;

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return { token: "", user, requiresMFA: true };
      }

      // Verify MFA token
      if (!user.mfaSecret || !this.verifyMFAToken(user.mfaSecret, mfaToken)) {
        return null; // MFA token invalid
      }
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    // Create session record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await storage.createAdminSession({
      adminUserId: user.id,
      token,
      expiresAt,
    });

    // Update last login
    await storage.updateAdminUserLastLogin(user.id);

    return { token, user, requiresMFA: false };
  }

  // Enable MFA for admin
  static async enableMFA(adminUserId: string, mfaSecret: string): Promise<void> {
    await storage.updateAdminUserMFA(adminUserId, mfaSecret, true);
  }

  // Disable MFA for admin
  static async disableMFA(adminUserId: string): Promise<void> {
    await storage.updateAdminUserMFA(adminUserId, null, false);
  }

  // Revoke token (logout)
  static async revokeToken(token: string): Promise<void> {
    await storage.revokeAdminSession(token);
  }

  // Verify session is valid
  static async isSessionValid(token: string): Promise<boolean> {
    const session = await storage.getAdminSession(token);
    if (!session) return false;
    if (session.revokedAt) return false;
    if (new Date(session.expiresAt) < new Date()) return false;
    return true;
  }
}
