import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useThemeContext, THEME_OPTIONS, type ThemeName } from '../theme';

export default function ThemeSwitcher() {
  const { themeName, setThemeName } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Change theme"
      >
        <PaletteIcon />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Theme
          </Typography>
          <Stack spacing={1}>
            {THEME_OPTIONS.map((opt) => (
              <Box
                key={opt.name}
                onClick={() => {
                  setThemeName(opt.name as ThemeName);
                  setAnchorEl(null);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {opt.colors.map((c, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: c,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {opt.label}
                </Typography>
                {themeName === opt.name && (
                  <CheckCircleIcon fontSize="small" color="primary" />
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
