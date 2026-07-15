import BatteryChargingFullRoundedIcon from "@mui/icons-material/BatteryChargingFullRounded";
import DeviceThermostatRoundedIcon from "@mui/icons-material/DeviceThermostatRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Typography,
} from "@mui/material";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import type {
  MeterDevice,
  MeterReading,
  TimeScale,
} from "../types/api";
import { formatDateTime, getDisplayName } from "../utils/meter";

const TemperatureChart = lazy(async () => {
  const module = await import("./TemperatureChart");
  return { default: module.TemperatureChart };
});

interface MeterCardProps {
  meter: MeterDevice;
  history: MeterReading[];
  timeScale: TimeScale;
  stale?: boolean;
}

interface MetricProps {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}

function Metric({ icon, label, value, color }: MetricProps) {
  return (
    <Box
      sx={{
        minWidth: 0,
        flex: "1 1 92px",
        p: 1.25,
        borderRadius: 2,
        bgcolor: "action.hover",
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "center", color }}
      >
        {icon}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: "1.25rem", fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatMetric(value: number | null, suffix: string): string {
  return value === null ? "—" : `${value}${suffix}`;
}

export function MeterCard({
  meter,
  history,
  timeScale,
  stale = false,
}: MeterCardProps) {
  return (
    <Card
      component="article"
      sx={{
        height: "100%",
        borderColor: stale ? "warning.main" : undefined,
        opacity: stale ? 0.88 : 1,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: 2.5 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h3"
              variant="h6"
              sx={{ fontWeight: 800, lineHeight: 1.3 }}
            >
              {getDisplayName(meter.device_name)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ wordBreak: "break-all" }}
            >
              {meter.device_name}
            </Typography>
          </Box>
          <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}>
            <Chip label={meter.device_type} size="small" variant="outlined" />
            {stale && (
              <Chip
                label="7日以上未更新"
                color="warning"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 1, my: 2.25 }}
        >
          <Metric
            icon={<DeviceThermostatRoundedIcon fontSize="small" />}
            label="温度"
            value={formatMetric(meter.current_temperature, "°C")}
            color="error.main"
          />
          <Metric
            icon={<OpacityRoundedIcon fontSize="small" />}
            label="湿度"
            value={formatMetric(meter.current_humidity, "%")}
            color="primary.main"
          />
          <Metric
            icon={<BatteryChargingFullRoundedIcon fontSize="small" />}
            label="電池"
            value={formatMetric(meter.battery, "%")}
            color="success.main"
          />
        </Stack>

        {stale ? (
          <Box
            sx={{
              height: 210,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              px: 2,
              borderRadius: 2,
              bgcolor: "warning.main",
              color: "warning.contrastText",
              opacity: 0.85,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              未更新メーターは履歴データの取得対象外です
            </Typography>
          </Box>
        ) : (
          <Suspense
            fallback={
              <Skeleton variant="rounded" height={210} sx={{ borderRadius: 2 }} />
            }
          >
            <TemperatureChart history={history} timeScale={timeScale} />
          </Suspense>
        )}

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", mt: 1.5, color: "text.secondary" }}
        >
          <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            最終更新: {formatDateTime(meter.last_updated)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
