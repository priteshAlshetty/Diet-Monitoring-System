import { NUTRIENTS, fmt, pct } from "./nutrients";

export default function StatCards({ totals, goals }) {
  return (
    <section className="stats" aria-label="Today's totals">
      {NUTRIENTS.map(({ key, label, unit, icon: Icon, tone }) => {
        const p = pct(totals[key], goals[key]);
        return (
          <div key={key} className={`stat stat--${tone}`}>
            <div className="stat__top">
              <span className="stat__icon"><Icon size={22} /></span>
              <div>
                <div className="stat__label">{label}</div>
                <div className="stat__value">
                  <strong>{fmt(totals[key])}</strong>
                  <span> / {fmt(goals[key])} {unit}</span>
                </div>
              </div>
            </div>
            <div className="stat__bar">
              <div className="stat__track"><div style={{ width: `${Math.min(100, p)}%` }} /></div>
              <span>{p}%</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
