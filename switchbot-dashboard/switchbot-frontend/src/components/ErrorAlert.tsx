import Alert from "react-bootstrap/Alert";

interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <Alert variant="danger">
      <strong>Error.</strong> {message}
    </Alert>
  );
}
