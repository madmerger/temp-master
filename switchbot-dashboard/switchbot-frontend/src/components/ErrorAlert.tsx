export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 rounded px-4 py-2 mb-4 text-sm">
      <strong>Error.</strong> {message}
    </div>
  );
}
