import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'success' | 'danger' | 'info' | 'warning';

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
  children: ReactNode;
}

// Bootstrap 3 の `.label` 相当のバッジ
export default function Badge({ variant, className, children }: BadgeProps) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(' ');
  return (
    <span className={classes} data-variant={variant}>
      {children}
    </span>
  );
}
