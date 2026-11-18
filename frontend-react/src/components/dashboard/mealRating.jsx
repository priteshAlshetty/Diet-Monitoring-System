// Rating rules for one meal, in grams of a macro per 100 kcal of that meal.
// Tuned for a weight-loss goal. Change the numbers here and the card updates.
//
//   protein: higher is better  (>= good, >= ok, >= warn, else bad)
//   carbs, fats: lower is better (<= good, <= ok, <= warn, else bad)
export const RULES = {
  protein: { dir: "min", good: 5, ok: 3, warn: 1 },      // 5 g/100 kcal = 20% of calories
  carbs: { dir: "max", good: 10, ok: 13, warn: 17 },     // 10 g = 40%, 13 g = 52%, 17 g = 68%
  fats: { dir: "max", good: 2.5, ok: 3.5, warn: 5 },     // 2.5 g = 22%, 3.5 g = 31%, 5 g = 45%
};

// Returns { level: "good" | "ok" | "warning" | "bad", per100 } or null when calories are 0.
export function ratePer100(key, grams, calories) {
  if (!(calories > 0)) return null;
  // Multiply first, then round to 1 decimal so the shown number and the level always agree.
  const per100 = Math.round(((Number(grams) || 0) * 100 / calories) * 10) / 10;
  const r = RULES[key];
  let level;
  if (r.dir === "min") {
    level = per100 >= r.good ? "good" : per100 >= r.ok ? "ok" : per100 >= r.warn ? "warning" : "bad";
  } else {
    level = per100 <= r.good ? "good" : per100 <= r.ok ? "ok" : per100 <= r.warn ? "warning" : "bad";
  }
  return { level, per100 };
}

export function describeRule(key) {
  const r = RULES[key];
  return r.dir === "min"
    ? `Good ≥ ${r.good} · OK ≥ ${r.ok} · Warning ≥ ${r.warn} · Bad < ${r.warn} (g per 100 kcal)`
    : `Good ≤ ${r.good} · OK ≤ ${r.ok} · Warning ≤ ${r.warn} · Bad > ${r.warn} (g per 100 kcal)`;
}

// A macro is "not healthy" when it is rated warning or bad.
//   0 not healthy -> healthy,  1 -> watch,  2 or more -> poor
export function judgeMeal(ratings) {
  const rated = ratings.filter(Boolean);
  if (rated.length === 0) return null;
  const off = rated.filter((r) => r.level === "warning" || r.level === "bad").length;
  return { verdict: off === 0 ? "healthy" : off === 1 ? "watch" : "poor", off, total: rated.length };
}