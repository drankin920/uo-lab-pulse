import { useState, useEffect, useCallback, useRef } from "react";

export interface SensorReading {
  time: string;
  timestamp: number;
  pressure: number;
  temperature: number;
}

const MAX_POINTS = 60;

function generateReading(): Omit<SensorReading, "time" | "timestamp"> {
  return {
    pressure: 1013.25 + (Math.random() - 0.5) * 10 + Math.sin(Date.now() / 5000) * 3,
    temperature: 22.5 + (Math.random() - 0.5) * 2 + Math.sin(Date.now() / 8000) * 1.5,
  };
}

export function useESP32Data(intervalMs = 1000) {
  const [data, setData] = useState<SensorReading[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const addReading = useCallback(() => {
    const now = new Date();
    const reading = generateReading();
    const entry: SensorReading = {
      time: now.toLocaleTimeString("en-US", { hour12: false }),
      timestamp: now.getTime(),
      ...reading,
    };

    setData((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Seed initial data
    if (data.length === 0) {
      const seed: SensorReading[] = [];
      const now = Date.now();
      for (let i = 30; i >= 0; i--) {
        const t = new Date(now - i * intervalMs);
        seed.push({
          time: t.toLocaleTimeString("en-US", { hour12: false }),
          timestamp: t.getTime(),
          ...generateReading(),
        });
      }
      setData(seed);
    }

    intervalRef.current = setInterval(addReading, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, intervalMs, addReading]);

  const togglePause = () => setIsPaused((p) => !p);

  const latest = data.length > 0 ? data[data.length - 1] : null;

  return { data, latest, isConnected, isPaused, togglePause };
}
