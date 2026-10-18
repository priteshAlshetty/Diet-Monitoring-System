// STATUS: getDashboardData is REAL (GET /api/dms/dailySummary).
// deleteMeal is not available yet: the backend has no delete endpoint.
import { request } from "../api/client";

const r1 = (n) => Math.round(Number(n || 0) * 10) / 10;

// Backend sends "08:45 PM"; MealsList expects "20:45".
function to24h(t) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t ?? "").trim());
  if (!m) return t ?? "";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

// Backend names (protein_g, fat_g) -> names the dashboard components use.
const macros = (x) => ({
  calories: r1(x.calories),
  protein: r1(x.protein_g),
  carbs: r1(x.carbs_g),
  fats: r1(x.fat_g),
});

// GET /api/dms/dailySummary?date=YYYY-MM-DD
// The user comes from the access cookie, so no user_id is sent.
export async function getDashboardData({ date }) {
  const res = await request(`/api/dms/dailySummary?date=${encodeURIComponent(date)}`);
  const d = res?.data;
  if (!d) throw new Error("Dashboard data was not returned.");

  return {
    date: d.date,
    goals: macros(d.goals),
    totals: macros(d.totals),
    meals: d.meals.map((m) => ({
      id: m.meal_id,
      meal_type: m.meal_type,
      name: m.meal_name,
      time: to24h(m.time),
      ...macros(m),
    })),
    // No `weight` here: the backend doesn't have weight data yet.
  };
}

// No backend endpoint yet. Throwing makes the dashboard show a message
// instead of pretending the meal was deleted.
export async function deleteMeal() {
  throw new Error("Deleting meals is not available yet.");
}