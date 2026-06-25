import { useState, type MouseEvent } from "react";
import {
  Box,
  Button,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useAppTheme } from "../theme/ThemeContext";

function Swatch({ colors }: { colors: [string, string] }) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`,
        border: "2px solid rgba(255,255,255,0.6)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}
    />
  );
}

export default function ThemeMenu() {
  const { themes, themeId, meta, setThemeId } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={(e: MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)}
        startIcon={<PaletteRoundedIcon />}
        sx={{
          color: "common.white",
          bgcolor: "rgba(255,255,255,0.16)",
          "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
          backdropFilter: "blur(4px)",
        }}
      >
        テーマ: {meta.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 280, borderRadius: 3 } } }}
      >
        <Typography
          variant="overline"
          sx={{ px: 2, pt: 1, display: "block", color: "text.secondary" }}
        >
          テーマを選択
        </Typography>
        {themes.map((t) => (
          <MenuItem
            key={t.id}
            selected={t.id === themeId}
            onClick={() => {
              setThemeId(t.id);
              setAnchorEl(null);
            }}
            sx={{ py: 1.25 }}
          >
            <Stack direction="row" spacing={1.5} sx={{ width: "100%", alignItems: "center" }}>
              <Swatch colors={t.swatch} />
              <ListItemText primary={t.label} secondary={t.description} />
              {t.id === themeId && <CheckRoundedIcon color="primary" fontSize="small" />}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
