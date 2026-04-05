import { useMemo } from "react";
import { useRealtimeReadings } from "@/hooks/useRealtimeReadings";
import { useExportCSV } from "@/hooks/useExportCSV";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import type { ChartDataPoint } from "@/components/SensorChart";
import type { TimeRange } from "@/hooks/useRealtimeReadings";
import {
  Gauge,
  Thermometer,
  Wifi,
  WifiOff,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

function formatTime(date: Date, range: TimeRange): string {
  if (range === "24h") {
    return date.toLocaleTimeString("en-US", { hour12: false });
  }
  if (range === "7d") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const Index = () => {
  const {
    currentReading,
    historicalReadings,
    hourlyReadings,
    isLoading,
    error,
    timeRange,
    setTimeRange,
  } = useRealtimeReadings();

  const { exportCSV, isExporting } = useExportCSV();

  const isConnected = currentReading != null;

  // Build chart data from raw readings (24h) or hourly aggregates (7d/30d)
  const pressureChartData: ChartDataPoint[] = useMemo(() => {
    if (timeRange === "24h") {
      return historicalReadings.map((r) => ({
        time: formatTime(r.timestamp, timeRange),
        timestamp: r.timestamp.getTime(),
        value: r.pressure,
      }));
    }
    return hourlyReadings.map((r) => ({
      time: formatTime(r.hour_start, timeRange),
      timestamp: r.hour_start.getTime(),
      value: r.pressure_avg,
      min: r.pressure_min,
      max: r.pressure_max,
    }));
  }, [historicalReadings, hourlyReadings, timeRange]);

  const temperatureChartData: ChartDataPoint[] = useMemo(() => {
    if (timeRange === "24h") {
      return historicalReadings.map((r) => ({
        time: formatTime(r.timestamp, timeRange),
        timestamp: r.timestamp.getTime(),
        value: r.temperature,
      }));
    }
    return hourlyReadings.map((r) => ({
      time: formatTime(r.hour_start, timeRange),
      timestamp: r.hour_start.getTime(),
      value: r.temp_avg,
      min: r.temp_min,
      max: r.temp_max,
    }));
  }, [historicalReadings, hourlyReadings, timeRange]);

  // Compute previous reading for trend indicator
  const previousReading =
    historicalReadings.length >= 2
      ? historicalReadings[historicalReadings.length - 2]
      : null;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <WifiOff className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">
            Connection Error
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gauge className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              UO Lab Data
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export CSV
            </Button>
            <div className="flex items-center gap-1.5 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium hidden sm:inline">
                    ESP32 Connected
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium hidden sm:inline">
                    {isLoading ? "Connecting..." : "No Data"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 md:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Sensor Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SensorCard
                label="Pressure"
                value={
                  currentReading
                    ? currentReading.pressure.toFixed(2)
                    : "\u2014"
                }
                unit={currentReading?.unit_pressure || "hPa"}
                variant="pressure"
                icon={<Gauge className="h-5 w-5" />}
                lastUpdated={currentReading?.timestamp}
                previousValue={previousReading?.pressure}
                currentValue={currentReading?.pressure}
              />
              <SensorCard
                label="Temperature"
                value={
                  currentReading
                    ? currentReading.temperature.toFixed(2)
                    : "\u2014"
                }
                unit={
                  currentReading?.unit_temp === "Fahrenheit"
                    ? "\u00b0F"
                    : "\u00b0C"
                }
                variant="temperature"
                icon={<Thermometer className="h-5 w-5" />}
                lastUpdated={currentReading?.timestamp}
                previousValue={previousReading?.temperature}
                currentValue={currentReading?.temperature}
              />
            </div>

            {/* Time Range Picker */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Historical Data
              </h2>
              <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                {TIME_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      timeRange === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
              <SensorChart
                data={pressureChartData}
                label="Pressure"
                unit="hPa"
                color="hsl(var(--chart-pressure))"
                timeRange={timeRange}
              />
              <SensorChart
                data={temperatureChartData}
                label="Temperature"
                unit={
                  currentReading?.unit_temp === "Fahrenheit"
                    ? "\u00b0F"
                    : "\u00b0C"
                }
                color="hsl(var(--chart-temperature))"
                timeRange={timeRange}
              />
            </div>

            {/* Footer info */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              ESP32 sensor data &bull; Updates every 5s &bull; Real-time via
              Firebase
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
