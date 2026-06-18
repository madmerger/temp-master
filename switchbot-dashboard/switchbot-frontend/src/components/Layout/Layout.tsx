import { Box, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  connected: boolean;
  countdown: number;
}

export default function Layout({ children, connected, countdown }: LayoutProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        transition: 'background-color 0.3s ease',
      }}
    >
      <Header connected={connected} countdown={countdown} />
      <Box
        component="main"
        sx={{
          pt: { xs: 9, sm: 10 },
          px: { xs: 1.5, sm: 3 },
          pb: 4,
          maxWidth: 1600,
          mx: 'auto',
        }}
      >
        {children}
      </Box>
      <Box
        component="footer"
        sx={{
          textAlign: 'center',
          color: theme.palette.text.secondary,
          fontSize: 12,
          pb: 3,
        }}
      >
        Temp Master Dashboard v2.0 — React + MUI + Recharts
      </Box>
    </Box>
  );
}
