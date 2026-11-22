"use client";
// US07-2: bar chart of reply rate per channel. Decorative for screen readers:
// the same data is in the accessible table next to it.
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useEffect, useRef } from "react";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

type Props = { rows: { name: string; replyRate: number }[] };

export function ChannelChart({ rows }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: rows.map((r) => r.name),
        datasets: [
          {
            label: "Reply rate (%)",
            data: rows.map((r) => Math.round(r.replyRate * 100)),
            backgroundColor: "#2563eb",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
        plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } } },
      },
    });
    return () => chart.destroy();
  }, [rows]);

  return (
    <div className="relative h-64 w-full" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
