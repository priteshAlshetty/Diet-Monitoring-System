import { useEffect, useState } from "react";
import { getProteinMonth } from "../../api_integration";

const W = 900, L = 44, R = 10;
const BLUE = "#3b82f6", BLUE_LIGHT = "#a9c8fb", UP = "#238a4f", DOWN = "#e4572e";

const thisMonth = () => new Date().toLocaleDateString("en-CA").slice(0, 7);
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const monthTitle = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export default function ProteinMonthChart({ userId }) {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    getProteinMonth({ userId, month })
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [userId, month]);

  return (
    <section className="card pm">
      <div className="card__head">
        <h2>Daily Protein Intake: {monthTitle(month)}</h2>
        <input
          className="pm__month" type="month" value={month} max={thisMonth()}
          onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Select month"
        />
      </div>

      {error && <p className="state state--error" role="alert">{error}</p>}
      {!data && !error && <p className="empty">Loading protein data…</p>}
      {data && <Charts month={month} goal={data.goal} days={data.days} />}
    </section>
  );
}

function Charts({ month, goal, days }) {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  const byDay = new Map(days.map((d) => [Number(d.date.slice(8, 10)), d.protein]));

  if (days.length === 0) return <p className="empty">No protein logged for this month.</p>;

  const slot = (W - L - R) / count;
  const cx = (d) => L + (d - 1) * slot + slot / 2;
  const bw = slot * 0.62;

  // summary
  const diffs = days.map((d) => d.protein - goal);
  const avg = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length);
  const avgDiff = Math.round(diffs.reduce((s, v) => s + v, 0) / diffs.length);
  const met = diffs.filter((v) => v >= 0).length;

  // intake chart scale
  const H1 = 230, T1 = 16, B1 = 26;
  const top = Math.ceil(Math.max(goal * 1.25, ...days.map((d) => d.protein)) / 20) * 20;
  const y1 = (v) => T1 + (1 - v / top) * (H1 - T1 - B1);
  const ticks = Array.from({ length: top / 20 + 1 }, (_, i) => i * 20).filter((t) => t % (top > 120 ? 40 : 20) === 0);

  // difference chart scale
  const H2 = 190, T2 = 14, B2 = 14;
  const span = Math.max(20, Math.ceil(Math.max(...diffs.map(Math.abs)) / 10) * 10);
  const y2 = (v) => T2 + (1 - (v + span) / (2 * span)) * (H2 - T2 - B2);

  return (
    <>
      <ul className="pm__summary">
        <li><span>Average per day</span><strong>{avg} g</strong></li>
        <li><span>Average vs goal</span><strong className={avgDiff >= 0 ? "pos" : "neg"}>{signed(avgDiff)} g</strong></li>
        <li><span>Days at or above goal</span><strong>{met} of {days.length}</strong></li>
      </ul>

      <div className="pm__scroll">
        <svg viewBox={`0 0 ${W} ${H1}`} role="img" aria-label={`Daily protein intake in ${monthTitle(month)} against a ${goal} g goal`}>
          {ticks.map((t) => (
            <g key={t}>
              <text x={L - 8} y={y1(t) + 4} textAnchor="end" fontSize="11" fill="#62736b">{t}</text>
              <line x1={L} x2={W - R} y1={y1(t)} y2={y1(t)} stroke="#eef1ef" />
            </g>
          ))}
          {Array.from({ length: count }, (_, i) => i + 1).map((d) => {
            const v = byDay.get(d);
            return (
              <g key={d}>
                {v != null && (
                  <rect x={cx(d) - bw / 2} y={y1(v)} width={bw} height={y1(0) - y1(v)} rx="2"
                        fill={v >= goal ? BLUE : BLUE_LIGHT}>
                    <title>{`Day ${d}: ${v} g (${signed(v - goal)} g vs goal)`}</title>
                  </rect>
                )}
                <text x={cx(d)} y={H1 - 8} textAnchor="middle" fontSize="10" fill="#62736b">{d}</text>
              </g>
            );
          })}
          <line x1={L} x2={W - R} y1={y1(goal)} y2={y1(goal)} stroke="#1b2a24" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={W - R} y={y1(goal) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="#1b2a24">
            Goal ({goal} g)
          </text>
        </svg>

        <p className="pm__sub">Difference from goal (g per day)</p>
        <svg viewBox={`0 0 ${W} ${H2}`} role="img" aria-label="Daily difference between protein intake and goal">
          <text x={L - 8} y={y2(span) + 4} textAnchor="end" fontSize="11" fill="#62736b">+{span}</text>
          <text x={L - 8} y={y2(0) + 4} textAnchor="end" fontSize="11" fill="#62736b">0</text>
          <text x={L - 8} y={y2(-span) + 4} textAnchor="end" fontSize="11" fill="#62736b">-{span}</text>
          {Array.from({ length: count }, (_, i) => i + 1).map((d) => {
            const v = byDay.get(d);
            if (v == null) return null;
            const diff = v - goal;
            const up = diff >= 0;
            const barTop = up ? y2(diff) : y2(0);
            const h = Math.max(1, Math.abs(y2(diff) - y2(0)));
            return (
              <g key={d}>
                <rect x={cx(d) - bw / 2} y={barTop} width={bw} height={h} rx="2" fill={up ? UP : DOWN}>
                  <title>{`Day ${d}: ${signed(diff)} g vs goal`}</title>
                </rect>
                <text x={cx(d)} y={up ? barTop - 4 : barTop + h + 11} textAnchor="middle" fontSize="9"
                      fill={up ? UP : DOWN} fontWeight="600">{signed(diff)}</text>
              </g>
            );
          })}
          <line x1={L} x2={W - R} y1={y2(0)} y2={y2(0)} stroke="#1b2a24" strokeWidth="1.5" />
        </svg>
      </div>
    </>
  );
}
