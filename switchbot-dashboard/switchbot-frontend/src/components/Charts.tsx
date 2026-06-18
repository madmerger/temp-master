import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { fetchHistory } from "../api/client";
import type { MeterReading, TimeScale } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

interface ChartsProps {
  deviceId: string;
  timeScale: TimeScale;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  switch (timeScale) {
    case "hour":
    case "day":
      return `${hours}:${minutes}`;
    case "week":
      return `${DAY_NAMES[date.getDay()]} ${hours}`;
    case "month":
    case "year":
      return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
    default:
      return date.toLocaleString();
  }
}

export default function Charts({ deviceId, timeScale }: ChartsProps) {
  const [history, setHistory] = useState<MeterReading[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((res) => {
        if (!cancelled) setHistory(res.history);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale]);

  const labels = history.map((r) => formatTimestamp(r.timestamp, timeScale));
  const temperatures = history.map((r) => r.temperature);

  const data = {
    labels,
    datasets: [
      {
        label: "Temperature (\u00b0C)",
        data: temperatures,
        borderColor: "#d9534f",
        backgroundColor: "rgba(217, 83, 79, 0.15)",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#d9534f",
        pointBorderColor: "#d9534f",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#5bc0de",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const v = ctx.parsed.y;
            return v != null ? `${v.toFixed(1)}\u00b0C` : "";
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: "#777" },
      },
      y: {
        display: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: 10 },
          color: "#777",
          callback: (value: string | number) => `${value}\u00b0`,
        },
      },
    },
  };

  return (
    <div className="meter-chart-wrap">
      <Line data={data} options={options} />
    </div>
  );
}
