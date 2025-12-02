import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Map,
  CheckCircle2,
  Circle,
  Loader2,
  Rocket,
  Target,
  Zap,
  Shield,
  BarChart3,
  Bell,
  Layers,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapItem } from "@shared/schema";

const statusConfig = {
  planned: {
    label: "Planned",
    icon: Circle,
    color: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    color: "text-status-away",
    badgeClass: "bg-status-away/10 text-status-away",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-status-online",
    badgeClass: "bg-status-online/10 text-status-online",
  },
};

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  target: Target,
  zap: Zap,
  shield: Shield,
  chart: BarChart3,
  bell: Bell,
  layers: Layers,
  cloud: Cloud,
};

const defaultRoadmapItems: RoadmapItem[] = [
  {
    id: "1",
    title: "Alert Configuration System",
    description:
      "Configure custom alerting rules with thresholds and notification channels including email, Slack, and webhooks.",
    status: "planned",
    targetVersion: "1.2.0",
    priority: 1,
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Time-Series Database Integration",
    description:
      "Store long-term metrics data for advanced analytics, trend analysis, and capacity planning.",
    status: "planned",
    targetVersion: "1.3.0",
    priority: 2,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "Custom Dashboard Builder",
    description:
      "Create personalized dashboards with drag-and-drop widgets, custom charts, and saved views.",
    status: "planned",
    targetVersion: "1.4.0",
    priority: 3,
    createdAt: new Date(),
  },
  {
    id: "4",
    title: "Agent Auto-Update System",
    description:
      "Automatic agent updates with rollback capability and version management across your fleet.",
    status: "planned",
    targetVersion: "1.5.0",
    priority: 4,
    createdAt: new Date(),
  },
  {
    id: "5",
    title: "Advanced Host Grouping",
    description:
      "Group hosts by environment, region, or custom tags with aggregate metrics and bulk operations.",
    status: "planned",
    targetVersion: "1.6.0",
    priority: 5,
    createdAt: new Date(),
  },
  {
    id: "6",
    title: "Multi-Tenant SSO",
    description:
      "Enterprise single sign-on integration with SAML and OIDC support for seamless authentication.",
    status: "planned",
    targetVersion: "2.0.0",
    priority: 6,
    createdAt: new Date(),
  },
];

export default function Roadmap() {
  const { data, isLoading } = useQuery<RoadmapItem[]>({
    queryKey: ["/api/roadmap"],
    refetchInterval: false,
  });

  // Use default items if API returns empty array
  const roadmapItems = data && data.length > 0 ? data : defaultRoadmapItems;

  const groupedByStatus = {
    in_progress: roadmapItems.filter((item) => item.status === "in_progress"),
    planned: roadmapItems.filter((item) => item.status === "planned"),
    completed: roadmapItems.filter((item) => item.status === "completed"),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upcoming features and development timeline
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Loader2 className="h-4 w-4 text-status-away animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-away">
              {groupedByStatus.in_progress.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planned
            </CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {groupedByStatus.planned.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-status-online" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-status-online">
              {groupedByStatus.completed.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByStatus.in_progress.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-5 w-5 text-status-away animate-spin" />
                <h2 className="text-lg font-semibold">In Progress</h2>
              </div>
              <div className="grid gap-4">
                {groupedByStatus.in_progress.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {groupedByStatus.planned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Map className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Planned</h2>
              </div>
              <div className="grid gap-4">
                {groupedByStatus.planned.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {groupedByStatus.completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-status-online" />
                <h2 className="text-lg font-semibold">Completed</h2>
              </div>
              <div className="grid gap-4">
                {groupedByStatus.completed.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Have a Feature Request?
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              We're always looking to improve Sentinel. Share your ideas and
              help shape the future of infrastructure monitoring.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const config = statusConfig[item.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <Card className="hover-elevate transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn("mt-1", config.color)}>
            <StatusIcon
              className={cn(
                "h-5 w-5",
                item.status === "in_progress" && "animate-spin"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold">{item.title}</h3>
              {item.targetVersion && (
                <Badge variant="outline" className="font-mono text-xs">
                  {item.targetVersion}
                </Badge>
              )}
              <Badge className={cn("text-xs", config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {item.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
