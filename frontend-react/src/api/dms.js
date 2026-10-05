import { request } from "./client";
import { mockLogin, mockInsertMeal, mockDeleteMeal, mockDashboard, mockProteinMonth } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// POST /api/auth/login  { username, password }
// -> { success, message, token, user: { id, username, role } }
export const login = (credentials) =>
  USE_MOCK
    ? mockLogin()
    : request("/api/auth/login", { method: "POST", body: credentials, auth: false });

export const insertMeal = (payload) =>
  USE_MOCK ? mockInsertMeal() : request("/api/dms/insertMeal", { method: "POST", body: payload });

// ASSUMPTION: one endpoint returns everything the dashboard needs.
// Expected shape: see api/mock.js (goals, totals, meals, trend, weight).
export const getDashboard = ({ userId, date }) =>
  USE_MOCK
    ? mockDashboard(date)
    : request(`/api/dms/dashboard?user_id=${userId}&date=${date}`);

// ASSUMPTION: delete by meal id.
export const deleteMeal = (id) =>
  USE_MOCK ? mockDeleteMeal(id) : request(`/api/dms/meals/${id}`, { method: "DELETE" });

// ASSUMPTION: daily protein totals for a month, month as "YYYY-MM".
// Expected shape: { goal: 80, days: [{ date: "2026-09-01", protein: 74 }, ...] }
// Days with no logged meals should simply be left out.
export const getProteinMonth = ({ userId, month }) =>
  USE_MOCK
    ? mockProteinMonth(month)
    : request(`/api/dms/proteinMonth?user_id=${userId}&month=${month}`);
