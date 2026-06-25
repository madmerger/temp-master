import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import BatteryFullRoundedIcon from "@mui/icons-material/BatteryFullRounded";
import { motion } from "framer-motion";
import type { Meter, Reading, TimeScale } from "../api/client";
import { getDisplayName } from "../constants/displayNames";
import { formatRelative } from "../utils/format";
import MeterChart from "./MeterChart";

interface MeterCardProps {
  meter: Meter;
  history: Reading[];
  timeScale: TimeScale;
  index: number;
}

function batteryColor(battery: number): "success" | "warning" | "error" {
  if (battery >= 50) return "success";
  if (battery >= 20) return "warning";
  return "error";
}

export default function MeterCard({ meter, history, timeScale, index }: MeterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      style={{ height: "100%" }}
    >
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: 8,
            borderColor: "primary.main",
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mb: 1.5,
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {getDisplayName(meter.device_name)}
            </Typography>
            <Chip
              label={meter.device_type}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, height: 22 }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ mb: 1.5, flexWrap: "wrap" }}
          >
            {meter.current_temperature !== null && (
              <Chip
                icon={<ThermostatRoundedIcon />}
                color="error"
                label={`${meter.current_temperature.toFixed(1)}°C`}
                sx={{ fontWeight: 700 }}
              />
            )}
            {meter.current_humidity !== null && (
              <Chip
                icon={<WaterDropRoundedIcon />}
                color="info"
                label={`${meter.current_humidity}%`}
                sx={{ fontWeight: 700 }}
              />
            )}
            {meter.battery !== null && (
              <Chip
                icon={<BatteryFullRoundedIcon />}
                color={batteryColor(meter.battery)}
                variant="outlined"
                label={`${meter.battery}%`}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <MeterChart history={history} timeScale={timeScale} />
        </CardContent>

        <Box sx={{ px: 2, pb: 1.5 }}>
          <Tooltip
            title={meter.last_updated ? new Date(meter.last_updated).toLocaleString() : ""}
          >
            <Typography variant="caption" color="text.secondary">
              最終更新: {formatRelative(meter.last_updated)}
            </Typography>
          </Tooltip>
        </Box>
      </Card>
    </motion.div>
  );
}
