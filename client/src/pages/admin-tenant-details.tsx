import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  status: string;
  hostCount: number;
  activeAlerts: number;
  plan?: {
    id: string;
    name: string;
    maxHosts: number;
    maxUsers: number;
    maxAlertRules: number;
    monthlyPrice: number;
  };
}

interface Plan {
  id: string;
  name: string;
  maxHosts: number;
  maxUsers: number;
  maxAlertRules: number;
  monthlyPrice: number;
}

export function AdminTenantDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch tenant details
  const { data: tenant, isLoading: tenantLoading, refetch } = useQuery({
    queryKey: ["admin-tenant", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tenant");
      return response.json() as Promise<TenantDetail>;
    },
    enabled: !!adminToken && !!id,
  });

  // Fetch available plans
  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await fetch("/api/subscription-plans", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json() as Promise<Plan[]>;
    },
    enabled: !!adminToken,
  });

  const handlePlanChange = async () => {
    if (!selectedPlan || !id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tenants/${id}/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ planId: selectedPlan }),
      });

      if (response.ok) {
        refetch();
        setSelectedPlan("");
      }
    } catch (error) {
      console.error("Failed to update plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!window.confirm("Impersonate this tenant? You'll be logged in as their admin.")) {
      return;
    }
    // TODO: Implement impersonation
    console.log("Impersonate tenant:", id);
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    canceled: "bg-gray-100 text-gray-800",
  };

  if (tenantLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!tenant) {
    return <div className="p-6">Tenant not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="text-gray-600">Slug: {tenant.slug}</p>
        </div>
        <Button onClick={() => navigate("/admin/tenants")}>Back to Tenants</Button>
      </div>

      {/* Status & Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Tenant Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge className={statusColors[tenant.status] || "bg-gray-100"}>
                  {tenant.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="font-medium">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Hosts</div>
                <div className="font-medium">{tenant.hostCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Active Alerts</div>
                <div className="font-medium">{tenant.activeAlerts}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
            {tenant.plan ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Plan Name</div>
                  <div className="font-medium capitalize">{tenant.plan.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monthly Price</div>
                  <div className="font-medium">${tenant.plan.monthlyPrice / 100}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Max Hosts</div>
                    <div className="font-medium">{tenant.plan.maxHosts}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max Users</div>
                    <div className="font-medium">{tenant.plan.maxUsers}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max Rules</div>
                    <div className="font-medium">{tenant.plan.maxAlertRules}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No plan assigned</div>
            )}
          </div>
        </div>
      </Card>

      {/* Plan Change */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Change Subscription Plan</h3>
        <div className="flex gap-3">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select new plan..." />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} - $
                  {plan.monthlyPrice / 100}/month
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handlePlanChange}
            disabled={!selectedPlan || loading}
            className="px-6"
          >
            {loading ? "Updating..." : "Update Plan"}
          </Button>
        </div>
      </Card>

      {/* Management Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tenant Management</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleImpersonate}
          >
            🔓 Impersonate Tenant (Login as Admin)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/admin/tenants/${id}/users`)}
          >
            👥 Manage Users
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/admin/tenants/${id}/settings`)}
          >
            ⚙️ Tenant Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/admin/tenants/${id}/billing`)}
          >
            💳 Billing & Invoices
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Hosts / Limit</div>
            <div className="text-2xl font-bold">
              {tenant.hostCount}/{tenant.plan?.maxHosts || "∞"}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: tenant.plan
                    ? `${(tenant.hostCount / tenant.plan.maxHosts) * 100}%`
                    : "0%",
                }}
              ></div>
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Alerts / Limit</div>
            <div className="text-2xl font-bold">
              {tenant.activeAlerts}/{tenant.plan?.maxAlertRules || "∞"}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{
                  width: tenant.plan
                    ? `${(tenant.activeAlerts / tenant.plan.maxAlertRules) * 100}%`
                    : "0%",
                }}
              ></div>
            </div>
          </div>
          <div className="border rounded p-3">
            <div className="text-sm text-gray-600">Plan Status</div>
            <Badge className={statusColors[tenant.status] || "bg-gray-100"}>
              {tenant.status}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
