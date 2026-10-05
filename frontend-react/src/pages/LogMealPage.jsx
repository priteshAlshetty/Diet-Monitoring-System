import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import MealForm from "../components/MealForm";

export default function LogMealPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  return (
    <main style={{ maxWidth: 680, margin: "24px auto", padding: "0 16px" }}>
      <MealForm userId={userId} onSaved={() => navigate("/")} />
    </main>
  );
}
