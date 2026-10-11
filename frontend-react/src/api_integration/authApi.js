// STATUS: REAL. Calls your backend.
import { request } from "../api/client";

// POST /api/auth/login  { username, password }
// -> { success, message, token, user: { id, username, role } }
export async function login(credentials) {
  const { username, password } = credentials;
  return request("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

// POST /api/auth/signup { username, password, role, earlyAccessCode }
export async function register(credentials) {
  const { username, password, earlyAccessCode } = credentials;
  return request("/api/auth/signup", {
    method: "POST",
    body: { username, password, role: "user", earlyAccessCode },
    auth: false,
  });
}
