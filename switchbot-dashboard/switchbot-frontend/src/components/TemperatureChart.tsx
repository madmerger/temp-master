import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { HistoryPoint, TimeScale } from "../api";
import { formatTimestamp } from "../constants";
import type { Theme } from "../theme";

interface ChartColors {
  grid: string;
  axis: string;
  line: string;
  fill: string;
}

function readColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function useChartColors(theme: Theme): ChartColors {
  const [colors, setColors] = useState<ChartColors>({
    grid: "rgba(15, 23, 42, 0.08)",
    axis: "#94a3b8",
    line: "#dc2626",
    fill: "rgba(220, 38, 38, 0.15)",
  });

  useEffect(() => {
    setColors({
      grid: readColor("--chart-grid", "rgba(15, 23, 42, 0.08)"),
      axis: readColor("--chart-axis", "#94a3b8"),
      line: readColor("--chart-line", "#dc2626"),
      fill: readColor("--chart-fill", "rgba(220, 38, 38, 0.15)"),
    });
  }, [theme]);

  return colors;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const value = payload[0].value;
  if (value === null || value === undefined) {
    return null;
  }
  return (
    <div className="recharts-tooltip-custom">
      {Number(value).toFixed(1)}&#176;C
    </div>
  );
}

interface Props {
  history: HistoryPoint[];
  timeScale: TimeScale;
  theme: Theme;
}

export function TemperatureChart({ history, timeScale, theme }: Props) {
  const colors = useChartColors(theme);

  const data = history.map((point) => ({
    label: formatTimestamp(point.timestamp, timeScale),
    temperature: point.temperature,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fill: colors.axis, fontSize: 10 }}
          stroke={colors.axis}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: colors.axis, fontSize: 10 }}
          stroke={colors.axis}
          width={44}
          tickFormatter={(value: number) => `${value}\u00b0`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke={colors.line}
          strokeWidth={2}
          dot={{ r: 2, fill: colors.line }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
