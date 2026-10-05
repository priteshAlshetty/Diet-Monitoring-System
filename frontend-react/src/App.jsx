import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LogMealPage from "./pages/LogMealPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogMealPage />} />
        <Route path="history" element={<ComingSoonPage title="History" />} />
        <Route path="reports" element={<ComingSoonPage title="Reports" />} />
        <Route path="goals" element={<ComingSoonPage title="Goals" />} />
        <Route path="settings" element={<ComingSoonPage title="Settings" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="upload" element={<ComingSoonPage title="Upload meal data" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
