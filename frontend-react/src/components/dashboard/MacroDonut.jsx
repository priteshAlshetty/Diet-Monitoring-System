import { NUTRIENTS } from "./nutrients";

const MACROS = NUTRIENTS.filter((n) => n.key !== "calories");
const KCAL_PER_G = { protein: 4, carbs: 4, fats: 9 };
const R = 70, C = 2 * Math.PI * R;

export default function MacroDonut({ totals }) {
  // Share of calories contributed by each macro.
  const kcal = MACROS.map((m) => ({ ...m, grams: totals[m.key], kcal: totals[m.key] * KCAL_PER_G[m.key] }));
  const total = kcal.reduce((s, m) => s + m.kcal, 0);
  let offset = 0;

  return (
    <section className="card donut">
      <div className="card__head"><h2>Macro Breakdown</h2></div>
      <div className="donut__body">
        <svg viewBox="0 0 200 200" width="190" height="190" role="img"
             aria-label="Share of calories from protein, carbs and fats">
          <g transform="rotate(-90 100 100)">
            <circle cx="100" cy="100" r={R} fill="none" stroke="#eef1ef" strokeWidth="30" />
            {total > 0 && kcal.map((m) => {
              const len = (m.kcal / total) * C;
              const el = (
                <circle key={m.key} cx="100" cy="100" r={R} fill="none" stroke={m.color}
                        strokeWidth="30" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
              );
              offset += len;
              return el;
            })}
          </g>
          <text x="100" y="98" textAnchor="middle" fontSize="26" fontWeight="600" fill="currentColor">
            {totals.calories.toLocaleString("en-US")}
          </text>
          <text x="100" y="120" textAnchor="middle" fontSize="15" fill="#62736b">kcal</text>
        </svg>

        <ul className="donut__legend">
          {kcal.map((m) => (
            <li key={m.key}>
              <i style={{ background: m.color }} />
              <span>{m.label}</span>
              <b>{m.grams} g ({total ? Math.round((m.kcal / total) * 100) : 0}%)</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
