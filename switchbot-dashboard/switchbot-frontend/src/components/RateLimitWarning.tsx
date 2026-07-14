interface RateLimitWarningProps {
  backoffRemaining: number;
}

export function RateLimitWarning({ backoffRemaining }: RateLimitWarningProps) {
  return (
    <aside className="alert warning" role="status">
      <span className="alert-icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>Rate Limited</strong>
        <p>SwitchBot API rate limit reached. Retry in {backoffRemaining} seconds.</p>
      </div>
    </aside>
  );
}
