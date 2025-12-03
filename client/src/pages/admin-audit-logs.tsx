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

interface AuditLog {
  id: string;
  adminUserId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  organizationId?: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  suspend_org: "bg-red-100 text-red-800",
  reactivate_org: "bg-green-100 text-green-800",
  update_plan: "bg-blue-100 text-blue-800",
  impersonate_org: "bg-yellow-100 text-yellow-800",
  create_user: "bg-green-100 text-green-800",
  delete_user: "bg-red-100 text-red-800",
  update_user: "bg-blue-100 text-blue-800",
};

export function AdminAuditLogsPage() {
  const [, navigate] = useLocation();
  const { adminToken } = useAuthContext();
  const [actionFilter, setActionFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch audit logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/audit-logs?limit=500", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json() as Promise<AuditLog[]>;
    },
    enabled: !!adminToken,
  });

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesOrg =
        !organizationFilter || log.organizationId === organizationFilter;

      let matchesDate = true;
      if (dateFilter) {
        const logDate = new Date(log.createdAt).toLocaleDateString();
        const filterDate = new Date(dateFilter).toLocaleDateString();
        matchesDate = logDate === filterDate;
      }

      return matchesAction && matchesOrg && matchesDate;
    });
  }, [logs, actionFilter, organizationFilter, dateFilter]);

  // Get unique actions and organizations
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const uniqueOrgs = Array.from(new Set(logs.map((log) => log.organizationId))).filter(Boolean);

  return (
    <AdminLayout
      title="Audit Logs"
      description="View system-wide audit trail and admin actions"
      showBackButton={true}
    >
      <div className="p-6 space-y-6">

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Action</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Organization</label>
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Organizations</SelectItem>
                {uniqueOrgs.map((orgId) => (
                  <SelectItem key={orgId} value={orgId || ""}>
                    {orgId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter by Date</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Organization</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={ACTION_COLORS[log.action] || "bg-gray-100"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-gray-500 truncate">{log.resourceId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.organizationId ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.organizationId.slice(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.ipAddress || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Show changes in a modal or expand
                          console.log("Changes:", log.changes);
                        }}
                      >
                        {Object.keys(log.changes).length > 0 ? "View" : "—"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} audit logs
        </div>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const csv = [
              ["Timestamp", "Action", "Resource", "Organization", "IP Address"],
              ...filteredLogs.map((log) => [
                new Date(log.createdAt).toISOString(),
                log.action,
                log.resource,
                log.organizationId || "System",
                log.ipAddress || "Unknown",
              ]),
            ]
              .map((row) => row.join(","))
              .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
        >
          Export as CSV
        </Button>
      </div>
      </div>
    </AdminLayout>
  );
}
