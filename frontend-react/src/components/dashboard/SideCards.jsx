import { ArrowDown, ArrowUp, BarChart3, CalendarDays, ChevronRight, FileSpreadsheet, Pencil, TrendingUp, User, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { NUTRIENTS, fmt, pct } from "./nutrients";

const ACTIONS = [
  { to: "/log", icon: Utensils, tone: "green", title: "Log a Meal", sub: "Add your food and track nutrition" },
  { to: "/upload", icon: FileSpreadsheet, tone: "blue", title: "Upload Meal Data", sub: "Import from Excel or CSV" },
  { to: "/history", icon: CalendarDays, tone: "red", title: "View History", sub: "Check past meals and macros" },
  { to: "/reports", icon: BarChart3, tone: "purple", title: "View Reports", sub: "Analyze trends and progress" },
  { to: "/profile", icon: User, tone: "orange", title: "My Profile & Target", sub: "Set weight, height and diet goal" },
];

export function QuickActions() {
  return (
    <section className="card">
      <div className="card__head"><h2>Quick Actions</h2></div>
      <ul className="actions">
        {ACTIONS.map(({ to, icon: Icon, tone, title, sub }) => (
          <li key={to}>
            <Link to={to} className={`action action--${tone}`}>
              <Icon size={26} />
              <span><strong>{title}</strong><small>{sub}</small></span>
              <ChevronRight size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TodaysGoals({ totals, goals }) {
  return (
    <section className="card">
      <div className="card__head">
        <h2>Today's Goals</h2>
        <Link to="/goals" className="btn-outline"><Pencil size={14} /> Edit</Link>
      </div>
      <ul className="goals">
        {NUTRIENTS.map(({ key, label, unit, icon: Icon, tone }) => (
          <li key={key}>
            <span className={`goals__icon goals__icon--${tone}`}><Icon size={16} /></span>
            <span className="goals__label">{label}</span>
            <span className="goals__value">{fmt(totals[key])} / {fmt(goals[key])} {unit}</span>
            <span className="goals__pct">{pct(totals[key], goals[key])}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WeightCard({ weight }) {
  const down = weight.change30d <= 0;
  const Arrow = down ? ArrowDown : ArrowUp;
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="with-icon"><TrendingUp size={20} /> Weight Tracking</h2>
        <Link to="/history" className="link-small">View History</Link>
      </div>
      <p className="weight__label">Current Weight</p>
      <p className="weight__value">{weight.current.toFixed(1)} kg</p>
      <p className="weight__delta">
        <span className={down ? "delta delta--down" : "delta delta--up"}><Arrow size={14} /></span>
        <b>{weight.change30d > 0 ? "+" : ""}{weight.change30d} kg</b> (last 30 days)
      </p>
    </section>
  );
}
