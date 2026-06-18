import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { useHistory } from '../../hooks/useHistory';
import type { TimeScale } from '../../types/meter';

function formatTimestamp(ts: string, scale: TimeScale): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const dayNum = d.getDate();

  switch (scale) {
    case 'hour':
    case 'day':
      return `${hh}:${mm}`;
    case 'week':
      return `${day} ${hh}`;
    case 'month':
    case 'year':
      return `${mon} ${dayNum}`;
    default:
      return d.toLocaleString();
  }
}

interface Props {
  deviceId: string;
  timeScale: TimeScale;
}

export default function HumidityChart({ deviceId, timeScale }: Props) {
  const { data, isLoading } = useHistory(deviceId, timeScale);
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="caption" color="text.secondary">
          Loading chart...
        </Typography>
      </Box>
    );
  }

  const history = data?.history ?? [];
  if (!history.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="caption" color="text.secondary">
          No data
        </Typography>
      </Box>
    );
  }

  const chartData = history.map((r) => ({
    ...r,
    label: formatTimestamp(r.timestamp, timeScale),
  }));

  const color = theme.palette.info.main;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={`hum-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={36}
          domain={[0, 100]}
        />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="humidity"
          stroke={color}
          strokeWidth={2}
          fill={`url(#hum-${deviceId})`}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
