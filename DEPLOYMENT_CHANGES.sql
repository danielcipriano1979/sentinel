-- ============================================================================
-- HostWatch Deployment Database Changes
--
-- IMPORTANT: This file contains ALL database changes required for deployment.
-- DO NOT execute this file automatically - review each command carefully.
--
-- Recommended Approach:
-- 1. Use 'npm run db:push' which uses Drizzle ORM for safe migrations
-- 2. OR manually execute these commands one at a time
-- 3. Always test in a development environment first
-- 4. Always create a backup before executing
--
-- Date: December 3, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: organizations TABLE - Add Status and UpdatedAt Fields
-- ============================================================================
--
-- Purpose: Enable admin tenants to be activated, suspended, or deactivated
-- This allows system admins to control access to organizations
--
-- Impact:
--   - Allows org suspension (temporary block)
--   - Allows org deactivation (permanent suspension)
--   - Tracks when org was last modified
--   - Default status 'active' for all existing records
--

ALTER TABLE organizations
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Comment explaining the status values (optional but helpful)
COMMENT ON COLUMN organizations.status IS 'Organization status: active, suspended, deactivated';

-- Add updated_at timestamp field to track modifications
ALTER TABLE organizations
ADD COLUMN updated_at timestamp NOT NULL DEFAULT NOW();

-- Comment explaining updated_at field
COMMENT ON COLUMN organizations.updated_at IS 'Timestamp of last modification';

-- Create index for status queries (improves performance)
CREATE INDEX idx_organizations_status ON organizations(status);


-- ============================================================================
-- SECTION 2: organization_users TABLE - Add Status Field
-- ============================================================================
--
-- Purpose: Enable admin to deactivate/activate individual users
-- This allows system admins to control user access without deleting them
--
-- Impact:
--   - Users can be deactivated (preserved in database)
--   - Users can be reactivated
--   - Audit trail maintained
--   - Default status 'active' for all existing records
--

ALTER TABLE organization_users
ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Comment explaining the status values (optional but helpful)
COMMENT ON COLUMN organization_users.status IS 'User status: active, deactivated';

-- Create index for status queries (improves performance)
CREATE INDEX idx_organization_users_status ON organization_users(status);


-- ============================================================================
-- SECTION 3: Verification Queries
-- ============================================================================
--
-- Use these queries to verify the changes were applied correctly
-- You should see the new columns listed
--

-- Verify organizations table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'organizations'
-- ORDER BY ordinal_position;

-- Verify organization_users table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'organization_users'
-- ORDER BY ordinal_position;

-- Count organizations by status (after changes)
-- SELECT status, COUNT(*) as count FROM organizations GROUP BY status;

-- Count users by status (after changes)
-- SELECT status, COUNT(*) as count FROM organization_users GROUP BY status;


-- ============================================================================
-- SECTION 4: Rollback Instructions
-- ============================================================================
--
-- If you need to undo these changes, run:
--
-- DROP INDEX IF EXISTS idx_organizations_status;
-- DROP INDEX IF EXISTS idx_organization_users_status;
-- ALTER TABLE organizations DROP COLUMN status;
-- ALTER TABLE organizations DROP COLUMN updated_at;
-- ALTER TABLE organization_users DROP COLUMN status;
--
-- WARNING: Only do this if deployment needs to be reversed
--

-- ============================================================================
-- SECTION 5: What These Changes Enable
-- ============================================================================
--
-- After these changes, the following admin features will work:
--
-- 1. Tenant Status Management (Admin)
--    - View: /admin/tenants/:id/settings
--    - Actions: Activate, Suspend, Deactivate organizations
--    - API: PATCH /api/admin/tenants/:id
--    - Saves organization.status to 'active', 'suspended', or 'deactivated'
--
-- 2. User Status Management (Admin)
--    - View: /admin/tenants/:id/users
--    - Actions: Deactivate/Activate users, Delete users
--    - API: PATCH /api/admin/tenants/:id/users/:userId
--    - Saves organization_users.status to 'active' or 'deactivated'
--
-- 3. Audit Trail
--    - All status changes logged to audit_logs table
--    - Tracks admin ID, action, timestamp, before/after values
--    - Enables compliance and security reporting
--
-- 4. Organization Tracking
--    - organizations.updated_at tracks when org was last modified
--    - Useful for reporting and analytics
--    - Helps identify inactive/abandoned organizations
--

-- ============================================================================
-- SECTION 6: How to Execute This File
-- ============================================================================
--
-- Option 1: Using Drizzle ORM (Recommended)
--   $ npm run db:push
--
-- Option 2: Manual PostgreSQL Connection
--   $ psql -U your_username -d your_database
--   # Then paste the SQL commands above
--   # Review each command before executing
--   # Press Enter to execute
--
-- Option 3: Using psql with file input
--   $ psql -U your_username -d your_database -f DEPLOYMENT_CHANGES.sql
--   (Then review and uncomment verification queries to check results)
--

-- ============================================================================
-- SECTION 7: Success Indicators
-- ============================================================================
--
-- After executing, verify success:
--
-- 1. Connect to database
-- 2. Check table structure:
--    SELECT * FROM organizations LIMIT 1;
--    -- Should show: id, name, slug, status, createdAt, updatedAt
--
-- 3. Check user table:
--    SELECT * FROM organization_users LIMIT 1;
--    -- Should show: id, organizationId, email, passwordHash, role, status, ...
--
-- 4. Run these verification queries:
--    SELECT COUNT(*) FROM organizations WHERE status = 'active';
--    SELECT COUNT(*) FROM organization_users WHERE status = 'active';
--
-- 5. If all queries succeed, deployment is ready
--

-- ============================================================================
-- END OF DEPLOYMENT CHANGES
-- ============================================================================
