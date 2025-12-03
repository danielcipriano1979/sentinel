import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export function InvitePage({ params }: { params: { token: string } }) {
  const [, navigate] = useLocation();
  const { setUser, setToken, setOrganization } = useUser();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const token = params.token;

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvitation = async () => {
      try {
        // Try to use the token by checking if invitation exists
        // We'll do a simple fetch to validate, or let the registration endpoint handle it
        setValidating(false);
      } catch (err) {
        setError('Invalid or expired invitation link');
        setValidating(false);
      }
    };

    if (token) {
      validateInvitation();
    } else {
      setError('No invitation token provided');
      setValidating(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName) {
      const err = 'First name and last name are required';
      setError(err);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      const err = 'Password must be at least 8 characters';
      setError(err);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      const err = 'Passwords do not match';
      setError(err);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register/invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationToken: token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const err = data.error || 'Invitation acceptance failed';
        setError(err);
        return;
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const err_msg = err.message || 'An error occurred during invitation acceptance';
      setError(err_msg);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Join Team</CardTitle>
          <CardDescription>
            Complete your account setup to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Joining...' : 'Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvitePage;
