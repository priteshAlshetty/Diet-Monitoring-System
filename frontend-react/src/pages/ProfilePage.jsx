import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, saveProfile } from "../api_integration";
import { useAuth } from "../auth/AuthContext";
import { ACTIVITY, buildPlan } from "../utils/dietMath";
import MacroDonut from "../components/dashboard/MacroDonut";
import "./ProfilePage.css";

const EMPTY = { sex: "male", age: "", height: "", weight: "", activity: "light", goal: "lose" };
const LIMITS = {
  age: [18, 90, "Age must be between 18 and 90."],
  height: [120, 230, "Height must be between 120 and 230 cm."],
  weight: [30, 300, "Weight must be between 30 and 300 kg."],
};

function validate(f) {
  for (const [k, [min, max, msg]] of Object.entries(LIMITS)) {
    const v = Number(f[k]);
    if (f[k] === "" ) return { field: k, msg: null };      // incomplete, no message yet
    if (!(v >= min && v <= max)) return { field: k, msg: msg };
  }
  return null;
}

export default function ProfilePage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ state: "loading", message: "" });

  useEffect(() => {
    let off = false;
    getProfile(userId)
      .then((p) => {
        if (off) return;
        if (p) {
          setForm({
            sex: p.sex, age: String(p.age), height: String(p.height_cm),
            weight: String(p.weight_kg), activity: p.activity, goal: p.goal,
          });
        }
        setStatus({ state: "idle", message: "" });
      })
      .catch((e) => {
        if (off) return;
        // 404 just means no profile has been saved yet.
        setStatus(e.status === 404 ? { state: "idle", message: "" } : { state: "error", message: e.message });
      });
    return () => { off = true; };
  }, [userId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const problem = validate(form);
  const plan = useMemo(
    () => (problem ? null : buildPlan({
      sex: form.sex, age: Number(form.age), height: Number(form.height),
      weight: Number(form.weight), activity: form.activity, goal: form.goal,
    })),
    [form, problem]
  );

  const save = async () => {
    if (!plan) return;
    setStatus({ state: "saving", message: "" });
    try {
      await saveProfile({
        user_id: userId, sex: form.sex, age: Number(form.age),
        height_cm: Number(form.height), weight_kg: Number(form.weight),
        activity: form.activity, goal: form.goal,
        bmi: plan.bmi, target_weight_kg: plan.targetWeight,
        calories: plan.calories, protein_g: plan.protein, carbs_g: plan.carbs, fats_g: plan.fats,
      });
      setStatus({ state: "success", message: "Profile and targets saved." });
    } catch (e) {
      setStatus({ state: "error", message: e.message });
    }
  };

  return (
    <main className="profile">
      <section className="card profile__form">
        <h1>My profile and target</h1>
        <p className="profile__lead">Enter your details. Your numbers update as you type.</p>

        <fieldset>
          <legend>Goal</legend>
          <div className="seg" role="radiogroup" aria-label="Goal">
            {[["lose", "Lose weight"], ["gain", "Gain weight"]].map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={form.goal === v}
                      className={form.goal === v ? "seg__btn seg__btn--on" : "seg__btn"}
                      onClick={() => setForm((f) => ({ ...f, goal: v }))}>{label}</button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Sex</legend>
          <div className="seg" role="radiogroup" aria-label="Sex">
            {[["male", "Male"], ["female", "Female"]].map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={form.sex === v}
                      className={form.sex === v ? "seg__btn seg__btn--on" : "seg__btn"}
                      onClick={() => setForm((f) => ({ ...f, sex: v }))}>{label}</button>
            ))}
          </div>
        </fieldset>

        <div className="profile__grid">
          <label>Age (years)
            <input type="number" inputMode="numeric" value={form.age} onChange={set("age")} placeholder="30" />
          </label>
          <label>Height (cm)
            <input type="number" inputMode="decimal" value={form.height} onChange={set("height")} placeholder="175" />
          </label>
          <label>Weight (kg)
            <input type="number" inputMode="decimal" step="0.1" value={form.weight} onChange={set("weight")} placeholder="80" />
          </label>
        </div>

        <label className="profile__activity">Activity level
          <select value={form.activity} onChange={set("activity")}>
            {ACTIVITY.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </label>

        {problem?.msg && <p className="profile__msg profile__msg--error" role="alert">{problem.msg}</p>}

        <div className="profile__actions">
          <button className="btn-primary" onClick={save} disabled={!plan || status.state === "saving"}>
            {status.state === "saving" ? "Saving…" : "Save profile"}
          </button>
          {status.state === "success" && (
            <button className="btn-outline" onClick={() => navigate("/")}>Back to dashboard</button>
          )}
        </div>
        <p className={`profile__msg profile__msg--${status.state}`} role="status" aria-live="polite">{status.message}</p>
      </section>

      <div className="profile__results">
        {!plan ? (
          <section className="card"><p className="empty">Fill in your age, height and weight to see your BMI, target weight and daily targets.</p></section>
        ) : (
          <>
            <section className="card">
              <h2>Your numbers</h2>
              <ul className="tiles">
                <li className="tile tile--green">
                  <span>BMI</span><strong>{plan.bmi}</strong>
                  <small>{plan.category}. Healthy weight for your height: {plan.healthyMin}-{plan.healthyMax} kg</small>
                </li>
                <li className="tile tile--blue">
                  <span>Suggested target weight</span><strong>{plan.targetWeight} kg</strong>
                  <small>
                    {plan.weightChange === 0 ? "No change needed"
                      : `${plan.weightChange > 0 ? "+" : ""}${plan.weightChange} kg from now`}
                    {plan.weeks ? `, about ${plan.weeks} weeks` : ""}
                  </small>
                </li>
                <li className="tile tile--orange">
                  <span>Suggested daily calories</span><strong>{plan.calories.toLocaleString("en-US")} kcal</strong>
                  <small>Maintenance {plan.maintenance.toLocaleString("en-US")} kcal. BMR {plan.bmr.toLocaleString("en-US")} kcal</small>
                </li>
                <li className="tile tile--purple">
                  <span>Suggested daily protein</span><strong>{plan.protein} g</strong>
                  <small>About {plan.proteinPerKg} g per kg of body weight</small>
                </li>
              </ul>

              <ul className="macros">
                <li><span>Protein</span><b>{plan.protein} g</b></li>
                <li><span>Carbs</span><b>{plan.carbs} g</b></li>
                <li><span>Fats</span><b>{plan.fats} g</b></li>
              </ul>

              {plan.notes.map((n) => <p key={n} className="profile__note">{n}</p>)}
            </section>

            <MacroDonut totals={{ calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats }} />

            <section className="card">
              <details>
                <summary>How these are calculated</summary>
                <ul className="how">
                  <li><b>BMI</b> = weight (kg) / height (m)². Healthy range is BMI 18.5 to 24.9.</li>
                  <li><b>Target weight</b>: the middle of the healthy range (BMI 22) when losing, or up to 5% above your weight, capped at BMI 24.9, when you are already at a healthy weight and want to gain.</li>
                  <li><b>BMR</b> (Mifflin-St Jeor) = 10 × kg + 6.25 × cm − 5 × age, then +5 for men or −161 for women.</li>
                  <li><b>Maintenance</b> = BMR × activity factor. <b>Daily calories</b> = maintenance −500 to lose or +300 to gain, never below 1,500 (men) or 1,200 (women).</li>
                  <li><b>Protein</b> = 2.0 g/kg to lose or 1.8 g/kg to gain, using a healthy-range weight if your BMI is above 24.9, capped at 35% of calories. <b>Fats</b> = 25% of calories. <b>Carbs</b> = the remaining calories.</li>
                </ul>
                <p className="profile__note">These are general estimates, not medical advice. Check with a doctor or dietitian before starting a new plan, especially with a health condition.</p>
              </details>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
