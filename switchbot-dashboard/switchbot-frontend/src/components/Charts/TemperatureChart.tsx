import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

interface TooltipPayloadEntry {
  payload: { timestamp: string; temperature: number; humidity: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ display: 'block' }}>
        {new Date(row.timestamp).toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {row.temperature.toFixed(1)}°C
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {row.humidity}%
      </Typography>
    </Box>
  );
}

interface Props {
  deviceId: string;
  timeScale: TimeScale;
}

export default function TemperatureChart({ deviceId, timeScale }: Props) {
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
          No data available
        </Typography>
      </Box>
    );
  }

  const chartData = history.map((r) => ({
    ...r,
    label: formatTimestamp(r.timestamp, timeScale),
  }));

  const accentColor = theme.palette.primary.main;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.palette.divider}
        />
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
          tickFormatter={(v: number) => `${v}°`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke={accentColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: accentColor }}
          fill={`url(#grad-${deviceId})`}
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
