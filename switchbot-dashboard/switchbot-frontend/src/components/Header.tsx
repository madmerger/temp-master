import { AppBar, Box, Chip, Stack, Toolbar, Typography } from "@mui/material";
import ThermostatRoundedIcon from "@mui/icons-material/ThermostatRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import { useAppTheme } from "../theme/ThemeContext";
import ThemeMenu from "./ThemeMenu";

interface HeaderProps {
  connected: boolean;
  metersCount: number;
}

export default function Header({ connected, metersCount }: HeaderProps) {
  const { meta } = useAppTheme();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: meta.headerGradient,
        color: "common.white",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Toolbar sx={{ gap: 2, py: 1, flexWrap: "wrap" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.2)",
          }}
        >
          <ThermostatRoundedIcon />
        </Box>
        <Box sx={{ mr: "auto" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Temp Master
            </Typography>
            <Chip
              label="2.0"
              size="small"
              sx={{
                height: 20,
                fontWeight: 700,
                color: "common.white",
                bgcolor: "rgba(255,255,255,0.25)",
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            プラント環境モニタリング ダッシュボード
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Chip
            icon={
              <FiberManualRecordRoundedIcon
                sx={{ fontSize: 12, color: connected ? "#22c55e" : "#ef4444" }}
              />
            }
            label={connected ? `接続中 · ${metersCount}台` : "未接続"}
            sx={{
              color: "common.white",
              bgcolor: "rgba(255,255,255,0.16)",
              fontWeight: 600,
              "& .MuiChip-icon": { ml: 1 },
            }}
          />
          <ThemeMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
