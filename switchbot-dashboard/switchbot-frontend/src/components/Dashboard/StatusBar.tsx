import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useStatus } from '../../hooks/useStatus';

export default function StatusBar() {
  const { data, isError } = useStatus();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (data?.is_rate_limited && data.backoff_remaining) {
      setCountdown(data.backoff_remaining);
      const id = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(id);
    }
    setCountdown(0);
  }, [data?.is_rate_limited, data?.backoff_remaining]);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.6, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isError ? '#f44336' : '#4caf50',
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {isError ? 'Disconnected' : 'Connected'}
        </Typography>

        {data && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
              ·
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitoring{' '}
              <motion.span
                key={data.meters_count}
                initial={{ scale: 1.4, color: '#00e5ff' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.4 }}
              >
                {data.meters_count}
              </motion.span>{' '}
              meter{data.meters_count === 1 ? '' : 's'}
            </Typography>
          </>
        )}
      </Box>

      {data?.is_rate_limited && (
        <Alert severity="warning" variant="outlined">
          SwitchBot API rate limit reached. Retry in {countdown} seconds.
        </Alert>
      )}
    </Box>
  );
}
