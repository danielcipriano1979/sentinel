import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, getHostStatus } from "./status-badge";
import { ResourceBar } from "./metric-card";
import { cn } from "@/lib/utils";
import { Server, ExternalLink, MoreVertical, Clock, Tag, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { HostWithAgent, HostMetrics } from "@shared/schema";
import { Link } from "wouter";

interface HostCardProps {
  host: HostWithAgent;
  metrics?: HostMetrics;
  alertSeverity?: "critical" | "warning" | "info" | null;
  className?: string;
}

export function HostCard({ host, metrics, alertSeverity, className }: HostCardProps) {
  const status = getHostStatus(host.lastSeenAt, host.agent?.status);
  const displayName = host.displayName || host.hostname;

  const alertBorderClass = alertSeverity === "critical" 
    ? "border-l-4 border-l-red-500" 
    : alertSeverity === "warning" 
    ? "border-l-4 border-l-amber-500" 
    : alertSeverity === "info"
    ? "border-l-4 border-l-blue-500"
    : "";

  return (
    <Card className={cn("overflow-visible hover-elevate transition-all", alertBorderClass, className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/hosts/${host.id}`}>
                <span 
                  className="font-semibold hover:text-primary transition-colors cursor-pointer truncate block max-w-[180px]"
                  data-testid={`link-host-${host.id}`}
                >
                  {displayName}
                </span>
              </Link>
              <StatusBadge status={status} size="sm" />
              {alertSeverity && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {alertSeverity === "critical" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {alertSeverity === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      {alertSeverity === "info" && (
                        <Info className="h-4 w-4 text-blue-500" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">{alertSeverity} alert active</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {host.hostname}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-host-menu-${host.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/hosts/${host.id}`} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <ResourceBar
            label="CPU"
            value={metrics?.cpu.usage ?? 0}
            size="sm"
          />
          <ResourceBar
            label="Memory"
            value={metrics?.memory.usagePercent ?? 0}
            size="sm"
          />
          <ResourceBar
            label="Disk"
            value={metrics?.disk.usagePercent ?? 0}
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {host.lastSeenAt ? (
              <span>
                {formatDistanceToNow(new Date(host.lastSeenAt), { addSuffix: true })}
              </span>
            ) : (
              <span>Never seen</span>
            )}
          </div>
          {host.agent && (
            <Badge variant="secondary" className="font-mono text-xs">
              v{host.agent.version}
            </Badge>
          )}
        </div>

        {host.tags && host.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {host.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {host.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{host.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
