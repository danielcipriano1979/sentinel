import { useAuthContext } from "@/hooks/useAuthContext";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminProfile } from "@/components/admin-profile";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export function AdminLayout({
  children,
  title,
  description,
  showBackButton = false,
}: AdminLayoutProps) {
  const { adminToken } = useAuthContext();
  const [, navigate] = useLocation();

  // If no admin token, don't render (this will be caught by route protection)
  if (!adminToken) {
    return null;
  }

  const handleBack = () => {
    navigate(-1 as any);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 h-14 px-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {title && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AdminProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
