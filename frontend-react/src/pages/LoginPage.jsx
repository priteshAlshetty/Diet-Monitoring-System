import { useState } from "react";
import { BarChart3, Leaf, Target, Utensils } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import "./LoginPage.css";

const FEATURES = [
  { icon: Utensils, title: "Log meals in seconds", text: "Add foods with quantities and units, meal by meal." },
  { icon: Target, title: "Stay on target", text: "Compare calories, protein, carbs and fats with your daily goals." },
  { icon: BarChart3, title: "See your progress", text: "Review 7-day calorie trends and your weight change." },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return setError("Enter your username and password.");
    setBusy(true);
    setError("");
    try {
      await login({ username: username.trim(), password });
    } catch (e) {
      setError(e.status === 401 ? "Username or password is incorrect." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="shell">
      <TopBar mode="public" />

      <main className="public">
        <Leaf className="public__leaf" size={460} strokeWidth={0.8} aria-hidden="true" />

        <section className="public__info">
          <h1>Track every meal.<br />Build healthier habits.</h1>
          <p>
            MyDiet is a diet monitoring system that turns your daily meals into clear
            nutrition numbers, so you can see where you stand and what to adjust.
          </p>
          <ul>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="public__icon"><Icon size={20} /></span>
                <span><strong>{title}</strong><small>{text}</small></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="login__card" aria-labelledby="login-title">
          <h2 id="login-title">Sign in</h2>
          <p>Welcome back. Enter your details to continue.</p>
          <input
            className="login__field"
            type="text"
            autoComplete="username"
            placeholder="Username"
            aria-label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onKey}
          />
          <input
            className="login__field"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
          />
          <button className="login__btn" onClick={submit} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="login__error" role="alert">{error}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
