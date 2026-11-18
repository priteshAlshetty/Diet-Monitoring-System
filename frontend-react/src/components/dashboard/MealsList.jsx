import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { mealImage } from "./mealImages";
import MealDetailsModal from "./MealDetailsModal";

const formatTime = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${suffix}`;
};

export default function MealsList({ meals, onDelete }) {
  // Keep only the id; if the meal is deleted and the list reloads, the modal closes by itself.
  const [selectedId, setSelectedId] = useState(null);
  const selected = meals.find((m) => m.id === selectedId) ?? null;

  return (
    <section className="card meals">
      <div className="card__head">
        <h2>Today's Meals</h2>
        <Link to="/log" className="btn-primary"><Plus size={16} /> Add Meal</Link>
      </div>

      {meals.length === 0 ? (
        <p className="empty">No meals logged for this day. Add your first meal to start tracking.</p>
      ) : (
        <ul className="meals__list">
          {meals.map((m) => (
            <li
              key={m.id}
              className="meal-row meal-row--clickable"
              tabIndex={0}
              role="button"
              aria-label={`View details of ${m.name}`}
              onClick={() => setSelectedId(m.id)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setSelectedId(m.id);
                }
              }}
            >
              <img src={mealImage(m.meal_type)} alt="" width="64" height="64" />
              <div className="meal-row__body">
                <div className="meal-row__meta">
                  <span className="meal-row__time">{formatTime(m.time)}</span>
                  <span className="meal-row__type">{m.meal_type}</span>
                </div>
                <strong>{m.name}</strong>
                <span className="meal-row__macros">
                  {m.calories} kcal | {m.protein} g P | {m.carbs} g C | {m.fats} g F
                </span>
              </div>
              <button className="icon-btn" disabled title="Editing is not available yet" aria-label={`Edit ${m.name}`}>
                <Pencil size={18} />
              </button>
              <button className="icon-btn icon-btn--danger" onClick={(e) => { e.stopPropagation(); onDelete(m); }} aria-label={`Delete ${m.name}`}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <MealDetailsModal
          meal={selected}
          timeLabel={formatTime(selected.time)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </section>
  );
}