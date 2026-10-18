import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Droplet, Dumbbell, Flame, Leaf, Wheat } from "lucide-react";
import "./MealSavedModal.css";

const MACROS = [
  { key: "total_protein_gm", label: "Protein", icon: Dumbbell, tone: "blue" },
  { key: "total_carbs_gm", label: "Carbs", icon: Wheat, tone: "orange" },
  { key: "total_fat_gm", label: "Fat", icon: Droplet, tone: "purple" },
  { key: "total_fiber_gm", label: "Fiber", icon: Leaf, tone: "green" },
];

const num = (v) =>
  v == null || v === "" || Number.isNaN(Number(v))
    ? "-"
    : (Math.round(Number(v) * 10) / 10).toLocaleString("en-US");

// Overlay shown after a meal is saved. `response` is the body returned by
// POST /api/dms/insertMeal: { success, message, data: { meal_id, user_id, meal_type, meal_name,
// total_calories, total_protein_gm, total_carbs_gm, total_fat_gm, total_fiber_gm } }.
// Closing (OK, Esc or a click on the dim background) calls onClose.
export default function MealSavedModal({ response, onClose }) {
  const data = response?.data ?? {};
  const okRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // always call the latest handler without re-running the effect

  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // stop the page scrolling behind the overlay
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(
    <div className="msm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="msm__dialog" role="dialog" aria-modal="true" aria-labelledby="msm-title">
        <span className="msm__check" aria-hidden="true"><Check size={30} strokeWidth={3} /></span>
        <h2 id="msm-title" className="msm__title">Meal logged!</h2>
        <p className="msm__sub">{response?.message ?? "Here is what we calculated for your meal."}</p>

        <div className="msm__meal">
          {data.meal_type && <span className="msm__tag">{data.meal_type}</span>}
          <strong className="msm__name">{data.meal_name ?? "Your meal"}</strong>
          {data.meal_id != null && <span className="msm__id">Meal #{data.meal_id}</span>}
        </div>

        <div className="msm__calories">
          <Flame size={22} aria-hidden="true" />
          <strong>{num(data.total_calories)}</strong>
          <span>kcal</span>
        </div>

        <ul className="msm__macros">
          {MACROS.map(({ key, label, icon: Icon, tone }) => (
            <li key={key} className={`msm__macro msm__macro--${tone}`}>
              <span className="msm__macro-icon"><Icon size={16} aria-hidden="true" /></span>
              <span className="msm__macro-label">{label}</span>
              <strong>{num(data[key])} g</strong>
            </li>
          ))}
        </ul>

        <button ref={okRef} type="button" className="msm__ok" onClick={onClose}>OK</button>
      </div>
    </div>,
    document.body
  );
}
