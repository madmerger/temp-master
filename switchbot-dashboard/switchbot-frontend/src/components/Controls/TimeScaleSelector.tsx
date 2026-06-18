import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { motion } from 'framer-motion';
import type { TimeScale } from '../../types';

const scales: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: '1H' },
  { value: 'day', label: '24H' },
  { value: 'week', label: '7D' },
  { value: 'month', label: '30D' },
  { value: 'year', label: '1Y' },
];

interface TimeScaleSelectorProps {
  value: TimeScale;
  onChange: (scale: TimeScale) => void;
}

export default function TimeScaleSelector({ value, onChange }: TimeScaleSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue: TimeScale | null) => {
          if (newValue) onChange(newValue);
        }}
        size="small"
      >
        {scales.map((s) => (
          <ToggleButton key={s.value} value={s.value}>
            {s.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </motion.div>
  );
}
