import styles from './RateLimitWarning.module.css'

interface RateLimitWarningProps {
  remaining: number
}

export function RateLimitWarning({ remaining }: RateLimitWarningProps) {
  return (
    <div className={styles.alert} role="status">
      <strong>Rate Limited.</strong>{' '}
      <span>
        SwitchBot API rate limit reached. Retry in {remaining} seconds.
      </span>
    </div>
  )
}
