import type { ReactNode } from 'react';
import styles from './Alert.module.css';

export type AlertVariant = 'info' | 'warning' | 'danger';

interface AlertProps {
  variant: AlertVariant;
  id?: string;
  children: ReactNode;
}

// Bootstrap 3 の `.alert` 相当の通知枠
export default function Alert({ variant, id, children }: AlertProps) {
  return (
    <div id={id} role="alert" className={`${styles.alert} ${styles[variant]}`}>
      {children}
    </div>
  );
}
