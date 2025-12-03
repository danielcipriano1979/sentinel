import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mfaEnabled: boolean;
}

export function useAdmin() {
  const { adminToken } = useAuthContext();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) {
      setAdmin(null);
      return;
    }

    const fetchAdmin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin info");
        }

        const data = await response.json();
        setAdmin(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmin();
  }, [adminToken]);

  return { admin, isLoading, error };
}
