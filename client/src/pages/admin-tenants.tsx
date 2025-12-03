import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/hooks/useAuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  status: string;
  hostCount: number;
  plan?: { name: string; maxHosts: number; monthlyPrice: number };
}

export function AdminTenantsPage() {
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch tenants
  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tenants", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tenants");
      return response.json() as Promise<Tenant[]>;
    },
    enabled: !!adminToken,
  });

  // Filter tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  const handleSuspend = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to suspend this tenant?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "suspended" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to suspend tenant");
      }

      await refetch();
    } catch (error) {
      console.error("Failed to suspend tenant:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to suspend tenant"}`);
    }
  };

  const handleReactivate = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to reactivate this tenant?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "active" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reactivate tenant");
      }

      await refetch();
    } catch (error) {
      console.error("Failed to reactivate tenant:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to reactivate tenant"}`);
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    canceled: "bg-gray-100 text-gray-800",
  };

  return (
    <AdminLayout
      title="Tenants Management"
      description="Manage and monitor all tenant organizations"
      showBackButton={true}
    >
      <div className="p-6 space-y-6">

      {/* Filters */}
      <Card className="p-6 border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Search Tenants
              </label>
              <Input
                placeholder="Search by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status Filter
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tenants Table */}
      <Card className="p-6 border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg">Loading tenants...</div>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg">No tenants found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Hosts
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.map((tenant, idx) => (
                  <tr
                    key={tenant.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {tenant.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {tenant.plan?.name || "—"}
                        </div>
                        {tenant.plan && (
                          <div className="text-gray-600">
                            ${tenant.plan.monthlyPrice / 100}/mo
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {tenant.hostCount}
                        </div>
                        {tenant.plan && (
                          <div className="text-gray-600">
                            of {tenant.plan.maxHosts}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${statusColors[tenant.status] || "bg-gray-100 text-gray-800"} font-medium`}
                      >
                        {tenant.status.charAt(0).toUpperCase() +
                          tenant.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                          className="text-xs"
                        >
                          View
                        </Button>

                        {tenant.status === "active" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspend(tenant.id)}
                            className="text-xs"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(tenant.id)}
                            className="text-xs"
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredTenants.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{tenants.length}</span> tenants
          </div>
        </div>
      </Card>
      </div>
    </AdminLayout>
  );
}
