import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, getHostStatus } from "@/components/status-badge";
import { ResourceBar, MetricCard } from "@/components/metric-card";
import { MetricsChart } from "@/components/metrics-chart";
import { useOrganization } from "@/lib/organization-context";
import {
  Server,
  ArrowLeft,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Bot,
  Tag,
  Globe,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { HostWithAgent, HostMetrics } from "@shared/schema";

interface HostDetailData {
  host: HostWithAgent;
  metrics: HostMetrics[];
  currentMetrics?: HostMetrics;
}

export default function HostDetail() {
  const [, params] = useRoute("/hosts/:id");
  const hostId = params?.id;
  const { currentOrg } = useOrganization();

  const { data, isLoading, error } = useQuery<HostDetailData>({
    queryKey: ["/api/hosts", hostId, currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/hosts/${hostId}?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch host");
      return res.json();
    },
    enabled: !!hostId && !!currentOrg?.id,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <HostDetailSkeleton />;
  }

  if (error || !data?.host) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Host not found or failed to load</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { host, metrics = [], currentMetrics } = data;
  const status = getHostStatus(host.lastSeenAt, host.agent?.status);
  const displayName = host.displayName || host.hostname;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hosts" data-testid="button-back-hosts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {host.hostname}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">
            Metrics
          </TabsTrigger>
          <TabsTrigger value="agent" data-testid="tab-agent">
            Agent Details
          </TabsTrigger>
          <TabsTrigger value="custom-fields" data-testid="tab-custom-fields">
            Custom Fields
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="CPU Usage"
              value={`${(currentMetrics?.cpu.usage ?? 0).toFixed(1)}%`}
              subtitle={`${currentMetrics?.cpu.cores ?? 0} cores`}
              icon={<Cpu className="h-4 w-4" />}
            />
            <MetricCard
              title="Memory Usage"
              value={`${(currentMetrics?.memory.usagePercent ?? 0).toFixed(1)}%`}
              subtitle={formatBytes(currentMetrics?.memory.used ?? 0)}
              icon={<MemoryStick className="h-4 w-4" />}
            />
            <MetricCard
              title="Disk Usage"
              value={`${(currentMetrics?.disk.usagePercent ?? 0).toFixed(1)}%`}
              subtitle={formatBytes(currentMetrics?.disk.used ?? 0)}
              icon={<HardDrive className="h-4 w-4" />}
            />
            <MetricCard
              title="Network I/O"
              value={formatBytes(
                (currentMetrics?.network.bytesIn ?? 0) +
                  (currentMetrics?.network.bytesOut ?? 0)
              )}
              subtitle="Total transfer"
              icon={<Network className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Host Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Monitor className="h-4 w-4" />}
                  label="Operating System"
                  value={host.os || "Unknown"}
                />
                <InfoRow
                  icon={<Cpu className="h-4 w-4" />}
                  label="Architecture"
                  value={host.architecture || "Unknown"}
                />
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="IP Address"
                  value={host.ipAddress || "Unknown"}
                  mono
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Last Seen"
                  value={
                    host.lastSeenAt
                      ? formatDistanceToNow(new Date(host.lastSeenAt), {
                          addSuffix: true,
                        })
                      : "Never"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Resource Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResourceBar
                  label="CPU"
                  value={currentMetrics?.cpu.usage ?? 0}
                />
                <ResourceBar
                  label="Memory"
                  value={currentMetrics?.memory.usagePercent ?? 0}
                />
                <ResourceBar
                  label="Disk"
                  value={currentMetrics?.disk.usagePercent ?? 0}
                />
              </CardContent>
            </Card>
          </div>

          {host.tags && host.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {host.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricsChart
              title="CPU Usage"
              data={metrics}
              dataKey="cpu.usage"
              color="hsl(var(--chart-1))"
              unit="%"
            />
            <MetricsChart
              title="Memory Usage"
              data={metrics}
              dataKey="memory.usagePercent"
              color="hsl(var(--chart-2))"
              unit="%"
            />
            <MetricsChart
              title="Disk Usage"
              data={metrics}
              dataKey="disk.usagePercent"
              color="hsl(var(--chart-3))"
              unit="%"
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Load Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">
                      {(currentMetrics?.cpu.loadAvg[0] ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">1 min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">
                      {(currentMetrics?.cpu.loadAvg[1] ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">5 min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">
                      {(currentMetrics?.cpu.loadAvg[2] ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">15 min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {host.agent ? (
                <>
                  <InfoRow
                    label="Agent Version"
                    value={
                      <Badge variant="secondary" className="font-mono">
                        v{host.agent.version}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Status"
                    value={
                      <Badge
                        variant={
                          host.agent.status === "running"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {host.agent.status}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Process ID"
                    value={host.agent.pid?.toString() || "Unknown"}
                    mono
                  />
                  <InfoRow
                    label="Started At"
                    value={
                      host.agent.startedAt
                        ? format(new Date(host.agent.startedAt), "PPpp")
                        : "Unknown"
                    }
                  />
                  <InfoRow
                    label="Last Heartbeat"
                    value={
                      host.agent.lastHeartbeat
                        ? formatDistanceToNow(
                            new Date(host.agent.lastHeartbeat),
                            { addSuffix: true }
                          )
                        : "Unknown"
                    }
                  />
                </>
              ) : (
                <p className="text-muted-foreground">
                  No agent information available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Custom Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              {host.customFields &&
              Object.keys(host.customFields as object).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(host.customFields as object).map(
                    ([key, value]) => (
                      <InfoRow
                        key={key}
                        label={key}
                        value={String(value)}
                        mono
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No custom fields configured for this host
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function InfoRow({ icon, label, value, mono }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function HostDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-96" />
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
    </div>
  );
}
