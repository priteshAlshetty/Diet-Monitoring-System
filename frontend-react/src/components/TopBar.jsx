import { Link, NavLink } from "react-router-dom";
import { Leaf } from "lucide-react";
import { NAV } from "./nav";
import "./AppShell.css";

const initials = (user) => {
  const parts = (user?.name ?? user?.username ?? user?.email ?? "U").split(/[\s@._-]+/).filter(Boolean);
  const text = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "U").slice(0, 2);
  return text.toUpperCase();
};

// mode="app": live links + account menu. mode="public": same bar, links inactive.
export default function TopBar({ mode = "app", user, onLogout }) {
  const isPublic = mode === "public";
  return (
    <header className="shell__bar">
      {isPublic ? (
        <span className="shell__brand"><Leaf size={28} strokeWidth={2.2} /><span>MyDiet</span></span>
      ) : (
        <Link to="/" className="shell__brand"><Leaf size={28} strokeWidth={2.2} /><span>MyDiet</span></Link>
      )}

      <nav className="shell__nav" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) =>
          isPublic ? (
            <span key={to} className="shell__link shell__link--off" aria-disabled="true" title="Sign in to use this">
              <Icon size={18} /><span>{label}</span>
            </span>
          ) : (
            <NavLink key={to} to={to} end={end} className="shell__link">
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      {isPublic ? (
        <span className="shell__hint">Sign in to continue</span>
      ) : (
        <details className="shell__user">
          <summary aria-label="Account menu"><span className="shell__avatar">{initials(user)}</span></summary>
          <div className="shell__menu">
            <p>{user?.name ?? user?.username ?? "Signed in"}{user?.role ? ` (${user.role})` : ""}</p>
            <button onClick={onLogout}>Sign out</button>
          </div>
        </details>
      )}
    </header>
  );
}
