import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess: (user: any, organization: any, token: string) => void;
  onError: (error: string) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    organizationName: '',
    organizationSlug: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  const handleOrganizationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      organizationName: name,
      organizationSlug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      const err = 'First name, last name, and email are required';
      setError(err);
      onError(err);
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      const err = 'Password must be at least 8 characters';
      setError(err);
      onError(err);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      const err = 'Passwords do not match';
      setError(err);
      onError(err);
      return;
    }

    if (!formData.organizationName || !formData.organizationSlug) {
      const err = 'Organization name is required';
      setError(err);
      onError(err);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName,
          organizationSlug: formData.organizationSlug,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const err = data.error || 'Registration failed';
        setError(err);
        onError(err);
        return;
      }

      const data = await response.json();
      onSuccess(data.user, data.organization, data.token);
    } catch (err: any) {
      const err_msg = err.message || 'An error occurred during registration';
      setError(err_msg);
      onError(err_msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Create a new company and account
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

          {/* Company Section */}
          <div className="space-y-3 pb-3 border-b">
            <h3 className="text-sm font-semibold">Company Details</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                type="text"
                placeholder="Acme Inc"
                value={formData.organizationName}
                onChange={handleOrganizationNameChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company URL Slug</label>
              <Input
                type="text"
                placeholder="acme-inc"
                value={formData.organizationSlug}
                onChange={(e) => setFormData({...formData, organizationSlug: e.target.value})}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in your company's login URL
              </p>
            </div>
          </div>

          {/* User Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Your Account</h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                disabled={loading}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
