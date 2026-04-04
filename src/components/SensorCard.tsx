import { cn } from "@/lib/utils";

interface SensorCardProps {
  label: string;
  value: string;
  unit: string;
  variant: "pressure" | "temperature";
  icon: React.ReactNode;
}

export function SensorCard({ label, value, unit, variant, icon }: SensorCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          variant === "pressure" ? "bg-chart-pressure/10 text-chart-pressure" : "bg-chart-temperature/10 text-chart-temperature"
        )}>
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold font-mono tracking-tight text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
