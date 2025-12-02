import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { HostCard } from "@/components/host-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/lib/organization-context";
import { getHostStatus } from "@/components/status-badge";
import { Server, Bot, Cpu, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { HostWithAgent, HostMetrics, Alert } from "@shared/schema";

interface DashboardData {
  hosts: HostWithAgent[];
  metrics: Record<string, HostMetrics>;
  alerts: Alert[];
  stats: {
    totalHosts: number;
    activeAgents: number;
    avgCpu: number;
    alerts: number;
  };
}

function getHostAlertSeverity(hostId: string, alerts: Alert[]): "critical" | "warning" | "info" | null {
  const hostAlerts = alerts.filter(a => a.hostId === hostId && (a.status === "active" || a.status === "acknowledged"));
  if (hostAlerts.some(a => a.severity === "critical")) return "critical";
  if (hostAlerts.some(a => a.severity === "warning")) return "warning";
  if (hostAlerts.some(a => a.severity === "info")) return "info";
  return null;
}

export default function Dashboard() {
  const { currentOrg } = useOrganization();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    enabled: !!currentOrg?.id,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load dashboard data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Server className="h-8 w-8 text-muted-foreground" />}
          title="Select an Organization"
          description="Choose an organization from the sidebar to view the dashboard."
        />
      </div>
    );
  }

  const { hosts = [], metrics = {}, alerts = [], stats } = data || {
    hosts: [],
    metrics: {},
    alerts: [],
    stats: { totalHosts: 0, activeAgents: 0, avgCpu: 0, alerts: 0 },
  };

  const recentHosts = hosts.slice(0, 6);
  
  // Use server-provided alerts count, fallback to host status calculation
  const hostAlertCount = hosts.filter((h) => {
    const status = getHostStatus(h.lastSeenAt, h.agent?.status);
    return status === "critical" || status === "warning";
  }).length;
  const alertCount = (stats?.alerts || 0) + hostAlertCount;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your infrastructure health
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Hosts"
          value={stats?.totalHosts || hosts.length}
          subtitle="Registered machines"
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          title="Active Agents"
          value={stats?.activeAgents || hosts.filter((h) => getHostStatus(h.lastSeenAt, h.agent?.status) === "healthy").length}
          subtitle="Currently reporting"
          icon={<Bot className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg. CPU Usage"
          value={`${(stats?.avgCpu || 0).toFixed(1)}%`}
          subtitle="Across all hosts"
          icon={<Cpu className="h-4 w-4" />}
        />
        <MetricCard
          title="Alerts"
          value={alertCount}
          subtitle="Hosts need attention"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg font-medium">Recent Hosts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hosts" data-testid="link-view-all-hosts">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentHosts.length === 0 ? (
            <EmptyState
              icon={<Server className="h-8 w-8 text-muted-foreground" />}
              title="No Hosts Yet"
              description="Register your first host to start monitoring. Install the agent on your machines to begin collecting metrics."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentHosts.map((host) => (
                <HostCard
                  key={host.id}
                  host={host}
                  metrics={metrics[host.id]}
                  alertSeverity={getHostAlertSeverity(host.id, alerts)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
