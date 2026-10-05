// Offline demo data. Enabled with VITE_USE_MOCK=true. Delete once the real API exists.
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 250));

let meals = [
  { id: 1, meal_type: "Breakfast", time: "08:00", name: "Oats with Banana & Nuts", calories: 320, protein: 12, carbs: 48, fats: 10 },
  { id: 2, meal_type: "Lunch", time: "13:00", name: "Roti, Dal, Mixed Veg", calories: 450, protein: 18, carbs: 70, fats: 12 },
  { id: 3, meal_type: "Snack", time: "16:00", name: "Greek Yogurt with Berries", calories: 180, protein: 14, carbs: 20, fats: 3 },
  { id: 4, meal_type: "Dinner", time: "20:00", name: "Paneer Bhurji with Roti", calories: 290, protein: 18, carbs: 32, fats: 12 },
];

const sum = (k) => meals.reduce((s, m) => s + m[k], 0);

export const mockLogin = () =>
  wait({ success: true, message: "Login successful", token: "mock-token", user: { id: 1, username: "admin", role: "admin" } });

export const mockInsertMeal = () => wait({ ok: true });

export const mockDeleteMeal = (id) => {
  meals = meals.filter((m) => m.id !== id);
  return wait({ ok: true });
};

export const mockDashboard = (date) => {
  const base = new Date(`${date}T00:00:00`);
  const history = [1310, 1420, 1380, 1500, 1330, 1470, 1520];
  const trend = history.map((calories, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (6 - i));
    return { date: d.toLocaleDateString("en-CA"), calories: i === 6 ? sum("calories") || calories : calories };
  });
  return wait({
    date,
    goals: { calories: 1800, protein: 80, carbs: 200, fats: 60 },
    totals: { calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fats: sum("fats") },
    meals: [...meals],
    trend,
    weight: { current: 80.0, change30d: -2.5 },
  });
};

export const mockProteinMonth = (month) => {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  const today = new Date().toLocaleDateString("en-CA");
  const days = [];
  for (let d = 1; d <= count; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    if (date > today) break;
    days.push({ date, protein: Math.round(80 + 22 * Math.sin(d * 1.7) + 9 * Math.cos(d * 0.6)) });
  }
  return wait({ goal: 80, days });
};
