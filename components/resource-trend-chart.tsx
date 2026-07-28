"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

type ResourceTrendChartProps = {
  label: string;
  data: number[] | null;
  color: string;
  period?: string;
};

function getHealth(value: number) {
  if (value >= 80) {
    return { key: "high", label: "高负载", color: "#dc747c" };
  }

  if (value >= 60) {
    return { key: "watch", label: "需关注", color: "#d4aa62" };
  }

  return { key: "normal", label: "运行正常", color: "#62c6a5" };
}

function drawSmoothLine(
  context: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
) {
  if (points.length < 2) return;

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpointX = (current.x + next.x) / 2;
    const midpointY = (current.y + next.y) / 2;
    context.quadraticCurveTo(current.x, current.y, midpointX, midpointY);
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  context.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
}

export function ResourceTrendChart({
  label,
  data,
  color,
  period = "过去 24 小时",
}: ResourceTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasData = Boolean(data?.length);
  const current = data?.at(-1) ?? null;
  const peak = data?.length ? Math.max(...data) : null;
  const average = data?.length
    ? Math.round(data.reduce((total, value) => total + value, 0) / data.length)
    : null;
  const health =
    current === null
      ? { key: "unknown", label: "数据暂不可用", color: "#d4aa62" }
      : getHealth(current);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);

      const context = canvas.getContext("2d");
      if (!context) return;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      if (!data?.length) return;

      const insetX = 8;
      const insetY = 12;
      const chartWidth = Math.max(bounds.width - insetX * 2, 1);
      const chartHeight = Math.max(bounds.height - insetY * 2, 1);
      const plotData = data.length === 1 ? [data[0], data[0]] : data;
      const points = plotData.map((value, index) => ({
        x:
          insetX +
          (index / Math.max(plotData.length - 1, 1)) *
            chartWidth,
        y: insetY + (1 - value / 100) * chartHeight,
      }));

      drawSmoothLine(context, points);
      context.lineTo(points.at(-1)?.x ?? insetX, bounds.height - insetY);
      context.lineTo(points[0]?.x ?? insetX, bounds.height - insetY);
      context.closePath();

      const fill = context.createLinearGradient(0, insetY, 0, bounds.height);
      fill.addColorStop(0, `${color}38`);
      fill.addColorStop(1, `${color}00`);
      context.fillStyle = fill;
      context.fill();

      drawSmoothLine(context, points);
      context.strokeStyle = color;
      context.lineWidth = 2.5;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.stroke();

      const lastPoint = points.at(-1);
      if (lastPoint) {
        context.beginPath();
        context.arc(lastPoint.x, lastPoint.y, 4.5, 0, Math.PI * 2);
        context.fillStyle = health.color;
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#1e1e2a";
        context.stroke();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [color, data, health.color]);

  return (
    <article
      className={`resource-chart-card resource-state-${health.key}`}
      style={
        {
          "--series-color": color,
          "--health-color": health.color,
        } as CSSProperties
      }
    >
      <div className="resource-chart-head">
        <div>
          <span className="resource-series-label">
            <i aria-hidden />
            {label}
          </span>
          <p>{period}</p>
        </div>
        <div className="resource-current">
          <strong>{current === null ? "—" : `${current}%`}</strong>
          <span>
            <i aria-hidden />
            {health.label}
          </span>
        </div>
      </div>

      <div
        className="resource-plot"
        role="img"
        aria-label={
          hasData
            ? `${label} ${period}趋势，当前 ${current}%，平均 ${average}%，峰值 ${peak}%，${health.label}`
            : `${label} ${period}趋势暂不可用`
        }
      >
        <div className="resource-axis" aria-hidden>
          <span>100</span>
          <span>80</span>
          <span>60</span>
          <span>0</span>
        </div>
        <div className="resource-canvas-wrap">
          <span className="resource-threshold threshold-high" aria-hidden />
          <span className="resource-threshold threshold-watch" aria-hidden />
          <canvas ref={canvasRef} aria-hidden />
          {!hasData && (
            <span className="resource-chart-empty">等待有效采样</span>
          )}
        </div>
      </div>

      <div className="resource-chart-meta">
        <span>
          平均 <strong>{average === null ? "—" : `${average}%`}</strong>
        </span>
        <span>
          峰值 <strong>{peak === null ? "—" : `${peak}%`}</strong>
        </span>
        <span>24 小时前 → 现在</span>
      </div>
    </article>
  );
}
