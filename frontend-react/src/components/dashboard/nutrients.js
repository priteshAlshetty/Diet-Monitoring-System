import { Droplet, Dumbbell, Flame, Wheat } from "lucide-react";

export const NUTRIENTS = [
  { key: "calories", label: "Calories", unit: "kcal", icon: Flame, tone: "green", color: "#2f9e5f" },
  { key: "protein", label: "Protein", unit: "g", icon: Dumbbell, tone: "blue", color: "#3b82f6" },
  { key: "carbs", label: "Carbs", unit: "g", icon: Wheat, tone: "orange", color: "#f5a21f" },
  { key: "fats", label: "Fats", unit: "g", icon: Droplet, tone: "purple", color: "#6d5ae6" },
];

export const pct = (value, goal) => (goal > 0 ? Math.round((value / goal) * 100) : 0);
export const fmt = (n) => Number(n).toLocaleString("en-US");
