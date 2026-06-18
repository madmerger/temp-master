import { Alert, AlertTitle, Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { StatusResponse } from '../../types';

interface StatusBarProps {
  status: StatusResponse | undefined;
}

export default function StatusBar({ status }: StatusBarProps) {
  const theme = useTheme();

  if (!status) return null;

  return (
    <Box mb={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Monitoring{' '}
          <Typography component="span" fontWeight={700} color="text.primary">
            {status.meters_count}
          </Typography>{' '}
          meter{status.meters_count !== 1 ? 's' : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Collection every {status.collection_interval}s
        </Typography>
      </Box>

      <AnimatePresence>
        {status.is_rate_limited && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="warning" sx={{ mt: 1 }}>
              <AlertTitle>Rate Limited</AlertTitle>
              SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
