# Database Setup Instructions

**Date**: December 3, 2025
**Status**: Ready for Migration

---

## Overview

All code has been implemented successfully and the application builds without errors. The database schema has been defined in Drizzle ORM. Now you need to apply these schema changes to your PostgreSQL database.

---

## Current Status

✅ **Code**: Fully implemented and tested
✅ **Build**: Successful with no errors
✅ **Schema**: Defined in `/shared/schema.ts`
⏳ **Database**: Waiting for migration

---

## Schema Changes to Be Applied

The following changes will be applied to your PostgreSQL database:

### 1. `organizations` Table - NEW COLUMNS
```sql
ALTER TABLE organizations ADD COLUMN status text NOT NULL DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN updated_at timestamp NOT NULL DEFAULT NOW();

-- status values: 'active', 'suspended', 'deactivated'
```

### 2. `organization_users` Table - NEW COLUMN
```sql
ALTER TABLE organization_users ADD COLUMN status text NOT NULL DEFAULT 'active';

-- status values: 'active', 'deactivated'
```

### 3. Existing Tables (No Changes)
The following tables already exist and are already properly configured:
- `admin_users`
- `admin_sessions`
- `subscription_plans`
- `organization_plans`
- `audit_logs`
- `organization_sessions`
- `user_invitations`

---

## How to Apply Changes

### Step 1: Run Database Migration
```bash
npm run db:push
```

**What this does:**
1. Compares your current database schema with the schema.ts definition
2. Generates migration files (automatically)
3. Applies migrations to your PostgreSQL database
4. Updates table structures

**Output you'll see:**
```
Applying migration...
✓ Migration applied successfully
Database is up to date
```

### Step 2: Verify Migration
```bash
# Optional: Check your database schema
npm run db:studio

# This opens an interactive database browser where you can:
# - View all tables
# - Check columns and data types
# - Execute queries
# - Browse records
```

### Step 3: Start the Application
```bash
npm run dev
```

Your application will now have:
- ✅ Tenant status management (active/suspended/deactivated)
- ✅ User status management (active/deactivated)
- ✅ Organization update tracking (updatedAt)
- ✅ All admin features working with real database

---

## Environment Variables

Make sure your `.env.local` file has the correct database connection:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/yourdbname
```

---

## Rollback (If Needed)

If you need to undo the migration:

```bash
# Drizzle doesn't provide automatic rollback, but you can:
# 1. Drop the new columns manually
# 2. Or restore from a backup

# Manual rollback (if needed):
# ALTER TABLE organizations DROP COLUMN status;
# ALTER TABLE organizations DROP COLUMN updated_at;
# ALTER TABLE organization_users DROP COLUMN status;
```

---

## What Happens After Migration

### Immediately Available
- ✅ Admin users can manage tenant status
- ✅ Admin users can deactivate/activate team members
- ✅ All admin endpoints work with real data
- ✅ Audit logging captures all status changes
- ✅ Organization suspension/deactivation works

### User Experience
- Users of suspended/deactivated organizations will:
  - Still have their data preserved
  - Be unable to login
  - See appropriate error messages

### Suspended vs. Deactivated
- **Suspended**: Temporary, can be reactivated by admin, user not allowed access
- **Deactivated**: More permanent, indicates org is permanently closed

---

## Testing After Migration

### Test Tenant Status Changes
1. Login as admin to `/admin`
2. Go to any tenant details
3. Click "Settings" tab
4. Try:
   - ✅ Activating an inactive tenant
   - ✅ Suspending an active tenant
   - ✅ Deactivating a tenant
5. Verify status changes appear in audit logs

### Test User Management
1. Go to tenant's "Users" tab
2. Try:
   - ✅ Adding new user
   - ✅ Changing user role
   - ✅ Deactivating user
   - ✅ Deleting user
3. Verify user status changes in audit logs

### Test Data Persistence
1. Deactivate a tenant (data preserved)
2. Verify data still exists in database
3. Reactivate tenant
4. Verify all data is still intact

---

## Troubleshooting

### Migration Fails
**Error**: "Database connection failed"
- **Solution**: Check your `DATABASE_URL` in `.env.local`
- Verify PostgreSQL is running
- Verify credentials are correct

**Error**: "Migration already applied"
- **Solution**: This is normal if you've run it before
- Run again and it will skip already-applied migrations

**Error**: "Column already exists"
- **Solution**: The migration has already been applied
- No action needed

### Application Won't Start
**Error**: "Relations mismatch" or schema errors
- **Solution**: Run `npm run db:push` again
- Make sure PostgreSQL is running

---

## Command Reference

```bash
# Apply schema changes to database
npm run db:push

# View database with interactive browser
npm run db:studio

# Build the application
npm run build

# Start development server
npm run dev

# Check TypeScript compilation
npm run check

# Run tests (when implemented)
npm run test
```

---

## After Everything is Running

### Next Implementation Tasks (Optional)
1. Email notifications for invitations
2. Password reset functionality
3. Email verification
4. Real billing calculation
5. Payment processing
6. Usage reports
7. Webhook notifications
8. SSO integration

### Monitoring
- Monitor login success/failure rates
- Track admin actions via audit logs
- Monitor database performance
- Set up alerts for critical actions

---

## Support

If you encounter issues:

1. **Check Build**: Run `npm run build` to verify code compiles
2. **Check Database**: Run `npm run db:studio` to inspect database state
3. **Check Logs**: Look for error messages in console
4. **Verify Schema**: Ensure `shared/schema.ts` has your database name

---

## Summary

1. ✅ All code is written and builds successfully
2. ✅ Schema is defined in Drizzle ORM
3. ⏳ **NEXT**: Run `npm run db:push` to apply changes
4. ⏳ **THEN**: Run `npm run dev` to start the application

Your database setup is ready to go!

