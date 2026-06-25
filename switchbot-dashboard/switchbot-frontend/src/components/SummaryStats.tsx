import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Meter } from "../api/client";

interface StatItem {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function SummaryStats({ meters }: { meters: Meter[] }) {
  const temps = meters
    .map((m) => m.current_temperature)
    .filter((v): v is number => v !== null && v !== undefined);
  const humidities = meters
    .map((m) => m.current_humidity)
    .filter((v): v is number => v !== null && v !== undefined);

  const avgTemp = average(temps);
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const avgHum = average(humidities);
  const reporting = meters.filter((m) => m.current_temperature !== null).length;

  const stats: StatItem[] = [
    {
      label: "監視対象",
      value: `${reporting} / ${meters.length} 台`,
      icon: <SensorsRoundedIcon />,
      color: "#0ea5e9",
    },
    {
      label: "平均温度",
      value: avgTemp !== null ? `${avgTemp.toFixed(1)}°C` : "—",
      icon: <DeviceThermostatRoundedIcon />,
      color: "#f97316",
    },
    {
      label: "最高温度",
      value: maxTemp !== null ? `${maxTemp.toFixed(1)}°C` : "—",
      icon: <LocalFireDepartmentRoundedIcon />,
      color: "#ef4444",
    },
    {
      label: "平均湿度",
      value: avgHum !== null ? `${avgHum.toFixed(0)}%` : "—",
      icon: <WaterDropRoundedIcon />,
      color: "#3b82f6",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
      }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
        >
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                    bgcolor: `${s.color}1f`,
                  }}
                >
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {s.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    {s.value}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Box>
  );
}
