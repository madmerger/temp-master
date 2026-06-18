import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Charts from "./Charts";
import { DISPLAY_NAMES } from "../constants";
import type { MeterDevice, TimeScale } from "../types";

interface MeterCardProps {
  meter: MeterDevice;
  timeScale: TimeScale;
}

function getDisplayName(deviceName: string): string {
  return DISPLAY_NAMES[deviceName] ?? deviceName;
}

export default function MeterCard({ meter, timeScale }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <Card className="mb-3">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <strong>{displayName}</strong>
          <span className="device-type-tag">{meter.device_type}</span>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-2">
          {meter.current_temperature != null && (
            <Badge bg="danger" className="me-1 fs-6 fw-normal">
              {meter.current_temperature}&deg;C
            </Badge>
          )}
          {meter.current_humidity != null && (
            <Badge bg="info" className="me-1 fs-6 fw-normal">
              {meter.current_humidity}%
            </Badge>
          )}
          {meter.battery != null && (
            <Badge bg="success" className="fs-6 fw-normal">
              {meter.battery}%
            </Badge>
          )}
        </div>

        <Charts deviceId={meter.device_id} timeScale={timeScale} />

        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
