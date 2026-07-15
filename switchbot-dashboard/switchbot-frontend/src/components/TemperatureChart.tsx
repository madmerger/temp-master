import { Box, Typography, useTheme } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MeterReading, TimeScale } from "../types/api";
import { formatTimestamp } from "../utils/meter";

interface TemperatureChartProps {
  history: MeterReading[];
  timeScale: TimeScale;
}

export function TemperatureChart({
  history,
  timeScale,
}: TemperatureChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const lineColor = isDark ? "#38bdf8" : "#0284c7";
  const gridColor = isDark
    ? "rgba(148, 163, 184, 0.16)"
    : "rgba(15, 23, 42, 0.09)";
  const axisColor = theme.palette.text.secondary;
  const chartData = history.map((reading) => ({
    timestamp: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
  }));

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          height: 210,
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          bgcolor: "action.hover",
        }}
      >
        <Typography color="text.secondary" variant="body2">
          この期間の履歴データはありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: 210 }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 4, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="temperature-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={gridColor}
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            stroke={axisColor}
            tick={{ fill: axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            stroke={axisColor}
            tick={{ fill: axisColor, fontSize: 11 }}
            tickFormatter={(value: number) => `${value}°`}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value) => [
              value === undefined ? "—" : `${Number(value).toFixed(1)}°C`,
              "温度",
            ]}
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${gridColor}`,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              boxShadow: theme.shadows[8],
            }}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={lineColor}
            strokeWidth={2.5}
            fill="url(#temperature-fill)"
            dot={false}
            activeDot={{ r: 5, fill: lineColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
