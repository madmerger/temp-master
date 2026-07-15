import CloudDownloadRoundedIcon from "@mui/icons-material/CloudDownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchHistory,
  fetchMeters,
  fetchStatus,
  getBackupUrl,
  triggerRefresh,
} from "./api/client";
import { DashboardHeader } from "./components/DashboardHeader";
import { MeterCard } from "./components/MeterCard";
import { REFRESH_INTERVAL, TIME_SCALE_OPTIONS } from "./constants";
import { useColorMode } from "./hooks/useColorMode";
import { createDashboardTheme } from "./theme";
import type {
  DashboardStatus,
  HistoryByDevice,
  MeterDevice,
  TimeScale,
} from "./types/api";
import { isStaleMeter } from "./utils/meter";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "不明なエラーが発生しました";
}

function LoadingCards() {
  return (
    <Grid container spacing={2.5}>
      {[0, 1, 2].map((item) => (
        <Grid key={item} size={{ xs: 12, md: 6, xl: 4 }}>
          <Card>
            <CardContent>
              <Skeleton width="55%" height={34} />
              <Skeleton width="35%" />
              <Skeleton
                variant="rounded"
                height={78}
                sx={{ my: 2, borderRadius: 2 }}
              />
              <Skeleton variant="rounded" height={210} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function App() {
  const { mode, toggleMode } = useColorMode();
  const theme = useMemo(() => createDashboardTheme(mode), [mode]);
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [historyByDevice, setHistoryByDevice] = useState<HistoryByDevice>({});
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const requestId = useRef(0);

  const loadDashboard = useCallback(
    async (showLoading = false) => {
      const currentRequestId = ++requestId.current;
      if (showLoading) {
        setLoading(true);
      }

      try {
        const [metersResponse, statusResponse] = await Promise.all([
          fetchMeters(),
          fetchStatus(),
        ]);
        const activeMeters = metersResponse.meters.filter(
          (meter) => !isStaleMeter(meter),
        );
        const historyResults = await Promise.all(
          activeMeters.map(async (meter) => {
            try {
              const response = await fetchHistory(meter.device_id, timeScale);
              return [meter.device_id, response.history] as const;
            } catch {
              return [meter.device_id, null] as const;
            }
          }),
        );

        if (currentRequestId !== requestId.current) {
          return;
        }

        const failedHistoryCount = historyResults.filter(
          ([, history]) => history === null,
        ).length;
        const nextHistory = Object.fromEntries(
          historyResults
            .filter((result) => result[1] !== null)
            .map(([deviceId, history]) => [deviceId, history]),
        );

        setMeters(metersResponse.meters);
        setStatus(statusResponse);
        setHistoryByDevice(nextHistory);
        setHistoryWarning(
          failedHistoryCount > 0
            ? `${failedHistoryCount}台の履歴データを取得できませんでした。`
            : null,
        );
        setLastRefresh(new Date());
        setError(null);
      } catch (loadError) {
        if (currentRequestId === requestId.current) {
          setError(`データ取得に失敗しました: ${getErrorMessage(loadError)}`);
        }
      } finally {
        if (currentRequestId === requestId.current) {
          setLoading(false);
        }
      }
    },
    [timeScale],
  );

  useEffect(() => {
    void loadDashboard(true);
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, REFRESH_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  const handleTimeScaleChange = (event: SelectChangeEvent<TimeScale>) => {
    setTimeScale(event.target.value as TimeScale);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await triggerRefresh();
      await loadDashboard();
    } catch (refreshError) {
      setError(`手動更新に失敗しました: ${getErrorMessage(refreshError)}`);
    } finally {
      setRefreshing(false);
    }
  };

  const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
  const staleMeters = meters.filter(isStaleMeter);
  const connected = !error && status !== null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardHeader
        connected={connected}
        mode={mode}
        onToggleMode={toggleMode}
      />

      <Box
        component="main"
        sx={{
          minHeight: "calc(100vh - 76px)",
          background:
            mode === "dark"
              ? "radial-gradient(circle at 10% 0%, rgba(2, 132, 199, 0.13), transparent 30%)"
              : "radial-gradient(circle at 10% 0%, rgba(2, 132, 199, 0.09), transparent 30%)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "flex-end" },
              mb: 3,
            }}
          >
            <Box>
              <Typography
                component="h2"
                variant="h4"
                sx={{ fontWeight: 850, mb: 0.5 }}
              >
                環境モニタリング
              </Typography>
              <Typography color="text.secondary">
                SwitchBotメーターの温度・湿度・バッテリーをリアルタイム監視
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              sx={{ alignItems: { xs: "stretch", sm: "center" } }}
            >
              <FormControl size="small" sx={{ minWidth: 156 }}>
                <InputLabel id="time-scale-label">表示期間</InputLabel>
                <Select<TimeScale>
                  labelId="time-scale-label"
                  value={timeScale}
                  label="表示期間"
                  onChange={handleTimeScaleChange}
                >
                  {TIME_SCALE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={
                  refreshing ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : (
                    <RefreshRoundedIcon />
                  )
                }
                disabled={refreshing}
                onClick={() => void handleRefresh()}
              >
                {refreshing ? "更新中" : "データ更新"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadRoundedIcon />}
                component="a"
                href={getBackupUrl()}
                target="_blank"
                rel="noreferrer"
              >
                バックアップ
              </Button>
            </Stack>
          </Stack>

          {status && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent
                sx={{
                  py: 1.5,
                  "&:last-child": { pb: 1.5 },
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Chip
                    label={`${status.meters_count} meters`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    監視中
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  最終取得:{" "}
                  {lastRefresh
                    ? lastRefresh.toLocaleTimeString("ja-JP")
                    : "—"}
                </Typography>
              </CardContent>
            </Card>
          )}

          {status?.is_rate_limited && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              <AlertTitle>SwitchBot APIのレート制限中</AlertTitle>
              約{status.backoff_remaining}秒後に再試行します。
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
              <AlertTitle>接続エラー</AlertTitle>
              {error}
            </Alert>
          )}

          {historyWarning && (
            <Alert severity="info" sx={{ mb: 2.5 }}>
              {historyWarning}
            </Alert>
          )}

          {loading ? (
            <LoadingCards />
          ) : meters.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 8, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  メーターが登録されていません
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  バックエンドのSwitchBot設定を確認してください。
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Grid container spacing={2.5}>
                {activeMeters.map((meter) => (
                  <Grid
                    key={meter.device_id}
                    size={{ xs: 12, md: 6, xl: 4 }}
                  >
                    <MeterCard
                      meter={meter}
                      history={historyByDevice[meter.device_id] ?? []}
                      timeScale={timeScale}
                    />
                  </Grid>
                ))}
              </Grid>

              {staleMeters.length > 0 && (
                <Box sx={{ mt: 5 }}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: "center", mb: 2 }}
                  >
                    <WarningAmberRoundedIcon color="warning" />
                    <Box>
                      <Typography
                        component="h2"
                        variant="h6"
                        sx={{ fontWeight: 850 }}
                      >
                        未更新のメーター
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        1週間以上更新されていないデバイス
                      </Typography>
                    </Box>
                  </Stack>
                  <Grid container spacing={2.5}>
                    {staleMeters.map((meter) => (
                      <Grid
                        key={meter.device_id}
                        size={{ xs: 12, md: 6, xl: 4 }}
                      >
                        <MeterCard
                          meter={meter}
                          history={[]}
                          timeScale={timeScale}
                          stale
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}

          <Typography
            component="footer"
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ display: "block", mt: 6, pb: 2 }}
          >
            Temp Master Dashboard · React + Vite + TypeScript
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
