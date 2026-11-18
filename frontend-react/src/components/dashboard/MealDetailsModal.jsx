import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Flame, X } from "lucide-react";
import { getMealDetails } from "../../api_integration/dashboardApi";
import { mealImage } from "./mealImages";
import { NUTRIENTS, fmt } from "./nutrients";
import "./MealDetailsModal.css";

const MACROS = NUTRIENTS.filter((n) => n.key !== "calories");
const r1 = (n) => Math.round(n * 10) / 10;

export default function MealDetailsModal({ meal, timeLabel, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [items, setItems] = useState(null);   // null = loading
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);  // bump to retry

  // Modal chrome: focus, Esc to close, lock page scroll.
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

  // Fetch the item-wise details for this meal.
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

  return createPortal(
    <div className="mdm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mdm__dialog" role="dialog" aria-modal="true" aria-labelledby="mdm-title">
        <button ref={closeRef} type="button" className="mdm__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Summary: available immediately from the list data */}
        <img className="mdm__img" src={mealImage(meal.meal_type)} alt="" width="64" height="64" />
        <span className="mdm__tag">{meal.meal_type}</span>
        <h2 id="mdm-title" className="mdm__title">{meal.name}</h2>
        <p className="mdm__sub">{timeLabel}{meal.id != null ? ` · Meal #${meal.id}` : ""}</p>

        <div className="mdm__cal">
          <Flame size={22} aria-hidden="true" />
          <strong>{fmt(meal.calories)}</strong>
          <span>kcal</span>
        </div>

        <div className="mdm__totals">
          {MACROS.map(({ key, label, color }) => (
            <div key={key} className="mdm__total">
              <i style={{ background: color }} />
              <strong>{fmt(meal[key])} g</strong>
              <span>{label}</span>
            </div>
          ))}
          <div className="mdm__total">
            <i style={{ background: "#16a34a" }} />
            <strong>{fiberTotal == null ? "…" : `${fmt(fiberTotal)} g`}</strong>
            <span>Fiber</span>
          </div>
        </div>

        {/* Items: loaded from GET /api/dms/meal/:id */}
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
          <ul className="mdm__items">
            {items.map((it, idx) => (
              <li key={it.id ?? idx} className="mdm__item">
                <div className="mdm__item-head">
                  <strong>{it.name}</strong>
                  <span className="mdm__qty">{it.quantity}</span>
                </div>
                <div className="mdm__chips">
                  <span className="chip chip--cal">{fmt(it.calories)} kcal</span>
                  <span className="chip">P {fmt(it.protein)} g</span>
                  <span className="chip">C {fmt(it.carbs)} g</span>
                  <span className="chip">F {fmt(it.fats)} g</span>
                  <span className="chip">Fiber {fmt(it.fiber)} g</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="mdm__ok" onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}