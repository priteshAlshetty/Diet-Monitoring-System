// STATUS: DUMMY DATA. To integrate, replace each function body with the REAL line
// shown in its comment (and add: import { request } from "../api/client";).
// Keep the returned JSON shape the same and no component needs to change.

// Dummy-only in-memory list so the delete button works in the demo. Remove with the dummy data.
let meals = [
  { id: 1, meal_type: "Breakfast", time: "08:00", name: "Oats with Banana & Nuts", calories: 320, protein: 12, carbs: 48, fats: 10 },
  { id: 2, meal_type: "Lunch", time: "13:00", name: "Roti, Dal, Mixed Veg", calories: 450, protein: 18, carbs: 70, fats: 12 },
  { id: 3, meal_type: "Snack", time: "16:00", name: "Greek Yogurt with Berries", calories: 180, protein: 14, carbs: 20, fats: 3 },
  { id: 4, meal_type: "Dinner", time: "20:00", name: "Paneer Bhurji with Roti", calories: 290, protein: 18, carbs: 32, fats: 12 },
];

// GET /api/dms/dashboard?user_id=1&date=2026-09-27
export async function getDashboardData({ userId, date }) {
  // REAL: return request(`/api/dms/dashboard?user_id=${userId}&date=${date}`);

  const sum = (key) => meals.reduce((total, m) => total + m[key], 0);
  const base = new Date(`${date}T00:00:00`);
  const trend = [1310, 1420, 1380, 1500, 1330, 1470, 1520].map((calories, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (6 - i));
    return { date: d.toLocaleDateString("en-CA"), calories };
  });

  return {
    date,
    goals: { calories: 1800, protein: 80, carbs: 200, fats: 60 },
    totals: { calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fats: sum("fats") },
    meals: [...meals],
    trend,
    weight: { current: 80.0, change30d: -2.5 },
  };
}

// DELETE /api/dms/meals/:id
export async function deleteMeal(id) {
  // REAL: return request(`/api/dms/meals/${id}`, { method: "DELETE" });

  meals = meals.filter((m) => m.id !== id);
  return { success: true };
}
