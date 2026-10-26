interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div id="error" role="alert" className="mb-5 rounded border border-alert-danger-border bg-alert-danger-bg px-4 py-3 text-sm text-alert-danger-text">
      <strong>Error.</strong> {message}
    </div>
  )
}
