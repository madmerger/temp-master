import { motion } from 'framer-motion';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';

import type { MeterDevice, TimeScale } from '../../types/meter';
import { getDisplayName } from '../../constants/displayNames';
import AnimatedCounter from '../AnimatedCounter';
import TemperatureChart from '../Charts/TemperatureChart';

interface MeterCardProps {
  meter: MeterDevice;
  timeScale: TimeScale;
  index: number;
}

function tempColor(t: number): string {
  if (t <= 15) return '#2196f3';
  if (t <= 25) return '#4caf50';
  if (t <= 30) return '#ff9800';
  return '#f44336';
}

function tempGradient(t: number): string {
  const c = tempColor(t);
  return `linear-gradient(90deg, #2196f3, ${c})`;
}

export default function MeterCard({ meter, timeScale, index }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name);
  const temp = meter.current_temperature;
  const humidity = meter.current_humidity;
  const battery = meter.battery;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {temp != null && (
          <Box
            sx={{
              height: 4,
              borderRadius: '12px 12px 0 0',
              background: tempGradient(temp),
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {displayName}
            </Typography>
            <Chip
              label={meter.device_type}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {temp != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThermostatIcon fontSize="small" sx={{ color: tempColor(temp) }} />
                <AnimatedCounter
                  value={temp}
                  decimals={1}
                  suffix="°C"
                  variant="h5"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}
            {humidity != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WaterDropIcon fontSize="small" color="info" />
                <AnimatedCounter
                  value={humidity}
                  decimals={0}
                  suffix="%"
                  variant="h5"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}
            {battery != null && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  position: 'relative',
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={battery}
                    size={28}
                    thickness={5}
                    color={battery > 20 ? 'success' : 'error'}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BatteryFullIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {battery}%
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ height: 180 }}>
            <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />
          </Box>

          {meter.last_updated && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Last updated: {new Date(meter.last_updated).toLocaleString()}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
