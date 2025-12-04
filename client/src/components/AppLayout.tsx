import { useLocation } from "wouter";
import { useUser } from "@/hooks/useUser";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();

  // Check if current route is a public auth page
  const isPublicAuthPage =
    location === "/login" ||
    location === "/register" ||
    location.startsWith("/invite/") ||
    location === "/admin/login" ||
    location === "/admin/register";

  // Only show sidebar for authenticated users on protected routes
  const showSidebar = user && !isPublicAuthPage;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Render without sidebar for public pages
  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  // Render with sidebar for authenticated users
  return (
    <>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          {showSidebar && <AppSidebar />}
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                {showSidebar && <SidebarTrigger data-testid="button-sidebar-toggle" />}
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {showSidebar && <UserProfile />}
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
