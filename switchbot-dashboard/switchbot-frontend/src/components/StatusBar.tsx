interface Props { count: number; refreshedAt: Date | null }
export default function StatusBar({ count, refreshedAt }: Props) {
  const time = refreshedAt?.toLocaleTimeString([], { hour12: false });
  return <div className="mb-5 flex justify-between rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"><span>Monitoring {count} meter{count === 1 ? '' : 's'}</span>{time && <span>Last refresh: {time}</span>}</div>;
}
