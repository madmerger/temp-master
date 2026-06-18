import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}
    >
      <Typography variant="caption">
        Temp Master Dashboard v2.0 — React + MUI + Recharts
      </Typography>
    </Box>
  );
}
