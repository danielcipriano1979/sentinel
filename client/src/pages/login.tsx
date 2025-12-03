import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { useUser } from '@/hooks/useUser';

export function LoginPage() {
  const [, navigate] = useLocation();
  const { setUser, setToken, setOrganization } = useUser();
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [error, setError] = useState('');

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationSlug.trim()) {
      setError('Please enter an organization slug');
      return;
    }
    setError('');
    setShowLoginForm(true);
  };

  const handleLoginSuccess = (user: any, organization: any, token: string) => {
    setToken(token);
    setUser(user);
    setOrganization(organization);

    // Redirect based on role
    if (user.role === 'owner' || user.role === 'admin') {
      navigate('/organization-members');
    } else if (user.role === 'viewer') {
      navigate('/dashboard?readonly=true');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLoginError = (err: string) => {
    setError(err);
  };

  const handleBackToSlug = () => {
    setShowLoginForm(false);
    setError('');
  };

  if (showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToSlug}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to organization
            </Button>
          </div>
          <LoginForm
            organizationSlug={organizationSlug}
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?
            </p>
            <button
              className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
              onClick={() => navigate('/register')}
            >
              Create a new company
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrganizationSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Company URL Slug</label>
              <Input
                type="text"
                placeholder="your-company"
                value={organizationSlug}
                onChange={(e) => setOrganizationSlug(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the URL slug you created when registering
              </p>
            </div>

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600 mb-3">
              New to HostWatch?
            </p>
            <Button
              className="w-full"
              onClick={() => navigate('/register')}
            >
              Create a company account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
