interface ErrorAlertProps {
  message: string
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div data-testid="error-alert" role="alert" className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
      <strong>Error.</strong> {message}
    </div>
  )
}
