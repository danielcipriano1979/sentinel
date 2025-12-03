import { createContext, useContext } from "react";

interface AuthContextType {
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  adminToken: null,
  setAdminToken: () => {},
});

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
