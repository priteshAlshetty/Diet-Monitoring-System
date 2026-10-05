import { useCallback, useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { deleteMeal, getDashboardData } from "../api_integration";
import StatCards from "../components/dashboard/StatCards";
import MealsList from "../components/dashboard/MealsList";
import MacroDonut from "../components/dashboard/MacroDonut";
import CalorieTrend from "../components/dashboard/CalorieTrend";
import { QuickActions, TodaysGoals, WeightCard } from "../components/dashboard/SideCards";
import ProteinMonthChart from "../components/dashboard/ProteinMonthChart";
import "../components/dashboard/dashboard.css";

const todayIso = () => new Date().toLocaleDateString("en-CA");
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
};

export default function DashboardPage() {
  const { userId, user } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getDashboardData({ userId, date }));
    } catch (e) {
      setError(e.message);
    }
  }, [userId, date]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (meal) => {
    if (!window.confirm(`Delete "${meal.name}"?`)) return;
    try {
      await deleteMeal(meal.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error && !data) return <p className="state state--error" role="alert">{error}</p>;
  if (!data) return <p className="state">Loading your dashboard…</p>;

  const rawName = (user?.name ?? user?.username ?? "").split(" ")[0];
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="dash">
      <div className="dash__main">
        <section className="card hello">
          <div>
            <h1>{greeting()}{firstName ? `, ${firstName}` : ""}.<br />Stay consistent!</h1>
            <p>Track your meals, monitor your macros and build healthier habits.</p>
          </div>
          <label className="hello__date">
            <Calendar size={18} />
            <input type="date" value={date} max={todayIso()}
                   onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Select date" />
          </label>
        </section>

        {error && <p className="state state--error" role="alert">{error}</p>}

        <StatCards totals={data.totals} goals={data.goals} />

        <div className="dash__pair">
          <MealsList meals={data.meals} onDelete={handleDelete} />
          <div className="dash__col">
            <MacroDonut totals={data.totals} />
            <CalorieTrend trend={data.trend} goal={data.goals.calories} />
          </div>
        </div>
      </div>

      <aside className="dash__side">
        <QuickActions />
        <TodaysGoals totals={data.totals} goals={data.goals} />
        <WeightCard weight={data.weight} />
      </aside>

      <div className="dash__wide">
        <ProteinMonthChart userId={userId} />
      </div>
    </div>
  );
}
