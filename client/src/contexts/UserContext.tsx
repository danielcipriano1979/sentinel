import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Organization } from '@shared/schema';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  organizationId: string;
}

export interface UserContextType {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setOrganization: (org: Organization | null) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

export function UserContextProvider({ children }: UserContextProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Persist token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('user_token', token);
    } else {
      localStorage.removeItem('user_token');
    }
  }, [token]);

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  // Persist organization to localStorage when it changes
  useEffect(() => {
    if (organization) {
      localStorage.setItem('user_organization', JSON.stringify(organization));
    } else {
      localStorage.removeItem('user_organization');
    }
  }, [organization]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('user_token');
    const savedUser = localStorage.getItem('user_data');
    const savedOrg = localStorage.getItem('user_organization');

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
        localStorage.removeItem('user_data');
      }
    }

    if (savedOrg) {
      try {
        setOrganization(JSON.parse(savedOrg));
      } catch (e) {
        console.error('Failed to parse organization from localStorage:', e);
        localStorage.removeItem('user_organization');
      }
    }

    setIsLoading(false);
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (token && !isLoading) {
      validateToken();
    }
  }, [isLoading]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired
        logout();
        return;
      }

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    }
  };

  const logout = () => {
    // Optionally notify backend
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(err => console.error('Logout request failed:', err));
    }

    setUser(null);
    setToken(null);
    setOrganization(null);
    setError(null);
  };

  const value: UserContextType = {
    user,
    token,
    organization,
    isLoading,
    error,
    setUser,
    setToken,
    setOrganization,
    setError,
    logout,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
