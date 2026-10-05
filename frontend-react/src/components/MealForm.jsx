import { useState } from "react";
import { insertMeal } from "../api_integration";
import "./MealForm.css";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];
const UNITS = ["g", "kg", "ml", "l", "piece", "cup", "tbsp", "tsp"];
const blankItem = () => ({ id: crypto.randomUUID(), name: "", quantity: "", unit: "g" });

export default function MealForm({ userId, onSaved }) {
  const [mealType, setMealType] = useState("Breakfast");
  const [mealTypeOther, setMealTypeOther] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const updateItem = (id, field, value) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  const validate = () => {
    if (!userId) return "No user ID found. Sign in again.";
    if (mealType === "Other" && !mealTypeOther.trim()) return "Describe the meal type.";
    for (const i of items) {
      if (!i.name.trim()) return "Every item needs a name.";
      if (!(Number(i.quantity) > 0)) return `Enter a quantity above 0 for "${i.name || "item"}".`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) return setStatus({ state: "error", message: problem });

    const payload = {
      user_id: userId,
      meal_type: mealType,
      meal_type_other: mealType === "Other" ? mealTypeOther.trim() : "",
      mealData: items.map(({ name, quantity, unit }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        unit,
      })),
    };

    setStatus({ state: "saving", message: "" });
    try {
      const res = await insertMeal(payload);
      setStatus({ state: "success", message: "Meal saved." });
      setItems([blankItem()]);
      setMealTypeOther("");
      onSaved?.(res, payload);
    } catch (e) {
      // A 401 also triggers logout via the API client.
      setStatus({ state: "error", message: e.message });
    }
  };

  const saving = status.state === "saving";

  return (
    <section className="meal" aria-labelledby="meal-title">
      <h2 id="meal-title">Log a meal</h2>

      <div className="meal__types" role="radiogroup" aria-label="Meal type">
        {MEAL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={mealType === t}
            className={mealType === t ? "chip chip--on" : "chip"}
            onClick={() => setMealType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {mealType === "Other" && (
        <input
          className="field"
          placeholder="e.g. Pre-workout"
          aria-label="Other meal type"
          value={mealTypeOther}
          onChange={(e) => setMealTypeOther(e.target.value)}
        />
      )}

      <ul className="meal__items">
        {items.map((i) => (
          <li key={i.id} className="row">
            <input
              className="field row__name"
              placeholder="Food (e.g. quinoa)"
              aria-label="Food name"
              value={i.name}
              onChange={(e) => updateItem(i.id, "name", e.target.value)}
            />
            <input
              className="field row__qty"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="Qty"
              aria-label="Quantity"
              value={i.quantity}
              onChange={(e) => updateItem(i.id, "quantity", e.target.value)}
            />
            <select
              className="field row__unit"
              aria-label="Unit"
              value={i.unit}
              onChange={(e) => updateItem(i.id, "unit", e.target.value)}
            >
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <button
              type="button"
              className="row__remove"
              aria-label="Remove item"
              disabled={items.length === 1}
              onClick={() => removeItem(i.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="meal__actions">
        <button type="button" className="btn btn--ghost" onClick={addItem}>
          Add item
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : "Save meal"}
        </button>
      </div>

      <p className={`meal__status meal__status--${status.state}`} role="status" aria-live="polite">
        {status.message}
      </p>
    </section>
  );
}
