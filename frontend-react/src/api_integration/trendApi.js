// STATUS: REAL. Calls your backend (the access_token cookie is sent automatically).
import { request } from "../api/client";

// GET /api/dms/dailyMacros?days=N   (user comes from the access cookie, never from the URL)
// 200 -> { success, days, data: [{ date: "YYYY-MM-DD", meals, calories, protein_gm,
//          carbs_gm, fat_gm, fiber_gm }, ...] }   oldest first, ending today (IST),
//          with zeros for days that have no meals.
// 400 -> days must be a whole number between 1 and 366.
export async function getDailyMacros({ days }) {
  const res = await request(`/api/dms/dailyMacros?days=${encodeURIComponent(days)}`);
  const rows = res?.data ?? [];
  console.dir({ requestedDays: days, receivedRows: rows.length, response: res }); // debug
  return rows;
}
