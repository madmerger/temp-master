import {
  Box,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import type { TimeScale } from "../api/client";
import { backupUrl } from "../api/client";
import { formatClock } from "../utils/format";

const SCALES: { value: TimeScale; label: string }[] = [
  { value: "hour", label: "1時間" },
  { value: "day", label: "24時間" },
  { value: "week", label: "7日" },
  { value: "month", label: "30日" },
  { value: "year", label: "1年" },
];

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastRefresh: Date | null;
}

export default function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  refreshing,
  lastRefresh,
}: ControlsProps) {
  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      spacing={2}
      sx={{
        mb: 1,
        alignItems: { xs: "stretch", lg: "center" },
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          表示期間
        </Typography>
        <ToggleButtonGroup
          value={timeScale}
          exclusive
          size="small"
          onChange={(_, value: TimeScale | null) => value && onTimeScaleChange(value)}
          sx={{ display: "flex", flexWrap: "wrap", mt: 0.5 }}
        >
          {SCALES.map((s) => (
            <ToggleButton key={s.value} value={s.value}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <Chip
          icon={<AutorenewRoundedIcon />}
          size="small"
          variant="outlined"
          label={
            lastRefresh ? `自動更新 · ${formatClock(lastRefresh)}` : "自動更新 30秒"
          }
        />
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "更新中…" : "今すぐ更新"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadRoundedIcon />}
          component="a"
          href={backupUrl()}
          target="_blank"
          rel="noopener"
        >
          バックアップ
        </Button>
      </Stack>
    </Stack>
  );
}
