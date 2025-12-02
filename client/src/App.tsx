import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { OrganizationProvider, useOrganization } from "@/lib/organization-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddOrganizationDialog } from "@/components/add-organization-dialog";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Hosts from "@/pages/hosts";
import HostDetail from "@/pages/host-detail";
import Agents from "@/pages/agents";
import Alerts from "@/pages/alerts";
import Roadmap from "@/pages/roadmap";
import Settings from "@/pages/settings";
import type { Organization } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/hosts" component={Hosts} />
      <Route path="/hosts/:id" component={HostDetail} />
      <Route path="/agents" component={Agents} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/settings" component={Settings} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="sentinel-theme">
        <TooltipProvider>
          <OrganizationProvider>
            <AppContent />
            <Toaster />
          </OrganizationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
