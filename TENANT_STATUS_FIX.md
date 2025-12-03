# Tenant Status Update Issue - Fix Applied

## Problem Description

The tenant status update functionality on the admin tenant settings page was not working properly:
- Clicking Activate, Suspend, or Deactivate buttons appeared to work but the status would not update
- The dashboard did not reflect status changes
- Error messages were not displayed to the user

## Root Causes Identified

### 1. **Query Cache Invalidation Issue**
**Location**: `client/src/pages/admin-tenant-settings.tsx`

**Problem**:
- When a tenant status was updated, the settings page would invalidate its local query cache (`admin-tenant-settings-${id}`)
- However, the dashboard uses a different query key (`admin-tenants`)
- These two queries were not synchronized, so the dashboard would show stale data

**Original Code** (lines 69-79):
```typescript
onSuccess: () => {
  setSuccess("Tenant status updated");
  queryClient.invalidateQueries({
    queryKey: [`admin-tenant-settings-${id}`],
  });
  setTimeout(() => setSuccess(""), 3000);
},
onError: (error: any) => {
  setError(error.message);
},
```

**Fix Applied**:
```typescript
onSuccess: () => {
  setSuccess("Tenant status updated");
  // Invalidate both the specific tenant and the tenants list
  queryClient.invalidateQueries({
    queryKey: [`admin-tenant-settings-${id}`],
  });
  queryClient.invalidateQueries({
    queryKey: ["admin-tenants"],  // Added this
  });
  setTimeout(() => setSuccess(""), 3000);
},
onError: (error: any) => {
  setError(error.message);
  setTimeout(() => setError(""), 5000);  // Added auto-hide for errors
},
```

### 2. **Inconsistent Error Handling in Tenants List Page**
**Location**: `client/src/pages/admin-tenants.tsx`

**Problem**:
- The suspend and reactivate functions were not properly handling errors
- No error feedback was given to the user if the operation failed
- The endpoint being called was different from the settings page

**Original Code** (lines 60-104):
```typescript
const handleSuspend = async (tenantId: string) => {
  try {
    const response = await fetch(`/api/admin/tenants/${tenantId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "suspended" }),
    });

    if (response.ok) {
      refetch();
    }
    // Missing error handling!
  } catch (error) {
    console.error("Failed to suspend tenant:", error);
  }
};
```

**Issues**:
1. Using `/api/admin/tenants/{tenantId}/status` endpoint instead of `/api/admin/tenants/{tenantId}`
2. Only checking `response.ok` but not handling the response when it's not ok
3. No error message shown to user
4. Refetch not awaited

**Fix Applied**:
```typescript
const handleSuspend = async (tenantId: string) => {
  if (!window.confirm("Are you sure you want to suspend this tenant?")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/tenants/${tenantId}`, {  // Changed endpoint
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "suspended" }),
    });

    if (!response.ok) {  // Check if response is not ok
      const error = await response.json();
      throw new Error(error.error || "Failed to suspend tenant");
    }

    await refetch();  // Wait for refetch
  } catch (error) {
    console.error("Failed to suspend tenant:", error);
    alert(`Error: ${error instanceof Error ? error.message : "Failed to suspend tenant"}`);  // Show error
  }
};
```

## Changes Made

### File 1: `client/src/pages/admin-tenant-settings.tsx`
- ✅ Added invalidation of `admin-tenants` query cache
- ✅ Added auto-hide timer for error messages (5 seconds)

### File 2: `client/src/pages/admin-tenant-settings.tsx`
- ✅ Changed endpoint from `/api/admin/tenants/{id}/status` to `/api/admin/tenants/{id}` for consistency
- ✅ Added proper error response parsing
- ✅ Added user-facing error alerts
- ✅ Await refetch operation to ensure data is refreshed

## Backend Note

Both endpoints exist in the backend (`/api/admin/tenants/{id}` and `/api/admin/tenants/{id}/status`), so there's no backend change needed. However, using the main endpoint is more consistent with the settings page.

## Testing Instructions

### On Admin Tenant Settings Page
1. Navigate to `/admin/tenants/{tenant-id}/settings`
2. Click "Activate Tenant", "Suspend Tenant", or "Deactivate Tenant"
3. Confirm the action in the dialog
4. ✅ Status should update immediately on the page
5. ✅ Success message should appear for 3 seconds
6. ✅ Dashboard should reflect the change when navigated back

### On Admin Tenants List Page
1. Navigate to `/admin/tenants`
2. Click "Suspend" or "Reactivate" button on a tenant
3. Confirm the action
4. ✅ Status badge should update immediately
5. ✅ If there's an error, you should see an alert
6. ✅ Tenant list should refresh with new data

### Dashboard
1. Navigate to `/admin`
2. Check tenant status in the list
3. Make a status change from settings or tenants page
4. ✅ Dashboard should reflect the change when refreshed or when viewing the dashboard again

## Data Flow

### Before Fix
```
Settings Page Update → Invalidate Settings Query Only
                    → Dashboard doesn't know about the change
                    → Stale data displayed on dashboard
```

### After Fix
```
Settings Page Update → Invalidate Settings Query + Tenants Query
                    → Both pages refetch latest data
                    → Dashboard shows updated status
```

## Error Handling

### Before Fix
```
Error occurs → Only logged to console
            → User has no feedback
            → User doesn't know operation failed
```

### After Fix
```
Error occurs → Logged to console
            → Error message shown in alert
            → User knows operation failed
            → User can retry
```

## Files Modified

- ✅ `client/src/pages/admin-tenant-settings.tsx`
- ✅ `client/src/pages/admin-tenants.tsx`

## Deployment

No backend changes required. Just redeploy the frontend with these changes.

```bash
# Build and deploy
npm run build
# Deploy dist folder
```

## Verification Checklist

After deployment, verify:
- [ ] Can activate a suspended/deactivated tenant
- [ ] Can suspend an active tenant
- [ ] Can deactivate a tenant
- [ ] Status updates immediately on settings page
- [ ] Status updates immediately on tenants list
- [ ] Dashboard shows updated status
- [ ] Error messages display if operation fails
- [ ] Success messages display for 3 seconds
- [ ] Error messages display for 5 seconds

## Related Issues

This fix addresses the issue where:
- Tenant activation/suspension/deactivation was not working
- Status changes did not persist across pages
- No feedback was given to admin users about operation success/failure
