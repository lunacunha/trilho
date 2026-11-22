"use client";
// US07-2: bar chart of reply rate per channel. Decorative for screen readers:
// the same data is in the accessible table next to it.
// Colours come from the theme tokens in app/globals.css and follow the Light/Dark toggle.
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useEffect, useRef, useState } from "react";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

type Props = { rows: { name: string; replyRate: number }[] };

/** Re-renders when the theme attribute on <html> changes. */
function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return version;
}

export function ChannelChart({ rows }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeVersion = useThemeVersion();

  useEffect(() => {
    if (!canvasRef.current) return;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const bar = token("--chart-bar");
    const grid = token("--chart-grid");
    const text = token("--chart-text");

    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: rows.map((r) => r.name),
        datasets: [
          {
            label: "Reply rate (%)",
            data: rows.map((r) => Math.round(r.replyRate * 100)),
            backgroundColor: bar,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: text,
        scales: {
          x: { ticks: { color: text }, grid: { display: false }, border: { color: grid } },
          y: {
            min: 0,
            max: 100,
            ticks: { color: text, callback: (v) => `${v}%` },
            grid: { color: grid },
            border: { color: grid },
          },
        },
        plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } } },
      },
    });
    return () => chart.destroy();
  }, [rows, themeVersion]);

  return (
    <div className="relative h-64 w-full" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
