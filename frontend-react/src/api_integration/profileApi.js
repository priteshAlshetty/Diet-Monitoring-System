// STATUS: DUMMY DATA. Replace each body with the REAL line to integrate
// (and add: import { request } from "../api/client";).

// Dummy-only saved profile. Remove with the dummy data.
let saved = {
  sex: "male", age: 30, height_cm: 175, weight_kg: 80, activity: "moderate", goal: "lose",
  bmi: 26.1, target_weight_kg: 67.4, calories: 2211, protein_g: 153, carbs_g: 262, fats_g: 61,
};

// GET /api/dms/profile?user_id=1
// Return the saved profile. A 404 (or null) means no profile saved yet.
export async function getProfile(userId) {
  // REAL: return request(`/api/dms/profile?user_id=${userId}`);

  return { ...saved };
}

// POST /api/dms/saveProfile
// body: { user_id, sex, age, height_cm, weight_kg, activity, goal,
//         bmi, target_weight_kg, calories, protein_g, carbs_g, fats_g }
export async function saveProfile(payload) {
  // REAL: return request("/api/dms/saveProfile", { method: "POST", body: payload });

  saved = { ...saved, ...payload };
  return { success: true };
}
