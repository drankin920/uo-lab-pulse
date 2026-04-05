import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TimeRange } from "@/hooks/useRealtimeReadings";

export interface ChartDataPoint {
  time: string;
  timestamp: number;
  value: number;
  min?: number;
  max?: number;
}

interface SensorChartProps {
  data: ChartDataPoint[];
  label: string;
  unit: string;
  color: string;
  timeRange: TimeRange;
}

function formatTimeLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case "24h":
      return "Last 24 Hours";
    case "7d":
      return "Last 7 Days (Hourly Avg)";
    case "30d":
      return "Last 30 Days (Hourly Avg)";
  }
}

export function SensorChart({
  data,
  label,
  unit,
  color,
  timeRange,
}: SensorChartProps) {
  const values = data.map((d) => d.value);
  const allValues = [
    ...values,
    ...data.filter((d) => d.min != null).map((d) => d.min!),
    ...data.filter((d) => d.max != null).map((d) => d.max!),
  ];
  const min = allValues.length > 0 ? Math.min(...allValues) : 0;
  const max = allValues.length > 0 ? Math.max(...allValues) : 1;
  const padding = (max - min) * 0.2 || 1;

  const showRange = timeRange !== "24h" && data.some((d) => d.min != null);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {formatTimeLabel(timeRange)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{unit}</span>
        </div>
      </div>
      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No data available for this time range
          </div>
        ) : showRange ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                domain={[
                  Math.floor(min - padding),
                  Math.ceil(max + padding),
                ]}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => {
                  const displayName =
                    name === "value"
                      ? "Avg"
                      : name === "min"
                        ? "Min"
                        : "Max";
                  return [`${value.toFixed(2)} ${unit}`, displayName];
                }}
              />
              <Area
                type="monotone"
                dataKey="max"
                stroke="none"
                fill={color}
                fillOpacity={0.1}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="min"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="time"
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[
                  Math.floor(min - padding),
                  Math.ceil(max + padding),
                ]}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number) => [
                  `${value.toFixed(2)} ${unit}`,
                  label,
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
