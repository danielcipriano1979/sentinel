import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import type { Organization } from "@shared/schema";

type OrganizationContextType = {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useUser();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync organization from UserContext to OrganizationContext
  useEffect(() => {
    if (organization) {
      setCurrentOrg(organization);
      setOrganizations([organization]); // Only one organization per user
    } else {
      setCurrentOrg(null);
      setOrganizations([]);
    }
    setIsLoading(false);
  }, [organization]);

  const handleSetCurrentOrg = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem("sentinel-current-org", org.id);
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        setCurrentOrg: handleSetCurrentOrg,
        setOrganizations,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
