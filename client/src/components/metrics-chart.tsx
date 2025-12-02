import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { HostMetrics } from "@shared/schema";

interface MetricsChartProps {
  title: string;
  data: HostMetrics[];
  dataKey: string;
  color?: string;
  unit?: string;
  className?: string;
}

function CustomTooltip({ active, payload, label, unit }: TooltipProps<number, string> & { unit?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">
        {format(new Date(label), "HH:mm:ss")}
      </p>
      <p className="font-mono font-medium text-sm">
        {payload[0].value?.toFixed(1)}{unit}
      </p>
    </div>
  );
}

export function MetricsChart({
  title,
  data,
  dataKey,
  color = "hsl(var(--primary))",
  unit = "%",
  className,
}: MetricsChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => {
      const keys = dataKey.split(".");
      let value: unknown = d;
      for (const key of keys) {
        value = (value as Record<string, unknown>)?.[key];
      }
      return {
        timestamp: d.timestamp,
        value: typeof value === "number" ? value : 0,
      };
    });
  }, [data, dataKey]);

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), "HH:mm")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiMetricsChartProps {
  title: string;
  data: HostMetrics[];
  metrics: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  unit?: string;
  className?: string;
}

export function MultiMetricsChart({
  title,
  data,
  metrics,
  unit = "%",
  className,
}: MultiMetricsChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => {
      const result: Record<string, unknown> = { timestamp: d.timestamp };
      for (const metric of metrics) {
        const keys = metric.dataKey.split(".");
        let value: unknown = d;
        for (const key of keys) {
          value = (value as Record<string, unknown>)?.[key];
        }
        result[metric.dataKey] = typeof value === "number" ? value : 0;
      }
      return result;
    });
  }, [data, metrics]);

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-4">
            {metrics.map((metric) => (
              <div key={metric.dataKey} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-xs text-muted-foreground">{metric.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                {metrics.map((metric) => (
                  <linearGradient
                    key={metric.dataKey}
                    id={`gradient-${metric.dataKey.replace(".", "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={metric.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), "HH:mm")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, "auto"]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              {metrics.map((metric) => (
                <Area
                  key={metric.dataKey}
                  type="monotone"
                  dataKey={metric.dataKey}
                  name={metric.name}
                  stroke={metric.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${metric.dataKey.replace(".", "-")})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
