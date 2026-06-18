import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { TimeScale } from '../../types/meter';

const OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: 'Year' },
];

interface Props {
  value: TimeScale;
  onChange: (ts: TimeScale) => void;
}

export default function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => {
        if (v) onChange(v as TimeScale);
      }}
      size="small"
    >
      {OPTIONS.map((o) => (
        <ToggleButton key={o.value} value={o.value}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
