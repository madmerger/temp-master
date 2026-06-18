import { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion } from 'framer-motion';
import { triggerRefresh } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshButtonProps {
  onRefreshComplete?: () => void;
}

export default function RefreshButton({ onRefreshComplete }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  });
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await triggerRefresh();
      await queryClient.invalidateQueries();
      setToast({ open: true, severity: 'success', message: 'Data refreshed successfully' });
      onRefreshComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed';
      setToast({ open: true, severity: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="contained"
          startIcon={
            <motion.div
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            >
              <RefreshIcon />
            </motion.div>
          }
          onClick={handleRefresh}
          disabled={loading}
          size="small"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </motion.div>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
