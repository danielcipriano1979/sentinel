# User Authentication & Company Registration Implementation

## Overview

This document describes the implementation of user authentication and company registration for HostWatch. The system supports separate flows for creating new companies and joining existing organizations with role-based access control.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              User Registration & Login                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Flow 1: Create New Company              Flow 2: Join Org │
│  ┌──────────────────────┐               ┌──────────────────┐
│  │ Register New User     │               │  Accept Invite   │
│  │ + New Organization    │               │  + Use Token     │
│  │                       │               │                  │
│  │ POST /api/auth/       │               │ POST /api/auth/  │
│  │ register              │               │ register/        │
│  │                       │               │ invitation       │
│  └──────────────────────┘               └──────────────────┘
│           ↓                                        ↓
│  Owner of new org                   Member of existing org
│           ↓                                        ↓
│  ┌──────────────────────────────────────────────────────┐
│  │  Authentication Token (JWT, 24-hour expiry)          │
│  │  Stored in localStorage                               │
│  └──────────────────────────────────────────────────────┘
│           ↓
│  ┌──────────────────────────────────────────────────────┐
│  │  Role-Based Redirect                                  │
│  │  - Owner/Admin → Organization Dashboard              │
│  │  - Member → Dashboard                                 │
│  │  - Viewer → Dashboard (read-only)                     │
│  │  - System Admin → Admin Panel                         │
│  └──────────────────────────────────────────────────────┘
```

## Database Schema

### New Tables

#### organization_users
- `id` (UUID, PK) - User identifier
- `organizationId` (varchar, FK) - Organization
- `email` (text) - User email (unique per org)
- `passwordHash` (text) - BCrypt hashed password
- `firstName`, `lastName` (text) - User name
- `role` (text) - owner, admin, member, viewer
- `emailVerified` (boolean) - Email verification status
- `lastLoginAt` (timestamp) - Last login time
- `createdAt`, `updatedAt` (timestamp) - Timestamps

#### organization_sessions
- `id` (UUID, PK) - Session identifier
- `userId` (UUID, FK) - User reference
- `token` (text) - JWT token
- `expiresAt` (timestamp) - Token expiration
- `revokedAt` (timestamp, nullable) - Logout timestamp
- `createdAt` (timestamp) - Session creation

#### user_invitations
- `id` (UUID, PK) - Invitation identifier
- `organizationId` (varchar, FK) - Organization
- `email` (text) - Invited email
- `role` (text) - Role to be granted
- `invitedBy` (UUID, FK, nullable) - Inviting user
- `token` (text) - Invitation token (7-day expiry)
- `expiresAt` (timestamp) - Expiration date
- `acceptedAt` (timestamp, nullable) - When accepted
- `createdAt` (timestamp) - Creation date

### Updated Tables

#### organizations
- Added relationship to `organization_users`
- Can now be associated with multiple users

## Backend Implementation

### 1. User Authentication Service (`server/user-auth.ts`)

```typescript
UserAuthService {
  // Password Management
  static hashPassword(password: string): Promise<string>
  static verifyPassword(password: string, hash: string): Promise<boolean>

  // Token Management
  static generateToken(payload: UserToken): string
  static verifyToken(token: string): UserToken | null
  static async isSessionValid(token: string): Promise<boolean>

  // Registration
  static async registerWithOrganization(...): Promise<{user, organization, token}>
  static async registerAsOrganizationMember(...): Promise<{user, token}>

  // Login/Logout
  static async login(organizationId, email, password): Promise<{user, token}>
  static async logout(token: string): Promise<void>

  // Utilities
  static async getUserById(userId, organizationId): Promise<OrganizationUser | null>
  static canPerformAction(userRole, action): boolean
}
```

**Key Features:**
- BCrypt password hashing (10 rounds)
- JWT tokens with 24-hour expiry
- Session tracking in database
- Token revocation on logout
- Role-based permission checking

### 2. User Routes (`server/user-routes.ts`)

#### Authentication Endpoints

```
POST /api/auth/register
  Create new user + organization
  Body: {email, password, firstName, lastName, organizationName, organizationSlug}
  Response: {user, organization, token}

POST /api/auth/login
  Login existing user
  Body: {organizationSlug, email, password}
  Response: {user, organization, token}

POST /api/auth/logout
  Logout and revoke token
  Headers: Authorization: Bearer <token>
  Response: {success: true}

GET /api/auth/me
  Get current user info
  Headers: Authorization: Bearer <token>
  Response: {user, organization}

POST /api/auth/register/invitation
  Register using invitation token
  Body: {invitationToken, password, firstName, lastName}
  Response: {user, organization, token}
```

#### Organization Member Management

```
GET /api/organizations/:id/members
  List all members
  Response: {members: [{id, email, name, role, lastLoginAt}]}

PUT /api/organizations/:id/members/:userId
  Update member role
  Body: {role: "owner" | "admin" | "member" | "viewer"}
  Response: {user}

DELETE /api/organizations/:id/members/:userId
  Remove member
  Response: {success: true}

POST /api/organizations/:id/invitations
  Send invitation
  Body: {email, role}
  Response: {invitation: {id, email, role, token, expiresAt}}
```

### 3. Middleware & Access Control

```typescript
// Verify JWT token and attach user to request
verifyUserToken(req, res, next)

// Ensure user belongs to organization
requireOrganization(req, res, next)

// Ensure user has specific role(s)
requireRole(...roles)
```

### 4. Storage Methods (`server/storage.ts`)

```typescript
// User management
getOrganizationUsers(organizationId): Promise<OrganizationUser[]>
updateOrganizationUserRole(userId, organizationId, role): Promise<OrganizationUser>
removeOrganizationUser(userId, organizationId): Promise<void>

// Invitations
createUserInvitation(organizationId, email, role, invitedBy): Promise<UserInvitation>
getUserInvitation(token): Promise<UserInvitation>
```

## Frontend Implementation (TODO)

### 1. Authentication Context (`client/src/contexts/UserContext.tsx`)

```typescript
type UserContextType = {
  user: OrganizationUser | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  register(...)
  loginWithOrganization(...)
  loginWithInvitation(...)
  logout()
  refreshUser()
}

UserContext.Provider
  Manages auth state
  Persists token to localStorage
  Provides to entire app
```

### 2. Pages to Create

#### `/register` - Company Registration
```
Register New Company
┌────────────────────────────────────┐
│ First Name              [________] │
│ Last Name               [________] │
│ Email                   [________] │
│ Password (8+ chars)     [________] │
│ Company Name            [________] │
│ Company URL Slug        [________] │
│                                    │
│        [Create Company & Account] │
└────────────────────────────────────┘

Flow:
1. Validate inputs
2. POST /api/auth/register
3. Store token in localStorage
4. Redirect to /dashboard
```

#### `/login` - Company Login
```
Select Company First
┌────────────────────────────────────┐
│ Company Name/Slug        [______▼] │
│ (Autocomplete from slug)            │
└────────────────────────────────────┘
         OR Create New

After selection:
┌────────────────────────────────────┐
│ Email                   [________] │
│ Password                [________] │
│                                    │
│            [Login]        [Sign Up] │
└────────────────────────────────────┘

Flow:
1. User selects/enters organization slug
2. Input email and password
3. POST /api/auth/login
4. Check user role
5. Redirect based on role
```

#### `/invite/:token` - Accept Invitation
```
You've been invited to join Company ABC
┌────────────────────────────────────┐
│ First Name              [________] │
│ Last Name               [________] │
│ Password (8+ chars)     [________] │
│                                    │
│      [Accept Invitation]           │
└────────────────────────────────────┘

Flow:
1. Validate token format
2. POST /api/auth/register/invitation
3. Automatically login
4. Redirect to /dashboard
```

### 3. Components to Create

#### `<LoginForm />` - Reusable login
```
Props:
  organizationSlug: string
  onSuccess: (token, user, org) => void
  onError: (error) => void
```

#### `<RegisterForm />` - Company registration
```
Props:
  onSuccess: (token, user, org) => void
  onError: (error) => void
```

#### `<MemberManagement />` - Admin only
```
Display members table with:
  - Member name, email, role
  - Action buttons: change role, remove
  - Bulk invite form
```

#### `<InvitationModal />` - Send invites
```
Props:
  organizationId: string
  onInvitationSent: () => void
```

### 4. Role-Based Redirect Logic

```typescript
// In login/register success handler
const handleAuthSuccess = (user, token) => {
  localStorage.setItem("user_token", token);

  if (user.role === "owner" || user.role === "admin") {
    navigate("/dashboard/settings");  // Can manage team
  } else if (user.role === "member") {
    navigate("/dashboard");  // Full access
  } else if (user.role === "viewer") {
    navigate("/dashboard?readonly=true");  // Read-only
  }
};

// Check for system admin
if (isSystemAdmin) {
  navigate("/admin");
}
```

### 5. Protected Route Component

```typescript
<ProtectedRoute
  requiredRole={["owner", "admin"]}
  fallback={<Redirect to="/unauthorized" />}
>
  <MemberManagementPage />
</ProtectedRoute>
```

## API Integration Examples

### Frontend API Client

```typescript
// api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const authAPI = {
  register: (data) =>
    fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  login: (organizationSlug, email, password) =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({organizationSlug, email, password}),
    }).then(r => r.json()),

  logout: (token) =>
    fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    }).then(r => r.json()),

  getMe: (token) =>
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(r => r.json()),
};
```

## User Roles & Permissions

| Role | Manage Team | Manage Hosts | Manage Alerts | View Metrics | Delete Org | View Audit |
|------|-------------|--------------|---------------|--------------|-----------|-----------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Member | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |

## Email Workflow (TODO)

### Invitation Email Template

```
Subject: You're invited to join [Company] on HostWatch

Hi [Name],

[Inviter] has invited you to join [Company] on HostWatch.

Click the link below to accept:
https://hostwatch.example.com/invite/[TOKEN]

This invitation expires in 7 days.

---
HostWatch Team
```

**Implementation Steps:**
1. Add email service (SendGrid, Mailgun, or SMTP)
2. Create email template
3. Send in `POST /api/organizations/:id/invitations`
4. Track email sent status

## Migration & Deployment

### Database Migration

```bash
# Run migrations to create new tables
npm run db:push
```

Tables created:
- `organization_users`
- `organization_sessions`
- `user_invitations`

### Environment Variables

Add to `.env`:
```env
JWT_SECRET=your-secure-secret-here
# Optional email service
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@hostwatch.com
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  JWT_SECRET: "your-prod-secret"
```

## Security Considerations

1. **Password Hashing**: BCrypt with 10 rounds
2. **JWT Secret**: Must be changed in production
3. **Token Expiry**: 24 hours, renewable on login
4. **Session Revocation**: Token tracked in DB for logout
5. **HTTPS Only**: Use secure cookies in production
6. **CORS**: Configure for frontend domain
7. **Rate Limiting**: Implement on auth endpoints
8. **Input Validation**: Zod schemas on all inputs

## Testing Checklist

### Backend
- [ ] Register new user + organization
- [ ] Login with email/password
- [ ] Login fails with wrong credentials
- [ ] Token validation works
- [ ] Logout revokes token
- [ ] Accept invitation with valid token
- [ ] Reject expired invitation
- [ ] Role-based permissions enforced
- [ ] Cannot remove last owner

### Frontend
- [ ] Register page creates account and company
- [ ] Login page accepts organization slug
- [ ] Role-based redirect works correctly
- [ ] Token persists across page reload
- [ ] Logout clears token
- [ ] Protected routes blocked without token
- [ ] Invitation link navigates to signup

## Files Changed/Created

### Schema
- `shared/schema.ts` - Added 3 new tables + types

### Backend
- `server/user-auth.ts` - **NEW** - Authentication service
- `server/user-routes.ts` - **NEW** - Auth endpoints
- `server/storage.ts` - Updated with user methods
- `server/index.ts` - Register user routes

### Frontend (TODO)
- `client/src/contexts/UserContext.tsx` - **NEW**
- `client/src/hooks/useUser.ts` - **NEW**
- `client/src/pages/register.tsx` - **NEW**
- `client/src/pages/login.tsx` - **NEW**
- `client/src/pages/invite/:token.tsx` - **NEW**
- `client/src/components/LoginForm.tsx` - **NEW**
- `client/src/components/RegisterForm.tsx` - **NEW**
- `client/src/components/MemberManagement.tsx` - **NEW**

## Next Steps

1. **Frontend Development**
   - Create authentication context
   - Build login/register pages
   - Implement role-based routing

2. **Email Integration**
   - Add email service
   - Create invitation templates
   - Send invitations

3. **Testing**
   - Unit tests for auth service
   - Integration tests for endpoints
   - E2E tests for user flows

4. **Security Hardening**
   - Implement rate limiting
   - Add CSRF protection
   - Configure CORS properly

5. **UI/UX Improvements**
   - Add password reset flow
   - Email verification
   - Profile management

## Support & Debugging

### Common Issues

**"Invalid or expired invitation"**
- Check token hasn't expired (7 days)
- Verify token is correct
- Ensure invitation status is pending

**"Invalid email or password"**
- Check organization slug is correct
- Verify credentials in database
- Email is case-sensitive per organization

**"Token expired"**
- User must login again
- Consider refresh token flow for future

## Conclusion

The user authentication system is now ready for:
- Company registration with immediate owner access
- Email invitations for team onboarding
- Role-based access control
- Secure JWT-based authentication
- Team member management

Remaining work is primarily frontend UI implementation.
