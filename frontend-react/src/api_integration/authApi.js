// STATUS: REAL. Calls your backend.
import { request } from "../api/client";

// POST /api/auth/login  { username, password }
// -> { success, message, token, user: { id, username, role } }
export async function login(credentials) {
  return request("/api/auth/login", { method: "POST", body: credentials, auth: false });
}
