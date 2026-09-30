interface RateLimitWarningProps {
  backoffRemaining: number;
}

export default function RateLimitWarning({ backoffRemaining }: RateLimitWarningProps) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
    >
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {backoffRemaining || 0} seconds.
    </div>
  );
}
