import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "healthy" | "warning" | "critical" | "offline" | "unknown";

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: "sm" | "default";
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; dotClass: string; badgeClass: string }> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-status-online",
    badgeClass: "bg-status-online/10 text-status-online border-status-online/20",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-status-away",
    badgeClass: "bg-status-away/10 text-status-away border-status-away/20",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-status-busy",
    badgeClass: "bg-status-busy/10 text-status-busy border-status-busy/20",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-status-offline",
    badgeClass: "bg-status-offline/10 text-status-offline border-status-offline/20",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, showDot = true, size = "default", className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border",
        config.badgeClass,
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full animate-pulse",
            config.dotClass,
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

export function getHostStatus(
  lastSeenAt: Date | string | null | undefined,
  agentStatus?: string
): StatusType {
  if (!lastSeenAt) return "unknown";
  
  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
  
  if (agentStatus === "stopped") return "offline";
  if (diffMinutes > 5) return "offline";
  if (diffMinutes > 2) return "warning";
  return "healthy";
}
