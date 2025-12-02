import { createContext, useContext, useState, useEffect } from "react";
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
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedOrgId = localStorage.getItem("sentinel-current-org");
    if (savedOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === savedOrgId);
      if (org) {
        setCurrentOrg(org);
      } else if (organizations.length > 0) {
        setCurrentOrg(organizations[0]);
      }
    } else if (organizations.length > 0 && !currentOrg) {
      setCurrentOrg(organizations[0]);
    }
    setIsLoading(false);
  }, [organizations]);

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
