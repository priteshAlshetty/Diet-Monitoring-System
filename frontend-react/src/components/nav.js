import { BarChart3, Home, Settings, Target, TrendingUp, Utensils } from "lucide-react";

export const NAV = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/log", label: "Log Meal", icon: Utensils },
  { to: "/history", label: "History", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: TrendingUp },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings },
];
