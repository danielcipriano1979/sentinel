import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/hooks/useUser';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: ('owner' | 'admin' | 'member' | 'viewer')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { user, isLoading } = useUser();

  // Still loading user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    // Redirect to login
    navigate('/login');
    return null;
  }

  // Check if user has required role
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Go back to dashboard
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}
