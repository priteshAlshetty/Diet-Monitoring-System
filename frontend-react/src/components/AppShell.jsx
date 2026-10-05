import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import TopBar from "./TopBar";
import Footer from "./Footer";

export default function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <TopBar user={user} onLogout={logout} />
      <div className="shell__content"><Outlet /></div>
      <Footer />
    </div>
  );
}
