import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RawReading {
  id: string;
  device_id: string;
  temperature: number;
  pressure: number;
  unit_temp: string;
  unit_pressure: string;
  timestamp: Date;
}

export interface HourlyReading {
  id: string;
  device_id: string;
  temp_avg: number;
  temp_min: number;
  temp_max: number;
  pressure_avg: number;
  pressure_min: number;
  pressure_max: number;
  reading_count: number;
  hour_start: Date;
  hour_end: Date;
}

export type TimeRange = "24h" | "7d" | "30d";

interface UseRealtimeReadingsReturn {
  currentReading: RawReading | null;
  historicalReadings: RawReading[];
  hourlyReadings: HourlyReading[];
  isLoading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

function getTimeRangeCutoff(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export function useRealtimeReadings(): UseRealtimeReadingsReturn {
  const [currentReading, setCurrentReading] = useState<RawReading | null>(null);
  const [historicalReadings, setHistoricalReadings] = useState<RawReading[]>([]);
  const [hourlyReadings, setHourlyReadings] = useState<HourlyReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  // Real-time listener for the latest reading
  useEffect(() => {
    const q = query(
      collection(db, "readings"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setCurrentReading({
            id: doc.id,
            device_id: data.device_id,
            temperature: data.temperature,
            pressure: data.pressure,
            unit_temp: data.unit_temp || "Celsius",
            unit_pressure: data.unit_pressure || "hPa",
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore real-time listener error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch historical data based on selected time range
  const fetchHistoricalData = useCallback(async () => {
    const cutoff = getTimeRangeCutoff(timeRange);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    try {
      if (timeRange === "24h") {
        // Query raw readings for 24h view
        const q = query(
          collection(db, "readings"),
          where("timestamp", ">=", cutoffTimestamp),
          orderBy("timestamp", "asc")
        );

        const snapshot = await getDocs(q);
        const readings: RawReading[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            device_id: data.device_id,
            temperature: data.temperature,
            pressure: data.pressure,
            unit_temp: data.unit_temp || "Celsius",
            unit_pressure: data.unit_pressure || "hPa",
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        });
        setHistoricalReadings(readings);
        setHourlyReadings([]);
      } else {
        // Query hourly aggregated data for 7d and 30d views
        const q = query(
          collection(db, "readings_hourly"),
          where("hour_start", ">=", cutoffTimestamp),
          orderBy("hour_start", "asc")
        );

        const snapshot = await getDocs(q);
        const readings: HourlyReading[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            device_id: data.device_id,
            temp_avg: data.temp_avg,
            temp_min: data.temp_min,
            temp_max: data.temp_max,
            pressure_avg: data.pressure_avg,
            pressure_min: data.pressure_min,
            pressure_max: data.pressure_max,
            reading_count: data.reading_count,
            hour_start: data.hour_start?.toDate() || new Date(),
            hour_end: data.hour_end?.toDate() || new Date(),
          };
        });
        setHourlyReadings(readings);
        setHistoricalReadings([]);
      }
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch historical data");
    }
  }, [timeRange]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Also set up a real-time listener for live updates on the 24h view
  useEffect(() => {
    if (timeRange !== "24h") return;

    const cutoff = getTimeRangeCutoff("24h");
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    const q = query(
      collection(db, "readings"),
      where("timestamp", ">=", cutoffTimestamp),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const readings: RawReading[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            device_id: data.device_id,
            temperature: data.temperature,
            pressure: data.pressure,
            unit_temp: data.unit_temp || "Celsius",
            unit_pressure: data.unit_pressure || "hPa",
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        });
        setHistoricalReadings(readings);
      },
      (err) => {
        console.error("Firestore historical listener error:", err);
      }
    );

    return () => unsubscribe();
  }, [timeRange]);

  return {
    currentReading,
    historicalReadings,
    hourlyReadings,
    isLoading,
    error,
    timeRange,
    setTimeRange,
  };
}
