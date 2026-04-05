import { useCallback, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Papa from "papaparse";

interface ExportRow {
  timestamp: string;
  temperature: number;
  pressure: number;
  unit_temp: string;
  unit_pressure: string;
  device_id: string;
}

interface UseExportCSVReturn {
  exportCSV: () => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

export function useExportCSV(): UseExportCSVReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCSV = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Fetch last 30 days of raw readings
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const cutoffTimestamp = Timestamp.fromDate(cutoff);

      const q = query(
        collection(db, "readings"),
        where("timestamp", ">=", cutoffTimestamp),
        orderBy("timestamp", "asc")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No data available to export");
        setIsExporting(false);
        return;
      }

      const rows: ExportRow[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const ts = data.timestamp?.toDate() || new Date();
        return {
          timestamp: ts.toISOString(),
          temperature: data.temperature,
          pressure: data.pressure,
          unit_temp: data.unit_temp || "Celsius",
          unit_pressure: data.unit_pressure || "hPa",
          device_id: data.device_id || "esp32-lab-01",
        };
      });

      const csv = Papa.unparse(rows, {
        header: true,
        columns: [
          "timestamp",
          "temperature",
          "pressure",
          "unit_temp",
          "unit_pressure",
          "device_id",
        ],
      });

      // Trigger browser download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `readings_export_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportCSV, isExporting, error };
}
