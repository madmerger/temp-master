import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import {
  AppBar,
  Box,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import type { PaletteMode } from "@mui/material";

interface DashboardHeaderProps {
  connected: boolean;
  mode: PaletteMode;
  onToggleMode: () => void;
}

export function DashboardHeader({
  connected,
  mode,
  onToggleMode,
}: DashboardHeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "text.primary",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 68, sm: 76 } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 2.5,
                color: "#fff",
                background:
                  "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                boxShadow: "0 10px 28px rgba(2, 132, 199, 0.28)",
              }}
            >
              <SensorsRoundedIcon />
            </Box>
            <Box>
              <Typography
                component="h1"
                sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, fontWeight: 850 }}
              >
                Temp Master
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Environmental Monitoring Dashboard
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip
              label={connected ? "Connected" : "Disconnected"}
              color={connected ? "success" : "error"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            <Tooltip
              title={mode === "dark" ? "ライトテーマに切替" : "ダークテーマに切替"}
            >
              <IconButton
                aria-label={
                  mode === "dark" ? "ライトテーマに切替" : "ダークテーマに切替"
                }
                onClick={onToggleMode}
                color="inherit"
              >
                {mode === "dark" ? (
                  <LightModeRoundedIcon />
                ) : (
                  <DarkModeRoundedIcon />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
