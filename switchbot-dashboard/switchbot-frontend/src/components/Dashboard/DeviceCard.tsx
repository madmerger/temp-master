import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
  Collapse,
  IconButton,
  useTheme,
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { motion, AnimatePresence } from 'framer-motion';
import TemperatureChart from '../Charts/TemperatureChart';
import MiniSparkline from '../Charts/MiniSparkline';
import { useHistory } from '../../hooks/useDeviceData';
import { getDisplayName, formatRelativeTime } from '../../utils/format';
import type { MeterDevice, TimeScale } from '../../types';

interface DeviceCardProps {
  device: MeterDevice;
  timeScale: TimeScale;
  index: number;
}

export default function DeviceCard({ device, timeScale, index }: DeviceCardProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: historyData, isLoading: historyLoading } = useHistory(device.device_id, timeScale);
  const theme = useTheme();

  const displayName = getDisplayName(device.device_name);
  const isOnline = device.last_updated
    ? Date.now() - new Date(device.last_updated).getTime() < 600_000
    : false;
  const history = historyData?.history ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card
        sx={{
          height: '100%',
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ pb: expanded ? 2 : 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Box display="flex" alignItems="center" gap={1} minWidth={0}>
              <FiberManualRecordIcon
                sx={{
                  fontSize: 10,
                  color: isOnline ? theme.palette.success.main : theme.palette.error.main,
                  animation: isOnline ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {displayName}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip
                label={device.device_type}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 22 }}
              />
              <IconButton
                size="small"
                onClick={() => setExpanded((p) => !p)}
                sx={{
                  transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.3s',
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
            {device.current_temperature !== null && (
              <AnimatedStat
                icon={<ThermostatIcon sx={{ fontSize: 14 }} />}
                value={`${device.current_temperature}°C`}
                color={theme.chart.temperature}
              />
            )}
            {device.current_humidity !== null && (
              <AnimatedStat
                icon={<WaterDropIcon sx={{ fontSize: 14 }} />}
                value={`${device.current_humidity}%`}
                color={theme.chart.humidity}
              />
            )}
            {device.battery !== null && (
              <AnimatedStat
                icon={<BatteryFullIcon sx={{ fontSize: 14 }} />}
                value={`${device.battery}%`}
                color={theme.palette.success.main}
              />
            )}
          </Box>

          {history.length > 0 && (
            <Box mb={1} display="flex" gap={1}>
              <Box flex={1}>
                <MiniSparkline history={history} dataKey="temperature" />
              </Box>
              <Box flex={1}>
                <MiniSparkline history={history} dataKey="humidity" />
              </Box>
            </Box>
          )}

          <Collapse in={expanded} timeout={400}>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mt: 1 }}>
                    {historyLoading ? (
                      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                    ) : (
                      <TemperatureChart history={history} timeScale={timeScale} />
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapse>

          {device.last_updated && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              Updated {formatRelativeTime(device.last_updated)}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnimatedStat({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.15, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      <Chip
        icon={<>{icon}</>}
        label={value}
        size="small"
        sx={{
          bgcolor: `${color}18`,
          color,
          fontWeight: 700,
          fontSize: 13,
          border: `1px solid ${color}44`,
        }}
      />
    </motion.div>
  );
}
