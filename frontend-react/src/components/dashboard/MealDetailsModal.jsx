import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleCheck, CircleX, Flame, ShieldAlert, ShieldCheck, ShieldX, ThumbsUp, TriangleAlert, X,
} from "lucide-react";
import { getMealDetails } from "../../api_integration/dashboardApi";
import { mealImage } from "./mealImages";
import { NUTRIENTS, fmt } from "./nutrients";
import { describeRule, judgeMeal, ratePer100 } from "./mealRating"

import "./MealDetailsModal.css";

const MACROS = NUTRIENTS.filter((n) => n.key !== "calories");
const r1 = (n) => Math.round(n * 10) / 10;

const LEVELS = {
  good: { label: "Good", Icon: CircleCheck },
  ok: { label: "OK", Icon: ThumbsUp },
  warning: { label: "Warning", Icon: TriangleAlert },
  bad: { label: "Bad", Icon: CircleX },
};

const VERDICTS = {
  healthy: { title: "Healthy meal", Icon: ShieldCheck, note: (j) => `All ${j.total} macros on target` },
  watch: { title: "Needs attention", Icon: ShieldAlert, note: (j) => `${j.off} of ${j.total} macros off target` },
  poor: { title: "Poor diet choice", Icon: ShieldX, note: (j) => `${j.off} of ${j.total} macros off target` },
};

export default function MealDetailsModal({ meal, timeLabel, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [items, setItems] = useState(null);   // null = loading
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);  // bump to retry

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError("");
    getMealDetails(meal.id)
      .then((rows) => !cancelled && setItems(rows))
      .catch((e) => !cancelled && setError(e.message || "Could not load meal details."));
    return () => { cancelled = true; };
  }, [meal.id, attempt]);

  const fiberTotal = items ? r1(items.reduce((s, i) => s + i.fiber, 0)) : null;

  // Ratings are per 100 kcal of this meal (fiber is not rated).
  const ratings = Object.fromEntries(MACROS.map((m) => [m.key, ratePer100(m.key, meal[m.key], meal.calories)]));
  const judge = judgeMeal(Object.values(ratings));
  const verdict = judge ? VERDICTS[judge.verdict] : null;

  // Bar chart scale: the biggest item (protein + carbs + fats) fills the track.
  const maxTotal = items ? Math.max(0, ...items.map((i) => i.protein + i.carbs + i.fats)) : 0;

  return createPortal(
    <div className="mdm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="mdm__dialog"
        data-verdict={judge?.verdict ?? "none"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mdm-title"
      >
        <button ref={closeRef} type="button" className="mdm__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Overall judge, top-left corner */}
        {verdict && (
          <div className={`mdm__judge mdm__judge--${judge.verdict}`} title="Poor = two or more macros rated Warning or Bad">
            <verdict.Icon size={26} aria-hidden="true" />
            <div>
              <strong>{verdict.title}</strong>
              <small>{verdict.note(judge)}</small>
            </div>
          </div>
        )}

        <img className="mdm__img" src={mealImage(meal.meal_type)} alt="" width="64" height="64" />
        <span className="mdm__tag">{meal.meal_type}</span>
        <h2 id="mdm-title" className="mdm__title">{meal.name}</h2>
        <p className="mdm__sub">{timeLabel}{meal.id != null ? ` · Meal #${meal.id}` : ""}</p>

        <div className="mdm__cal">
          <Flame size={28} aria-hidden="true" />
          <strong>{fmt(meal.calories)}</strong>
          <span>kcal</span>
        </div>

        {/* KPI tiles */}
        <div className="mdm__kpis">
          {MACROS.map(({ key, label, color }) => {
            const rt = ratings[key];
            const lv = rt ? LEVELS[rt.level] : null;
            return (
              <div
                key={key}
                className={`kpi ${rt ? `kpi--${rt.level}` : "kpi--none"}`}
                title={`${label}: ${rt ? `${fmt(rt.per100)} g per 100 kcal` : "n/a"}\n${describeRule(key)}`}
              >
                <span className="kpi__name"><i style={{ background: color }} />{label}</span>
                <strong className="kpi__val">{fmt(meal[key])}<small> g</small></strong>
                {lv ? (
                  <span className="kpi__rate"><lv.Icon size={16} aria-hidden="true" />{lv.label}</span>
                ) : (
                  <span className="kpi__rate">–</span>
                )}
                <span className="kpi__per">{rt ? `${fmt(rt.per100)} g / 100 kcal` : "\u00a0"}</span>
              </div>
            );
          })}
          <div className="kpi kpi--none">
            <span className="kpi__name"><i style={{ background: "#16a34a" }} />Fiber</span>
            <strong className="kpi__val">
              {fiberTotal == null ? "…" : fmt(fiberTotal)}<small> g</small>
            </strong>
            <span className="kpi__rate kpi__rate--muted">Not rated</span>
            <span className="kpi__per">&nbsp;</span>
          </div>
        </div>
        <p className="mdm__note">Ratings use grams per 100 kcal, with limits set for weight loss.</p>

        {/* Items table */}
        <h3 className="mdm__h3">Items</h3>

        {items === null && !error && <p className="mdm__state" role="status">Loading items…</p>}

        {error && (
          <p className="mdm__state mdm__state--err" role="alert">
            {error}{" "}
            <button type="button" className="mdm__link" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </button>
          </p>
        )}

        {items && items.length === 0 && <p className="mdm__state">No item details for this meal.</p>}

        {items && items.length > 0 && (
          <>
            <div className="mdm__tablewrap">
              <table className="mdm__table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Quantity</th>
                    <th scope="col" className="num">Calories (kcal)</th>
                    <th scope="col" className="num">Protein (g)</th>
                    <th scope="col" className="num">Carbs (g)</th>
                    <th scope="col" className="num">Fats (g)</th>
                    <th scope="col" className="num">Fiber (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id ?? idx}>
                      <th scope="row">{it.name}</th>
                      <td>{it.quantity}</td>
                      <td className="num">{fmt(it.calories)}</td>
                      <td className="num">{fmt(it.protein)}</td>
                      <td className="num">{fmt(it.carbs)}</td>
                      <td className="num">{fmt(it.fats)}</td>
                      <td className="num">{fmt(it.fiber)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stacked horizontal bars: one bar per item, one segment per macro */}
            {maxTotal > 0 && (
              <>
                <div className="mdm__chart-head">
                  <h3 className="mdm__h3">Macros per item (g)</h3>
                  <ul className="mdm__legend">
                    {MACROS.map((m) => (
                      <li key={m.key}><i style={{ background: m.color }} />{m.label}</li>
                    ))}
                  </ul>
                </div>
                <ul className="mdm__bars">
                  {items.map((it, idx) => {
                    const total = it.protein + it.carbs + it.fats;
                    const desc = MACROS.map((m) => `${m.label} ${fmt(it[m.key])} g`).join(", ");
                    return (
                      <li key={it.id ?? idx} className="mdm__bar-row">
                        <span className="mdm__bar-name" title={it.name}>{it.name}</span>
                        <div className="mdm__bar-track" role="img" aria-label={`${it.name}: ${desc}`}>
                          {MACROS.map((m) => {
                            const g = it[m.key];
                            if (!(g > 0)) return null;
                            const w = (g / maxTotal) * 100;
                            return (
                              <span
                                key={m.key}
                                className={`mdm__seg mdm__seg--${m.key}`}
                                style={{ width: `${w}%`, background: m.color }}
                                title={`${m.label}: ${fmt(g)} g`}
                              >
                                {w >= 9 ? fmt(g) : ""}
                              </span>
                            );
                          })}
                        </div>
                        <span className="mdm__bar-total">{fmt(r1(total))} g</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}

        <button type="button" className="mdm__ok" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}