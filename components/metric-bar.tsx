export function MetricBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div className="metric-bar metric-watch">
        <div className="metric-top">
          <span>{label}</span>
          <div className="metric-reading">
            <span><i aria-hidden />状态未知</span>
            <strong>—</strong>
          </div>
        </div>
        <div className="metric-track" aria-label={`${label} 状态未知`}>
          <span style={{ width: "0%" }} />
        </div>
      </div>
    );
  }

  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const level = normalized >= 80 ? "high" : normalized >= 60 ? "watch" : "normal";
  const status = normalized >= 80 ? "高负载" : normalized >= 60 ? "需关注" : "正常";

  return (
    <div className={`metric-bar metric-${level}`}>
      <div className="metric-top">
        <span>{label}</span>
        <div className="metric-reading">
          <span>
            <i aria-hidden />
            {status}
          </span>
          <strong>{normalized}%</strong>
        </div>
      </div>
      <div className="metric-track" aria-label={`${label} ${normalized}%`}>
        <span style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
