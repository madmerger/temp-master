import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { useQueryClient } from '@tanstack/react-query';

import AppBar from './components/Layout/AppBar';
import Footer from './components/Layout/Footer';
import StatusBar from './components/Dashboard/StatusBar';
import TimeRangeSelector from './components/Dashboard/TimeRangeSelector';
import MeterGrid from './components/Dashboard/MeterGrid';
import { useMeters } from './hooks/useMeters';
import { triggerRefresh, downloadBackup } from './api/client';
import type { TimeScale } from './types/meter';

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useMeters();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await triggerRefresh();
      await queryClient.invalidateQueries();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRefreshError(`Failed to refresh: ${msg}`);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const meters = data?.meters ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar />

      <Container maxWidth="xl" sx={{ mt: 10, mb: 2, flexGrow: 1 }}>
        <StatusBar />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3, alignItems: { sm: 'center' } }}
        >
          <TimeRangeSelector value={timeScale} onChange={setTimeScale} />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadBackup}
          >
            Download Backup
          </Button>
        </Stack>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {refreshError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRefreshError(null)}>
            {refreshError}
          </Alert>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to fetch data: {(error as Error).message}
          </Alert>
        )}

        {!isLoading && !isError && meters.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
            No meters found.
          </Typography>
        )}

        {!isLoading && meters.length > 0 && (
          <MeterGrid meters={meters} timeScale={timeScale} />
        )}
      </Container>

      <Footer />
    </Box>
  );
}
