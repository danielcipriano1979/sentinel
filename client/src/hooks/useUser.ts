import { useContext } from 'react';
import { UserContext, type UserContextType } from '../contexts/UserContext';

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserContextProvider');
  }
  return context;
}
