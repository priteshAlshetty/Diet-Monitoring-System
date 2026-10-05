// STATUS: REAL. Calls your backend (bearer token is added automatically).
import { request } from "../api/client";

// POST /api/dms/insertMeal
// body: { user_id, meal_type, meal_type_other, mealData: [{ name, quantity, unit }] }
export async function insertMeal(payload) {
  return request("/api/dms/insertMeal", { method: "POST", body: payload });
}
