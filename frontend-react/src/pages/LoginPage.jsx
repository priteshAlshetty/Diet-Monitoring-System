import { useState } from "react";
import { BarChart3, Eye, EyeOff, Leaf, Target, Utensils } from "lucide-react";
import { register } from "../api_integration";
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
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [earlyAccessCode, setEarlyAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordsMismatch = isSignup && confirmPassword.length > 0 && password !== confirmPassword;

  const submit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) return setError("Enter your username and password.");
    if (isSignup && password !== confirmPassword) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const credentials = { username: username.trim(), password };
      if (isSignup) {
        const response = await register({
          ...credentials,
          earlyAccessCode: earlyAccessCode.trim(),
        });
        if (response?.success === false) {
          throw new Error(response.message || "Account creation failed.");
        }
        setUsername(credentials.username);
        setIsSignup(false);
        setPassword("");
        setConfirmPassword("");
        setEarlyAccessCode("");
        setNotice("Sign-up successful. Please sign in.");
      } else {
        await login(credentials);
      }
    } catch (e) {
      setError(!isSignup && e.status === 401 ? "Username or password is incorrect." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setIsSignup((current) => !current);
    setError("");
    setNotice("");
  };

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
          <h2 id="login-title">{isSignup ? "Create account" : "Sign in"}</h2>
          <p>{isSignup ? "Create an account to start tracking your meals." : "Welcome back. Enter your details to continue."}</p>
          <form className="login__form" onSubmit={submit}>
            <div className="login__field-group">
              <label className="login__label" htmlFor="auth-username">Username</label>
              <input
                className="login__field"
                id="auth-username"
                type="text"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login__field-group">
              <label className="login__label" htmlFor="auth-password">Password</label>
              <div className="login__password">
                <input
                  className={`login__field${passwordsMismatch ? " login__field--invalid" : ""}`}
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="Password"
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? "password-mismatch" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="login__password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
            {isSignup && (
              <div className="login__field-group">
                <label className="login__label" htmlFor="auth-confirm-password">Confirm password</label>
                <div className="login__password">
                  <input
                    className={`login__field${passwordsMismatch ? " login__field--invalid" : ""}`}
                    id="auth-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    aria-invalid={passwordsMismatch}
                    aria-describedby={passwordsMismatch ? "password-mismatch" : undefined}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    className="login__password-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    aria-pressed={showConfirmPassword}
                    title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="login__validation" id="password-mismatch" role="alert">
                    Passwords do not match.
                  </p>
                )}
              </div>
            )}
            {isSignup && (
              <div className="login__field-group">
                <label className="login__label" htmlFor="early-access-code">Early access code</label>
                <input
                  className="login__field"
                  id="early-access-code"
                  type="text"
                  name="earlyAccessCode"
                  autoComplete="off"
                  placeholder="Early access code"
                  value={earlyAccessCode}
                  onChange={(e) => setEarlyAccessCode(e.target.value)}
                  required
                />
              </div>
            )}
            <button className="login__btn" type="submit" disabled={busy}>
              {busy ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create account" : "Sign in")}
            </button>
          </form>
          <p className="login__error" role="alert">{error}</p>
          <p className="login__notice" role="status">{notice}</p>
          <p className="login__switch-text">
            {isSignup ? "Already have an account?" : "New to MyDiet?"}
            <button className="login__switch" type="button" onClick={toggleMode} disabled={busy}>
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
