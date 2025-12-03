# Admin System Setup & Testing Guide

## Quick Start

### 1. Build the Project

```bash
npm run build
```

The build includes all new admin pages and backend services.

### 2. Create First Admin User

Before logging in, you need to create an admin account via the registration page.

**Via API (recommended for first setup):**

```bash
curl -X POST http://localhost:5000/api/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Via Web UI:**
1. Navigate to `http://localhost:5000/admin/register`
2. Fill in email, password, and name
3. Click "Create Admin Account"
4. You'll be redirected to login page

### 3. Start the Application

```bash
npm start
```

Server runs on port 5000 (http://localhost:5000)

### 4. Access Admin Panel

**Login:** http://localhost:5000/admin/login
- Email: admin@example.com
- Password: SecurePassword123!

After successful login, you'll be redirected to the admin dashboard.

## Features Overview

### Admin Dashboard (`/admin`)
- **View Statistics:**
  - Total tenants count
  - Active vs suspended tenants
  - Total hosts being monitored
  - Estimated monthly revenue

- **Quick Access:**
  - Recent tenants list
  - Tenant distribution by plan
  - System health status
  - Links to all management pages

### Tenants Management (`/admin/tenants`)
- **Search & Filter:**
  - Search by tenant name or slug
  - Filter by status (active/suspended/canceled)

- **Actions:**
  - Suspend tenants (prevents access)
  - Reactivate suspended tenants
  - View tenant details
  - Change subscription plan

### Tenant Details (`/admin/tenants/:id`)
- **Information:**
  - Tenant name, slug, creation date
  - Current plan and limits
  - Host and alert usage
  - Subscription status

- **Management:**
  - Change subscription plan
  - Impersonate tenant (future)
  - Manage tenant users (future)
  - View billing history (future)

### Audit Logs (`/admin/audit-logs`)
- **View all admin actions:**
  - Tenant suspensions/reactivations
  - Plan changes
  - User management actions
  - System configuration changes

- **Filtering:**
  - By action type (suspend, reactivate, etc.)
  - By organization
  - By date range

- **Export:**
  - Export to CSV for compliance

### System Settings (`/admin/settings`)
- **Account Management:**
  - Setup/enable Two-Factor Authentication (MFA)
  - Manage subscription plans
  - View system status

- **Create Plans:**
  - Define new subscription tiers
  - Set host limits, user limits, rule limits
  - Set monthly pricing

- **Feature Flags:**
  - View system features (future configuration)

## Two-Factor Authentication (MFA) Setup

### Enable MFA for Your Admin Account

1. Go to `/admin/settings`
2. Click "Setup MFA"
3. Scan QR code with authenticator app:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - Any TOTP app

4. Enter 6-digit code from app
5. Click "Verify & Enable"

### Login with MFA Enabled

1. Go to `/admin/login`
2. Enter email and password
3. If MFA enabled, you'll be prompted for 6-digit code
4. Check authenticator app and enter code
5. Click "Verify"

### Disable MFA

1. Go to `/admin/settings`
2. Click "Setup MFA" again
3. Select "Disable MFA"
4. Enter your password to confirm
5. MFA will be disabled

## API Endpoints

### Authentication

```
POST /api/admin/auth/register
POST /api/admin/auth/login
POST /api/admin/auth/logout
```

### MFA Management

```
POST /api/admin/mfa/setup
POST /api/admin/mfa/enable
POST /api/admin/mfa/disable
```

### Tenant Management

```
GET  /api/admin/tenants
GET  /api/admin/tenants/:id
PATCH /api/admin/tenants/:id/status
PATCH /api/admin/tenants/:id/plan
```

### Subscription Plans

```
GET  /api/subscription-plans
POST /api/admin/subscription-plans
```

### Audit Logs

```
GET /api/admin/audit-logs
```

## Testing Scenarios

### Scenario 1: Create Admin & Login

```
1. POST /api/admin/auth/register
   - Create admin@test.com account
2. Navigate to /admin/login
3. Login with credentials
4. Should redirect to /admin (dashboard)
```

### Scenario 2: Setup MFA

```
1. While logged in, go to /admin/settings
2. Click "Setup MFA"
3. Scan QR code with authenticator
4. Enter 6-digit code
5. MFA enabled - shown in account settings
6. Logout and login again
7. Login flow should require MFA code
```

### Scenario 3: Manage Tenants

```
1. Go to /admin/tenants
2. List should show all organizations
3. Search for tenant by name
4. Click "View" button
5. See tenant details, plan info, usage stats
6. Change subscription plan
7. Action should appear in /admin/audit-logs
```

### Scenario 4: View Audit Logs

```
1. Go to /admin/audit-logs
2. Filter by action type (update_plan, suspend_org, etc.)
3. Logs show: timestamp, admin, action, resource, changes
4. Click "Export as CSV" to download audit log
```

### Scenario 5: Create Subscription Plan

```
1. Go to /admin/settings
2. Scroll to "Create New Plan" section
3. Fill in:
   - Plan name: "Custom"
   - Monthly price: 4999 (cents, = $49.99)
   - Max hosts: 20
   - Max users: 10
   - Max alert rules: 100
4. Click "Create Plan"
5. New plan appears in list above
6. Can assign to tenants
```

## Database

### New Tables Created

**admin_users**
- Stores admin accounts with password hashes and MFA secrets
- Only accessible by system administrators

**admin_sessions**
- Tracks JWT tokens for logout/revocation
- Session expires after 24 hours

**subscription_plans**
- Defines available subscription tiers
- Pro, Enterprise, Custom plans

**organization_plans**
- Links each organization to their subscription plan
- Tracks billing period and status

**audit_logs**
- Records all admin actions
- Includes before/after values for changes
- Useful for compliance and debugging

### Database Migrations

Migrations are automatically handled by Drizzle ORM.

To manually apply migrations:
```bash
npm run db:push
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `PORT` - Server port (default: 5000)

### Optional
- `JWT_SECRET` - Secret for signing JWT tokens
  - Default: "your-secret-key-change-me"
  - **CHANGE IN PRODUCTION!**

### Example .env
```
DATABASE_URL=postgresql://user:password@host/database
PORT=5000
JWT_SECRET=your-very-secure-secret-key-here
```

## Troubleshooting

### Build Errors

If you see TypeScript errors after changes:
```bash
npm run build
```

### Database Connection

If admin endpoints return 500 errors:
1. Check `DATABASE_URL` is correct
2. Ensure tables exist: `npm run db:push`
3. Check server logs for SQL errors

### MFA Not Working

- Ensure system time is in sync (TOTP requires accurate time)
- Try codes from before and after current time (window tolerance: ±2)
- Check that authenticator app has internet for time sync

### Token Expiration

JWT tokens expire after 24 hours. User must login again.

To extend token lifetime, edit `server/admin-auth.ts`:
```typescript
const JWT_EXPIRY = "24h"; // Change this value
```

## Security Best Practices

1. **Change JWT_SECRET in production**
   - Use a random, strong secret
   - Store in environment variables
   - Never commit to version control

2. **Enable MFA**
   - All admin accounts should have MFA
   - Especially accounts with plan modification access

3. **Regular password changes**
   - Prompt users to change passwords monthly
   - Store with bcryptjs hashing (never plaintext)

4. **Monitor audit logs**
   - Review logs regularly
   - Alert on suspicious activity
   - Archive logs for compliance

5. **Use HTTPS in production**
   - All admin endpoints should use HTTPS
   - Include secure cookie flag

## Next Steps

### Tenant Side Implementation (Topic 2)

Would include:
- Tenant user management
- Tenant-specific settings
- Billing and invoices
- Tenant audit logs
- Team management

### Admin Features to Add

- Admin user management (create/delete admins)
- Role-based access control (RBAC)
- Advanced analytics dashboard
- Automated reports
- Webhooks for events
- API keys for integrations

## Support

For issues or questions, check:
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Detailed implementation overview
- `server/admin-routes.ts` - Backend endpoints
- `client/src/pages/admin-*.tsx` - Frontend pages
- `multi.md` - Original requirements

---

Implemented with secure defaults. Enjoy your multi-tenant SaaS admin panel!
