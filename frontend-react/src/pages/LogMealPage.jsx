import { useNavigate } from "react-router-dom";
import MealForm from "../components/MealForm";

export default function LogMealPage() {
  const navigate = useNavigate();
  return (
    <main style={{ maxWidth: 680, margin: "24px auto", padding: "0 16px" }}>
      <MealForm onSaved={() => navigate("/")} />
    </main>
  );
}
