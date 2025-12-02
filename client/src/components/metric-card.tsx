import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, subtitle, trend, icon, className }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-3 w-3" />;
    if (trend > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    if (trend > 0) return "text-status-online";
    return "text-status-busy";
  };

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend !== undefined && (
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", getTrendColor())}>
              {getTrendIcon()}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ResourceBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  showPercentage?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function ResourceBar({
  label,
  value,
  max = 100,
  unit = "%",
  showPercentage = true,
  size = "default",
  className,
}: ResourceBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getBarColor = () => {
    if (percentage >= 90) return "bg-status-busy";
    if (percentage >= 70) return "bg-status-away";
    return "bg-primary";
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">
          {showPercentage ? `${value.toFixed(1)}${unit}` : `${value}${unit}`}
        </span>
      </div>
      <div 
        className={cn(
          "w-full rounded-full bg-muted overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", getBarColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
