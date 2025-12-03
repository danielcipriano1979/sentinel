import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { OrganizationProvider, useOrganization } from "@/lib/organization-context";
import { AuthContext } from "@/hooks/useAuthContext";
import { UserContextProvider } from "@/contexts/UserContext";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddOrganizationDialog } from "@/components/add-organization-dialog";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Hosts from "@/pages/hosts";
import HostDetail from "@/pages/host-detail";
import Agents from "@/pages/agents";
import Alerts from "@/pages/alerts";
import Roadmap from "@/pages/roadmap";
import Settings from "@/pages/settings";
import { AdminLoginPage } from "@/pages/admin-login";
import { AdminRegisterPage } from "@/pages/admin-register";
import { AdminDashboardPage } from "@/pages/admin-dashboard";
import { AdminTenantsPage } from "@/pages/admin-tenants";
import { AdminTenantDetailsPage } from "@/pages/admin-tenant-details";
import { AdminAuditLogsPage } from "@/pages/admin-audit-logs";
import { AdminSettingsPage } from "@/pages/admin-settings";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { InvitePage } from "@/pages/invite";
import { OrganizationMembersPage } from "@/pages/organization-members";
import { OrganizationSettingsPage } from "@/pages/organization-settings";
import type { Organization } from "@shared/schema";

function Router() {
  return (
    <Switch>
      {/* User Auth Routes (public) */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/invite/:token">
        {(params) => <InvitePage params={params} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/register" component={AdminRegisterPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/tenants" component={AdminTenantsPage} />
      <Route path="/admin/tenants/:id" component={AdminTenantDetailsPage} />
      <Route path="/admin/audit-logs" component={AdminAuditLogsPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />

      {/* Protected Tenant Routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/hosts">
        <ProtectedRoute>
          <Hosts />
        </ProtectedRoute>
      </Route>
      <Route path="/hosts/:id">
        <ProtectedRoute>
          <HostDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/agents">
        <ProtectedRoute>
          <Agents />
        </ProtectedRoute>
      </Route>
      <Route path="/alerts">
        <ProtectedRoute>
          <Alerts />
        </ProtectedRoute>
      </Route>
      <Route path="/roadmap">
        <ProtectedRoute>
          <Roadmap />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/organization-members">
        <ProtectedRoute roles={["owner", "admin"]}>
          <OrganizationMembersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/organization-settings">
        <ProtectedRoute roles={["owner", "admin"]}>
          <OrganizationSettingsPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const { setOrganizations, organizations } = useOrganization();

  const { data: orgsData } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  useEffect(() => {
    if (orgsData) {
      setOrganizations(orgsData);
    }
  }, [orgsData, setOrganizations]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar onAddOrganization={() => setAddOrgOpen(true)} />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <AddOrganizationDialog open={addOrgOpen} onOpenChange={setAddOrgOpen} />
    </>
  );
}

function App() {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("admin_token");
  });

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("admin_token", adminToken);
    } else {
      localStorage.removeItem("admin_token");
    }
  }, [adminToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="sentinel-theme">
        <TooltipProvider>
          <AuthContext.Provider value={{ adminToken, setAdminToken }}>
            <UserContextProvider>
              <OrganizationProvider>
                <AppContent />
                <Toaster />
              </OrganizationProvider>
            </UserContextProvider>
          </AuthContext.Provider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
