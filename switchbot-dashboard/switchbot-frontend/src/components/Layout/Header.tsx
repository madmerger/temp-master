import {
  AppBar,
  Toolbar,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CircleIcon from '@mui/icons-material/Circle';
import { useState } from 'react';
import { useThemeContext } from '../../context/ThemeContext';
import { themeNames, themeLabels, themeSwatchColors } from '../../themes';
import type { ThemeName } from '../../types';

interface HeaderProps {
  connected: boolean;
  countdown: number;
}

export default function Header({ connected, countdown }: HeaderProps) {
  const { themeName, setThemeName } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="fixed"
      sx={{
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            flexGrow: 1,
          }}
        >
          {isMobile ? 'Temp Master' : 'Temp Master Dashboard'}
        </Typography>

        <Chip
          size="small"
          label={`${countdown}s`}
          variant="outlined"
          sx={{ mr: 1, fontVariantNumeric: 'tabular-nums' }}
        />

        <Chip
          size="small"
          label={connected ? 'Connected' : 'Disconnected'}
          color={connected ? 'success' : 'error'}
          sx={{ mr: 1 }}
        />

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: theme.palette.text.secondary }}
        >
          <PaletteIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {themeNames.map((name: ThemeName) => (
            <MenuItem
              key={name}
              selected={name === themeName}
              onClick={() => {
                setThemeName(name);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <CircleIcon sx={{ color: themeSwatchColors[name], fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText>{themeLabels[name]}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
