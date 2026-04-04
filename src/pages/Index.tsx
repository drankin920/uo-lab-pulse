import { useESP32Data } from "@/hooks/useESP32Data";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { Gauge, Thermometer, Wifi, WifiOff, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data, latest, isConnected, isPaused, togglePause } = useESP32Data(1000);

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
              onClick={togglePause}
              className="gap-2"
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <div className="flex items-center gap-1.5 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium hidden sm:inline">ESP32 Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium hidden sm:inline">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 md:px-6 py-6 space-y-6">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SensorCard
            label="Pressure"
            value={latest ? latest.pressure.toFixed(2) : "—"}
            unit="hPa"
            variant="pressure"
            icon={<Gauge className="h-5 w-5" />}
          />
          <SensorCard
            label="Temperature"
            value={latest ? latest.temperature.toFixed(2) : "—"}
            unit="°C"
            variant="temperature"
            icon={<Thermometer className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <SensorChart
            data={data}
            dataKey="pressure"
            label="Pressure"
            unit="hPa"
            color="hsl(var(--chart-pressure))"
          />
          <SensorChart
            data={data}
            dataKey="temperature"
            label="Temperature"
            unit="°C"
            color="hsl(var(--chart-temperature))"
          />
        </div>

        {/* Footer info */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Simulated ESP32 sensor data • Updates every 1s • Showing last 60 readings
        </p>
      </main>
    </div>
  );
};

export default Index;
