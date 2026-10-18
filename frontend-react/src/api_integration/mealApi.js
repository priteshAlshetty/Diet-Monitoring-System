// STATUS: REAL. Calls your backend (the access_token cookie is sent automatically).
import { request } from "../api/client";

// POST /api/dms/insertMeal
// body: { meal_type, meal_type_other, mealData: [{ name, quantity, unit }] }
// Do NOT send user_id: the server takes the user from the access cookie and ignores it.
//
// 201 -> { success, message, data: { meal_id, user_id, meal_type, meal_name,
//          total_calories, total_protein_gm, total_carbs_gm, total_fat_gm, total_fiber_gm } }
// 400 { success:false, message } missing meal_type / mealData
// 401 not logged in or token expired (the client refreshes and retries automatically)
// 500 database or server error, 502 nutrition macro service failed
export async function insertMeal({ meal_type, meal_type_other, mealData }) {
  let res;
  try {
    res = await request("/api/dms/insertMeal", {
      method: "POST",
      body: { meal_type, meal_type_other, mealData },
    });
  } catch (e) {
    console.dir(e); // failed response: e.status, e.code, e.message
    throw e;
  }
  console.dir(res); // full response body: { success, message, data: { ... } }
  if (res?.success === false) throw new Error(res.message || "Could not save the meal.");
  return res;
}
