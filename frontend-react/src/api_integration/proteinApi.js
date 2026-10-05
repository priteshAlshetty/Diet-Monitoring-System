// STATUS: DUMMY DATA. Replace the body with the REAL line to integrate
// (and add: import { request } from "../api/client";).

// Protein (g) for day 1..31 of any month. Dummy only.
const DAILY_PROTEIN_G = [109, 78, 58, 84, 89, 57, 62, 100, 94, 67, 85, 107, 78, 54, 80, 90, 61, 62, 101, 99, 69, 81, 105, 79, 51, 76, 93, 66, 63, 101, 103];

// GET /api/dms/proteinMonth?user_id=1&month=2026-09
// Days with no logged meals should simply be left out of "days".
export async function getProteinMonth({ userId, month }) {
  // REAL: return request(`/api/dms/proteinMonth?user_id=${userId}&month=${month}`);

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = new Date().toLocaleDateString("en-CA");

  const days = DAILY_PROTEIN_G.slice(0, daysInMonth)
    .map((protein, i) => ({ date: `${month}-${String(i + 1).padStart(2, "0")}`, protein }))
    .filter((d) => d.date <= today);

  return { goal: 80, days };
}
