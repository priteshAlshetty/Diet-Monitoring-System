import { useState } from "react";
import { insertMeal } from "../api_integration";
import MealSavedModal from "./MealSavedModal";
import "./MealForm.css";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];
const UNITS = ["g", "kg", "ml", "l", "piece", "cup", "tbsp", "tsp"];
const blankItem = () => ({ id: crypto.randomUUID(), name: "", quantity: "", unit: "g" });
const DEFAULT_ROWS = 3;
const blankItems = () => Array.from({ length: DEFAULT_ROWS }, blankItem);

export default function MealForm({ onSaved }) {
  const [mealType, setMealType] = useState("Breakfast");
  const [mealTypeOther, setMealTypeOther] = useState("");
  const [items, setItems] = useState(blankItems);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [saved, setSaved] = useState(null); // full response body from insertMeal; shown in the overlay

  const updateItem = (id, field, value) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  // The form starts with 3 rows; rows left completely empty are ignored on save.
  const filledItems = items.filter((i) => i.name.trim() || i.quantity !== "");

  const validate = () => {
    if (mealType === "Other" && !mealTypeOther.trim()) return "Describe the meal type.";
    if (filledItems.length === 0) return "Add at least one food item.";
    for (const i of filledItems) {
      if (!i.name.trim()) return "Every item needs a name.";
      if (!(Number(i.quantity) > 0)) return `Enter a quantity above 0 for "${i.name || "item"}".`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) return setStatus({ state: "error", message: problem });

    const payload = {
      meal_type: mealType,
      meal_type_other: mealType === "Other" ? mealTypeOther.trim() : "",
      mealData: filledItems.map(({ name, quantity, unit }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        unit,
      })),
    };

    setStatus({ state: "saving", message: "" });
    try {
      const res = await insertMeal(payload);
      setStatus({ state: "idle", message: "" });
      setItems(blankItems());
      setMealTypeOther("");
      setSaved(res ?? {}); // onSaved runs when the user closes the overlay
    } catch (e) {
      // A 401 is refreshed and retried by the API client.
      setStatus({ state: "error", message: e.message });
    }
  };

  const saving = status.state === "saving";

  const closeSaved = () => {
    const response = saved;
    setSaved(null);
    onSaved?.(response);
  };

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

      {saved && <MealSavedModal response={saved} onClose={closeSaved} />}
    </section>
  );
}
