import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function OrganizationSettingsPage() {
  const [, navigate] = useLocation();
  const { user, organization, logout, token } = useUser();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteOrganization = async () => {
    if (user?.role !== 'owner') {
      setError('Only the owner can delete the organization');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(
        `/api/organizations/${organization?.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organization');
      }

      setSuccess('Organization deleted successfully');
      // Logout and redirect after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-gray-600 mt-2">Manage your organization</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <p className="text-lg font-semibold">{organization?.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL Slug</label>
                <p className="text-lg font-semibold">{organization?.slug}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Created</label>
                <p className="text-lg">
                  {organization?.createdAt
                    ? new Date(organization.createdAt).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Role</label>
                <p className="text-lg font-semibold capitalize">{user?.role}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription className="text-red-600">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 border border-red-200 rounded-lg bg-white">
                <h3 className="font-semibold text-red-700 mb-2">Delete Organization</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete the organization and all associated data. This action cannot be undone.
                </p>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" disabled={user?.role !== 'owner'}>
                      Delete Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Organization?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete <strong>{organization?.name}</strong>? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteOrganization}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Organization'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {user?.role !== 'owner' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Only the organization owner can delete it.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OrganizationSettingsPage;
