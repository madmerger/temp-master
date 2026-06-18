import Grid from '@mui/material/Grid';
import type { MeterDevice, TimeScale } from '../../types/meter';
import MeterCard from './MeterCard';

interface Props {
  meters: MeterDevice[];
  timeScale: TimeScale;
}

export default function MeterGrid({ meters, timeScale }: Props) {
  return (
    <Grid container spacing={3}>
      {meters.map((meter, i) => (
        <Grid key={meter.device_id} size={{ xs: 12, sm: 6, md: 4 }}>
          <MeterCard meter={meter} timeScale={timeScale} index={i} />
        </Grid>
      ))}
    </Grid>
  );
}
