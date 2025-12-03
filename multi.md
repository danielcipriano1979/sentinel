Multi-Tenant SaaS — Project Requirements (Short)

We are building a multi-tenant SaaS platform using PostgreSQL.
The system must include:

1. Admin Side (Global Control Panel)

Pages:

Admin Login (MFA required)

Dashboard (tenants, usage, plans, system status)

Tenants List (search, filter, suspend/reactivate)

Tenant Details (users, settings, billing, impersonation)

System Settings (global config, feature flags)

Audit Logs (all admin actions)

2. Tenant Side (Customer Workspace)

Pages:

Tenant Login

Tenant Dashboard

Users Management

Tenant Settings

Billing & Plan

Logs / Activity

3. Database Rules (PostgreSQL)

Single database with tenant_id on all tenant tables.

Admin accounts stored in a separate table.

JSONB for tenant settings.

Audit log for every admin and tenant action.

4. Authentication

JWT access tokens (short-lived).

Refresh tokens stored in DB.

MFA for admin accounts.

5. Core Goals

Simple and secure multi-tenant foundation.

Clean separation between admin pages and tenant pages.

Easy to extend and maintain.