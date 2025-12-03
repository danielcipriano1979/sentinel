import { useLocation } from "wouter";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";

export function AdminProfile() {
  const { admin } = useAdmin();
  const { setAdminToken } = useAuthContext();
  const [, navigate] = useLocation();

  if (!admin) {
    return null;
  }

  // Generate initials from admin's name
  const initials = `${admin.firstName?.[0] || ""}${admin.lastName?.[0] || ""}`.toUpperCase() || admin.email[0].toUpperCase();

  const handleLogout = async () => {
    try {
      // Call logout endpoint to revoke token
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      }).catch(() => {
        // Ignore errors on logout
      });
    } finally {
      // Clear local state regardless of API response
      setAdminToken(null);
      localStorage.removeItem("admin_token");
      navigate("/admin/login");
    }
  };

  const handleSettings = () => {
    navigate("/admin/settings");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-opacity hover:opacity-80"
          aria-label="Open admin menu"
        >
          <Avatar>
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`}
              alt={`${admin.firstName} ${admin.lastName}`}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1 py-2">
          <p className="text-sm font-medium">
            {admin.firstName && admin.lastName
              ? `${admin.firstName} ${admin.lastName}`
              : admin.email}
          </p>
          <p className="text-xs text-muted-foreground">{admin.email}</p>
          <p className="text-xs text-muted-foreground">
            {admin.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
