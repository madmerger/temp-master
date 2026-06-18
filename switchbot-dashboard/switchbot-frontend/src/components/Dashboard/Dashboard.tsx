import { useState } from 'react';
import { Box, Grid2 as Grid, Skeleton, Card, CardContent, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import DeviceCard from './DeviceCard';
import StatusBar from './StatusBar';
import TimeScaleSelector from '../Controls/TimeScaleSelector';
import RefreshButton from '../Controls/RefreshButton';
import BackupButton from '../Controls/BackupButton';
import { useMeters, useStatus } from '../../hooks/useDeviceData';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import Layout from '../Layout/Layout';
import type { TimeScale } from '../../types';

export default function Dashboard() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const { data: metersData, isLoading, isError, error } = useMeters();
  const { data: statusData } = useStatus();
  const { countdown, reset: resetCountdown } = useAutoRefresh();

  const connected = !isError;
  const meters = metersData?.meters ?? [];

  return (
    <Layout connected={connected} countdown={countdown}>
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        gap={2}
        mb={2}
      >
        <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
        <Box display="flex" gap={1}>
          <RefreshButton onRefreshComplete={resetCountdown} />
          <BackupButton />
        </Box>
      </Box>

      <StatusBar status={statusData} />

      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to fetch data: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </motion.div>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card>
                <CardContent>
                  <Skeleton width="60%" height={28} />
                  <Skeleton width="40%" height={24} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {meters.map((device, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={device.device_id}>
              <DeviceCard device={device} timeScale={timeScale} index={index} />
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  );
}
