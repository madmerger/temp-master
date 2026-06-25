import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import type { TimeScale } from "./api/client";
import { useDashboardData } from "./hooks/useDashboardData";
import Header from "./components/Header";
import SummaryStats from "./components/SummaryStats";
import Controls from "./components/Controls";
import MeterCard from "./components/MeterCard";

const GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, 1fr)",
    lg: "repeat(3, 1fr)",
  },
};

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const {
    meters,
    status,
    history,
    loading,
    refreshing,
    error,
    connected,
    lastRefresh,
    refresh,
  } = useDashboardData(timeScale);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header connected={connected} metersCount={status?.meters_count ?? meters.length} />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={3}>
          {status?.is_rate_limited && (
            <Alert severity="warning" variant="filled">
              <AlertTitle>レート制限中</AlertTitle>
              SwitchBot API のレート制限に達しました。
              {status.backoff_remaining
                ? ` ${status.backoff_remaining} 秒後に再試行します。`
                : ""}
            </Alert>
          )}

          {error && (
            <Alert severity="error" variant="filled">
              <AlertTitle>データ取得エラー</AlertTitle>
              {error}
            </Alert>
          )}

          <SummaryStats meters={meters} />

          <Controls
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
            onRefresh={() => void refresh()}
            refreshing={refreshing}
            lastRefresh={lastRefresh}
          />

          {loading ? (
            <Box sx={GRID_SX}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={320} sx={{ borderRadius: 4 }} />
              ))}
            </Box>
          ) : meters.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                表示できるメーターがありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                バックエンドの SwitchBot 認証情報を確認してください。
              </Typography>
            </Box>
          ) : (
            <Box sx={GRID_SX}>
              {meters.map((meter, i) => (
                <MeterCard
                  key={meter.device_id}
                  meter={meter}
                  history={history[meter.device_id] ?? []}
                  timeScale={timeScale}
                  index={i}
                />
              ))}
            </Box>
          )}

          <Box component="footer" sx={{ textAlign: "center", pt: 2, pb: 4 }}>
            <Typography variant="caption" color="text.secondary">
              Temp Master Dashboard v2.0 — React 19 · TypeScript · MUI · Recharts
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
