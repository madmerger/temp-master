import { useId } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Reading, TimeScale } from "../api/client";
import { formatTimestamp } from "../utils/format";

interface MeterChartProps {
  history: Reading[];
  timeScale: TimeScale;
}

export default function MeterChart({ history, timeScale }: MeterChartProps) {
  const theme = useTheme();
  const gradientId = useId();

  if (history.length === 0) {
    return (
      <Box
        sx={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          履歴データがまだありません
        </Typography>
      </Box>
    );
  }

  const data = history.map((r) => ({
    label: formatTimestamp(r.timestamp, timeScale),
    temperature: r.temperature,
  }));

  const color = theme.palette.primary.main;
  const gridColor =
    theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const axisColor = theme.palette.text.secondary;

  return (
    <Box sx={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: axisColor }}
            interval="preserveStartEnd"
            minTickGap={24}
            tickLine={false}
            axisLine={{ stroke: gridColor }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v: number) => `${v}°`}
            domain={["dataMin - 1", "dataMax + 1"]}
          />
          <Tooltip
            contentStyle={{
              background: theme.palette.background.paper,
              border: `1px solid ${gridColor}`,
              borderRadius: 12,
              fontSize: 12,
              color: theme.palette.text.primary,
            }}
            labelStyle={{ color: axisColor }}
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, "温度"]}
          />
          <Area
            type="monotone"
            dataKey="temperature"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
