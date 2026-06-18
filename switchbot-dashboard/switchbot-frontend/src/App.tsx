import { useState } from "react";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useMeterData } from "./hooks/useMeterData";
import { getBackupUrl } from "./api/client";
import StatusBar from "./components/StatusBar";
import MeterList from "./components/MeterList";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorAlert from "./components/ErrorAlert";
import type { TimeScale } from "./types";

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: "hour", label: "Last Hour" },
  { value: "day", label: "Last 24 Hours" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
];

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const { meters, status, loading, error, refreshing, handleRefresh } =
    useMeterData();

  const connected = !error;

  return (
    <>
      <Navbar bg="light" fixed="top" className="border-bottom">
        <Container fluid>
          <Navbar.Brand>Temp Master Dashboard</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/" active>
              Dashboard
            </Nav.Link>
          </Nav>
          <Badge bg={connected ? "success" : "danger"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </Container>
      </Navbar>

      <Container fluid>
        <Card className="mb-3">
          <Card.Body>
            <Form className="d-flex align-items-center gap-3 flex-wrap">
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0">Time Range:</Form.Label>
                <Form.Select
                  value={timeScale}
                  onChange={(e) =>
                    setTimeScale(e.target.value as TimeScale)
                  }
                  style={{ width: "auto" }}
                >
                  {TIME_SCALE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button
                variant="primary"
                disabled={refreshing}
                onClick={() => void handleRefresh()}
              >
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => window.open(getBackupUrl(), "_blank")}
              >
                Download Backup
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <StatusBar status={status} connected={connected} />

        {loading && <LoadingSpinner />}
        {error && <ErrorAlert message={error} />}
        {!loading && meters.length > 0 && (
          <MeterList meters={meters} timeScale={timeScale} />
        )}

        <footer>
          Temp Master Dashboard v2.0 &ndash; Built with React + TypeScript +
          Vite
        </footer>
      </Container>
    </>
  );
}
