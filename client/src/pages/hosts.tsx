import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HostCard } from "@/components/host-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, getHostStatus } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/lib/organization-context";
import {
  Server,
  Search,
  Grid,
  List,
  Filter,
  Clock,
  MoreVertical,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import type { HostWithAgent, HostMetrics, Alert } from "@shared/schema";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "healthy" | "warning" | "critical" | "offline";

interface HostsData {
  hosts: HostWithAgent[];
  metrics: Record<string, HostMetrics>;
  alerts: Alert[];
}

function getHostAlertSeverity(hostId: string, alerts: Alert[]): "critical" | "warning" | "info" | null {
  const hostAlerts = alerts.filter(a => a.hostId === hostId && (a.status === "active" || a.status === "acknowledged"));
  if (hostAlerts.some(a => a.severity === "critical")) return "critical";
  if (hostAlerts.some(a => a.severity === "warning")) return "warning";
  if (hostAlerts.some(a => a.severity === "info")) return "info";
  return null;
}

export default function Hosts() {
  const { currentOrg } = useOrganization();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, error } = useQuery<HostsData>({
    queryKey: ["/api/hosts", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/hosts?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch hosts");
      return res.json();
    },
    enabled: !!currentOrg?.id,
    refetchInterval: 5000,
  });

  const { hosts = [], metrics = {}, alerts = [] } = data || { hosts: [], metrics: {}, alerts: [] };

  const filteredHosts = hosts.filter((host) => {
    const matchesSearch =
      host.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;

    const status = getHostStatus(host.lastSeenAt, host.agent?.status);
    return status === statusFilter;
  });

  if (!currentOrg) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Server className="h-8 w-8 text-muted-foreground" />}
          title="Select an Organization"
          description="Choose an organization from the sidebar to view hosts."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hosts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hosts.length} {hosts.length === 1 ? "host" : "hosts"} registered
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-hosts"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-r-none",
                viewMode === "grid" && "bg-muted"
              )}
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-l-none",
                viewMode === "list" && "bg-muted"
              )}
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : filteredHosts.length === 0 ? (
        <EmptyState
          icon={<Server className="h-8 w-8 text-muted-foreground" />}
          title={searchQuery || statusFilter !== "all" ? "No Matching Hosts" : "No Hosts Yet"}
          description={
            searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Register your first host to start monitoring. Install the agent on your machines to begin collecting metrics."
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHosts.map((host) => (
            <HostCard 
              key={host.id} 
              host={host} 
              metrics={metrics[host.id]} 
              alertSeverity={getHostAlertSeverity(host.id, alerts)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>Agent Version</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHosts.map((host) => {
                const status = getHostStatus(host.lastSeenAt, host.agent?.status);
                const hostMetrics = metrics[host.id];
                const alertSeverity = getHostAlertSeverity(host.id, alerts);

                return (
                  <TableRow 
                    key={host.id} 
                    data-testid={`row-host-${host.id}`}
                    className={cn(
                      alertSeverity === "critical" && "border-l-4 border-l-red-500",
                      alertSeverity === "warning" && "border-l-4 border-l-amber-500",
                      alertSeverity === "info" && "border-l-4 border-l-blue-500"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} size="sm" />
                        {alertSeverity === "critical" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {alertSeverity === "warning" && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        {alertSeverity === "info" && (
                          <Info className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Link href={`/hosts/${host.id}`}>
                          <span className="font-medium hover:text-primary transition-colors cursor-pointer">
                            {host.displayName || host.hostname}
                          </span>
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">
                          {host.hostname}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {host.agent ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          v{host.agent.version}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {hostMetrics ? `${hostMetrics.cpu.usage.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {hostMetrics ? `${hostMetrics.memory.usagePercent.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {hostMetrics ? `${hostMetrics.disk.usagePercent.toFixed(1)}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {host.lastSeenAt
                          ? formatDistanceToNow(new Date(host.lastSeenAt), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/hosts/${host.id}`}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
