import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useOrganization } from "@/lib/organization-context";
import {
  Bot,
  Search,
  Clock,
  Server,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import type { HostWithAgent } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AgentsData {
  hosts: HostWithAgent[];
  versionStats: Record<string, number>;
}

export default function Agents() {
  const { currentOrg } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<AgentsData>({
    queryKey: ["/api/agents", currentOrg?.id],
    queryFn: async () => {
      const res = await fetch(`/api/agents?orgId=${currentOrg?.id}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    enabled: !!currentOrg?.id,
    refetchInterval: 5000,
  });

  const { hosts = [], versionStats = {} } = data || { hosts: [], versionStats: {} };

  const hostsWithAgents = hosts.filter((h) => h.agent);
  const filteredHosts = hostsWithAgents.filter(
    (host) =>
      host.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.agent?.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runningAgents = hostsWithAgents.filter(
    (h) => h.agent?.status === "running"
  ).length;
  const stoppedAgents = hostsWithAgents.filter(
    (h) => h.agent?.status === "stopped"
  ).length;

  if (!currentOrg) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Bot className="h-8 w-8 text-muted-foreground" />}
          title="Select an Organization"
          description="Choose an organization from the sidebar to view agents."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your deployed agents
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{hostsWithAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Installed across hosts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Running
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-status-online" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-online">
              {runningAgents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stopped
            </CardTitle>
            <XCircle className="h-4 w-4 text-status-busy" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-busy">
              {stoppedAgents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Not reporting
            </p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(versionStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Version Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(versionStats)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([version, count]) => (
                  <div
                    key={version}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <Badge variant="secondary" className="font-mono">
                      v{version}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      {count === 1 ? "host" : "hosts"}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-agents"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredHosts.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-8 w-8 text-muted-foreground" />}
          title={searchQuery ? "No Matching Agents" : "No Agents Installed"}
          description={
            searchQuery
              ? "Try adjusting your search criteria."
              : "Install agents on your hosts to start monitoring. The agent will automatically report its status and version."
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PID</TableHead>
                <TableHead>Last Heartbeat</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHosts.map((host) => (
                <TableRow key={host.id} data-testid={`row-agent-${host.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Server className="h-4 w-4" />
                      </div>
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      v{host.agent?.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {host.agent?.status === "running" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-status-online" />
                          <span className="text-sm text-status-online">
                            Running
                          </span>
                        </>
                      ) : host.agent?.status === "stopped" ? (
                        <>
                          <XCircle className="h-4 w-4 text-status-busy" />
                          <span className="text-sm text-status-busy">
                            Stopped
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Unknown
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {host.agent?.pid || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {host.agent?.lastHeartbeat
                        ? formatDistanceToNow(
                            new Date(host.agent.lastHeartbeat),
                            { addSuffix: true }
                          )
                        : "Never"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/hosts/${host.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
