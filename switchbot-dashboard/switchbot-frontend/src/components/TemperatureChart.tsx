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
import { CHART_COLORS, type Theme } from "../theme";

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
  const colors = CHART_COLORS[theme];

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
