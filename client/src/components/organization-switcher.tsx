import { Building2 } from "lucide-react";
import { useOrganization } from "@/lib/organization-context";

export function OrganizationSwitcher() {
  const { currentOrg } = useOrganization();

  // Display current organization only - no switching or adding allowed
  // Users can only belong to one tenant
  return (
    <div className="w-full p-3 rounded-md bg-muted/50">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary flex-shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium truncate max-w-[140px]">
            {currentOrg?.name || "Organization"}
          </span>
          {currentOrg && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {currentOrg.slug}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        You belong to one organization. Organization switching is not available.
      </p>
    </div>
  );
}
