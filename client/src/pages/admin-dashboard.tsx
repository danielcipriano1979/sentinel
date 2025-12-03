import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  status: string;
  hostCount: number;
  plan?: { name: string; maxHosts: number };
}

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalHosts: number;
  monthlyRevenue: number;
}

export function AdminDashboardPage() {
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
    }
  }, [adminToken, navigate]);

  // Fetch tenants
  const { data: tenants = [], isLoading } = useQuery({
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

  // Calculate stats
  useEffect(() => {
    if (tenants.length > 0) {
      const totalHosts = tenants.reduce((acc, t) => acc + t.hostCount, 0);
      const activeTenants = tenants.filter((t) => t.status === "active").length;
      const suspendedTenants = tenants.filter((t) => t.status === "suspended").length;

      setStats({
        totalTenants: tenants.length,
        activeTenants,
        suspendedTenants,
        totalHosts,
        monthlyRevenue: activeTenants * 99, // Example: $99/month per active tenant
      });
    }
  }, [tenants]);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    canceled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => navigate("/admin/settings")}>Settings</Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-gray-500 text-sm">Total Tenants</div>
            <div className="text-3xl font-bold">{stats.totalTenants}</div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-500 text-sm">Active Tenants</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeTenants}</div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-500 text-sm">Suspended</div>
            <div className="text-3xl font-bold text-red-600">{stats.suspendedTenants}</div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-500 text-sm">Total Hosts</div>
            <div className="text-3xl font-bold">{stats.totalHosts}</div>
          </Card>
          <Card className="p-4">
            <div className="text-gray-500 text-sm">Monthly Revenue</div>
            <div className="text-3xl font-bold">${stats.monthlyRevenue}</div>
          </Card>
        </div>
      )}

      {/* Tenants List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tenants</h2>
          <Button onClick={() => navigate("/admin/tenants")}>View All</Button>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="py-2">Name</th>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Plan</th>
                  <th className="py-2">Hosts</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 10).map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{tenant.name}</td>
                    <td className="py-2 text-gray-600">{tenant.slug}</td>
                    <td className="py-2">{tenant.plan?.name || "Unknown"}</td>
                    <td className="py-2">{tenant.hostCount}</td>
                    <td className="py-2">
                      <Badge className={statusColors[tenant.status] || "bg-gray-100"}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-gray-600">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tenant Distribution by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: "Free", count: tenants.filter(t => t.plan?.name === "free").length },
              { name: "Pro", count: tenants.filter(t => t.plan?.name === "pro").length },
              { name: "Enterprise", count: tenants.filter(t => t.plan?.name === "enterprise").length },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">API Uptime</span>
                <span className="text-sm font-bold">99.9%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.9%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Database</span>
                <span className="text-sm font-bold">Healthy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Cache</span>
                <span className="text-sm font-bold">Healthy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
