import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchHistory } from "../api";
import { useTheme } from "../theme/ThemeContext";
import type { MeterReading, TimeScale } from "../types";
import { formatTimestamp } from "../utils";

interface TemperatureChartProps {
  deviceId: string;
  timeScale: TimeScale;
  refreshKey: number;
}

export function TemperatureChart({ deviceId, timeScale, refreshKey }: TemperatureChartProps) {
  const { theme } = useTheme();
  const [history, setHistory] = useState<MeterReading[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setError(false);
    setLoading(true);

    void fetchHistory(deviceId, timeScale)
      .then((response) => {
        if (active) {
          setHistory(response.history);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [deviceId, refreshKey, timeScale]);

  const colors = useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      line: styles.getPropertyValue("--chart-line").trim(),
      fill: styles.getPropertyValue("--chart-fill").trim(),
      grid: styles.getPropertyValue("--chart-grid").trim(),
      muted: styles.getPropertyValue("--muted").trim(),
      surface: styles.getPropertyValue("--surface").trim(),
      text: styles.getPropertyValue("--text").trim(),
      border: styles.getPropertyValue("--border").trim(),
    };
  }, [theme]);

  const data = useMemo(
    () =>
      history.map((reading) => ({
        label: formatTimestamp(reading.timestamp, timeScale),
        temperature: reading.temperature,
      })),
    [history, timeScale],
  );

  if (loading) {
    return <p className="chart-message">Loading history...</p>;
  }

  if (error) {
    return <p className="chart-message error-text">Failed to load history.</p>;
  }

  if (data.length === 0) {
    return <p className="chart-message">No history available for this range.</p>;
  }

  return (
    <div className="chart" aria-label="Temperature history chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`temperature-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.fill} stopOpacity={0.55} />
              <stop offset="100%" stopColor={colors.fill} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: colors.muted, fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: colors.muted, fontSize: 11 }}
            tickFormatter={(value: number) => `${value}°`}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: colors.grid }}
            contentStyle={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              color: colors.text,
            }}
            formatter={(value) => [
              value === undefined ? "—" : `${Number(value).toFixed(1)}°C`,
              "Temperature",
            ]}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={colors.line}
            strokeWidth={2.5}
            fill={`url(#temperature-${deviceId})`}
            activeDot={{ r: 5, fill: colors.line }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
