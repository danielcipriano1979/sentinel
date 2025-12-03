import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "deactivated";
  createdAt: string;
}

export function AdminTenantSettingsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const queryClient = useQueryClient();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch tenant info
  const { data: tenant, isLoading } = useQuery({
    queryKey: [`admin-tenant-settings-${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tenant");
      return response.json() as Promise<TenantInfo>;
    },
    enabled: !!adminToken && !!id,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: "active" | "suspended" | "deactivated") => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      return response.json();
    },
    onSuccess: () => {
      setSuccess("Tenant status updated");
      // Invalidate both the specific tenant and the tenants list
      queryClient.invalidateQueries({
        queryKey: [`admin-tenant-settings-${id}`],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-tenants"],
      });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error: any) => {
      setError(error.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-yellow-100 text-yellow-800",
    deactivated: "bg-red-100 text-red-800",
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return <div className="p-6">Tenant not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Settings</h1>
          <p className="text-gray-600">{tenant.name} ({tenant.slug})</p>
        </div>
        <Button onClick={() => navigate(`/admin/tenants/${id}`)}>
          Back to Tenant
        </Button>
      </div>

      {/* Messages */}
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

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status Management</TabsTrigger>
          <TabsTrigger value="info">Tenant Information</TabsTrigger>
        </TabsList>

        {/* Status Management Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">Status</div>
                <Badge className={statusColors[tenant.status]}>
                  {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Activate Button */}
                {tenant.status !== "active" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        ✓ Activate Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Activate Tenant?</DialogTitle>
                        <DialogDescription>
                          Activating this tenant will allow users to access their accounts and services.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate("active")}
                          disabled={updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? "Activating..." : "Confirm Activation"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Suspend Button */}
                {tenant.status !== "suspended" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        ⏸ Suspend Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Suspend Tenant?</DialogTitle>
                        <DialogDescription>
                          Suspending will temporarily disable access to the platform while preserving all data.
                          Users will see a "Account Suspended" message.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate("suspended")}
                          disabled={updateStatusMutation.isPending}
                          variant="secondary"
                        >
                          {updateStatusMutation.isPending ? "Suspending..." : "Confirm Suspension"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Deactivate Button */}
                {tenant.status !== "deactivated" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="destructive">
                        ✕ Deactivate Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deactivate Tenant?</DialogTitle>
                        <DialogDescription>
                          This will completely disable the tenant account. Users will not be able to access the platform.
                          All data is retained but the account will be marked as deactivated.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button
                          onClick={() => updateStatusMutation.mutate("deactivated")}
                          disabled={updateStatusMutation.isPending}
                          variant="destructive"
                        >
                          {updateStatusMutation.isPending ? "Deactivating..." : "Confirm Deactivation"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">Status Definitions:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Active:</strong> Normal operation, users can access</li>
                  <li><strong>Suspended:</strong> Temporary block, data preserved, can be reactivated</li>
                  <li><strong>Deactivated:</strong> Permanent suspension, data retained</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tenant ID</label>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded mt-1">
                  {tenant.id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Tenant Name</label>
                <p className="text-lg font-semibold mt-1">{tenant.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">URL Slug</label>
                <p className="text-lg font-semibold mt-1">{tenant.slug}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-lg mt-1">
                  {new Date(tenant.createdAt).toLocaleDateString()} at{" "}
                  {new Date(tenant.createdAt).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Current Status</label>
                <div className="mt-1">
                  <Badge className={statusColors[tenant.status]}>
                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminTenantSettingsPage;
