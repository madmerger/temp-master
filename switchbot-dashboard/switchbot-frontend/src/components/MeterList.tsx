import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import MeterCard from "./MeterCard";
import type { MeterDevice, TimeScale } from "../types";

interface MeterListProps {
  meters: MeterDevice[];
  timeScale: TimeScale;
}

export default function MeterList({ meters, timeScale }: MeterListProps) {
  return (
    <Row>
      {meters.map((meter) => (
        <Col md={4} sm={6} key={meter.device_id}>
          <MeterCard meter={meter} timeScale={timeScale} />
        </Col>
      ))}
    </Row>
  );
}
