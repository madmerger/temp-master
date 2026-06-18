import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { motion } from 'framer-motion';
import { getBackupUrl } from '../../api/client';

export default function BackupButton() {
  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => window.open(getBackupUrl(), '_blank')}
        size="small"
      >
        Backup
      </Button>
    </motion.div>
  );
}
