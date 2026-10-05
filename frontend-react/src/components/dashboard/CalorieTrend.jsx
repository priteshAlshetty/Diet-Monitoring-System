const W = 520, H = 210, L = 44, R = 8, T = 18, B = 28;

const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export default function CalorieTrend({ trend, goal }) {
  const max = Math.max(2000, goal * 1.1, ...trend.map((t) => t.calories));
  const ceil = Math.ceil(max / 500) * 500;
  const ticks = Array.from({ length: ceil / 500 + 1 }, (_, i) => i * 500);
  const y = (v) => T + (1 - v / ceil) * (H - T - B);
  const slot = (W - L - R) / trend.length;

  return (
    <section className="card trend">
      <div className="card__head"><h2>Calorie Trend (Last 7 Days)</h2></div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily calories for the last 7 days against your goal">
        {ticks.map((t) => (
          <g key={t}>
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#62736b">{t.toLocaleString("en-US")}</text>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#eef1ef" />
          </g>
        ))}
        {trend.map((d, i) => (
          <g key={d.date}>
            <rect x={L + i * slot + slot * 0.18} y={y(d.calories)} width={slot * 0.64}
                  height={y(0) - y(d.calories)} rx="2" fill="#7cc79a" />
            <text x={L + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#62736b">
              {dayLabel(d.date)}
            </text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(goal)} y2={y(goal)} stroke="#62736b" strokeDasharray="5 4" />
        <text x={W - R} y={y(goal) - 5} textAnchor="end" fontSize="11" fill="#62736b">
          Goal ({goal.toLocaleString("en-US")})
        </text>
      </svg>
    </section>
  );
}
