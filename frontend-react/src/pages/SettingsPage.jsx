import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./SettingsPage.css";

const EMPTY = { oldPassword: "", newPassword: "", confirm: "" };

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const mismatch = form.confirm.length > 0 && form.newPassword !== form.confirm;
  const incomplete = !form.oldPassword || !form.newPassword || !form.confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (mismatch || incomplete) return;
    setStatus({ state: "saving", message: "" });
    try {
      // On success the server clears the cookies and AuthContext signs the user out,
      // so the login page appears with a "Password updated" notice.
      await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
    } catch (err) {
      setStatus({
        state: "error",
        message: err.status === 403 ? "Your current password is incorrect." : err.message,
      });
    }
  };

  return (
    <main className="settings">
      <section className="card settings__card">
        <h1>Settings</h1>
        <p className="settings__lead">Signed in as <b>{user?.username}</b>.</p>

        <h2>Change password</h2>
        <p className="settings__lead">You will be signed out and need to sign in again.</p>

        <form onSubmit={submit} className="settings__form">
          <label>Current password
            <input type="password" autoComplete="current-password" value={form.oldPassword}
                   onChange={set("oldPassword")} required />
          </label>
          <label>New password
            <input type="password" autoComplete="new-password" value={form.newPassword}
                   onChange={set("newPassword")} required />
          </label>
          <label>Confirm new password
            <input type="password" autoComplete="new-password" value={form.confirm}
                   onChange={set("confirm")} aria-invalid={mismatch} required />
          </label>

          {mismatch && <p className="settings__msg settings__msg--error" role="alert">Passwords do not match.</p>}

          <button className="btn-primary" type="submit"
                  disabled={incomplete || mismatch || status.state === "saving"}>
            {status.state === "saving" ? "Updating…" : "Update password"}
          </button>
          <p className={`settings__msg settings__msg--${status.state}`} role="status" aria-live="polite">
            {status.message}
          </p>
        </form>
      </section>
    </main>
  );
}
