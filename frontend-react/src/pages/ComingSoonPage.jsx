import { Link } from "react-router-dom";

export default function ComingSoonPage({ title }) {
  return (
    <main className="state">
      <h1 style={{ color: "var(--ink)" }}>{title}</h1>
      <p>This page isn't built yet.</p>
      <Link to="/" className="link-small" style={{ color: "var(--leaf)" }}>Back to dashboard</Link>
    </main>
  );
}
