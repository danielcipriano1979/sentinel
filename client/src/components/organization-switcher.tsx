import { ChevronsUpDown, Building2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/lib/organization-context";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
  onAddOrganization?: () => void;
}

export function OrganizationSwitcher({ onAddOrganization }: OrganizationSwitcherProps) {
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-3"
          data-testid="button-org-switcher"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary flex-shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {currentOrg?.name || "Select Organization"}
              </span>
              {currentOrg && (
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {currentOrg.slug}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className="gap-2"
            data-testid={`menu-item-org-${org.slug}`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-3 w-3" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground truncate">{org.slug}</span>
            </div>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {organizations.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No organizations yet
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onAddOrganization}
          className="gap-2"
          data-testid="button-add-organization"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
