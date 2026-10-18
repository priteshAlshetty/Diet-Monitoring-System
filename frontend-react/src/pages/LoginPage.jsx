import { useState } from "react";
import { BarChart3, Eye, EyeOff, Leaf, Target, Utensils } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import "./LoginPage.css";

const FEATURES = [
  { icon: Utensils, title: "Log meals in seconds", text: "Add foods with quantities and units, meal by meal." },
  { icon: Target, title: "Stay on target", text: "Compare calories, protein, carbs and fats with your daily goals." },
  { icon: BarChart3, title: "See your progress", text: "Review 7-day calorie trends and your weight change." },
];

// Turns backend errors (status + errorCode) into friendly messages.
function friendlyError(e, isSignup) {
  if (e.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  if (!isSignup && e.status === 401) return "Username or password is incorrect.";
  if (isSignup && e.status === 403) return "That early access code is not valid.";
  if (isSignup && e.status === 409) return "That username is already taken.";
  return e.message;
}

export default function LoginPage() {
  const { login, signup, authNotice, clearNotice } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [earlyAccessCode, setEarlyAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordsMismatch = isSignup && confirmPassword.length > 0 && password !== confirmPassword;

  const submit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) return setError("Enter your username and password.");
    if (isSignup && password !== confirmPassword) return;

    setBusy(true);
    setError("");
    clearNotice();
    try {
      const credentials = { username: username.trim(), password };
      if (isSignup) {
        await signup({ ...credentials, access_code: earlyAccessCode.trim() });
        // Back to the sign-in form with the username filled in; the success notice
        // comes from the auth context.
        setUsername(credentials.username);
        setIsSignup(false);
        setPassword("");
        setConfirmPassword("");
        setEarlyAccessCode("");
        window.alert("Sign-up successful. Please sign in with your password.");
      } else {
        await login(credentials);
      }
    } catch (e) {
      setError(friendlyError(e, isSignup));
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setIsSignup((current) => !current);
    setError("");
    clearNotice();
  };

  return (
    <div className="shell">
        {busy && (
        <div className="authloader" role="status" aria-live="polite">
          <div className="authloader__box">
            <span className="authloader__spinner" aria-hidden="true" />
            <strong>{isSignup ? "Creating your account…" : "Signing you in…"}</strong>
            <small>This may take a few seconds. Please don't close this page.</small>
          </div>
        </div>
      )}
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
          <p className="login__notice" role="status">{authNotice}</p>
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
