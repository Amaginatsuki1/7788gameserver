export function MetricBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const level = value >= 80 ? "high" : value >= 60 ? "watch" : "normal";
  const status = value >= 80 ? "高负载" : value >= 60 ? "需关注" : "正常";

  return (
    <div className={`metric-bar metric-${level}`}>
      <div className="metric-top">
        <span>{label}</span>
        <div className="metric-reading">
          <span>
            <i aria-hidden />
            {status}
          </span>
          <strong>{value}%</strong>
        </div>
      </div>
      <div className="metric-track" aria-label={`${label} ${value}%`}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
