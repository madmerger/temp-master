export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="alert alert-danger" role="alert">
      <strong>Error.</strong> <span>{message}</span>
    </div>
  )
}
