// STATUS: REAL. Calls your backend.
// Auth is cookie based (HttpOnly access_token + refresh_token). No token is returned
// in a response body and nothing is stored by the frontend.
import { request } from "../api/client";

// POST /api/auth/login  { username, password }
// 200 -> { success, message, user: { id, username } } + Set-Cookie
// 400 missing fields, 401 INVALID_CREDENTIALS, 429 too many attempts
export async function login({ username, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

// POST /api/auth/signup  { username, password, access_code }
// 201 -> { success, message, user: { id, username } } + Set-Cookie (the server logs the user in;
//          the frontend clears those cookies and asks the user to sign in)
// 400 validation, 403 invalid access code, 409 username exists, 429 too many attempts
export async function register({ username, password, access_code }) {
  return request("/api/auth/signup", {
    method: "POST",
    body: { username, password, access_code },
    auth: false,
  });
}

// POST /api/auth/logout  -> clears both cookies
export async function logout() {
  return request("/api/auth/logout", { method: "POST", auth: false });
}

// PUT /api/auth/update-password  { oldPassword, newPassword }
// The user comes from the access cookie. On 200 the cookies are cleared and the user
// must log in again. 400 missing/too short, 403 INVALID_CURRENT_PASSWORD.
export async function changePassword({ oldPassword, newPassword }) {
  return request("/api/auth/update-password", {
    method: "PUT",
    body: { oldPassword, newPassword },
  });
}

// POST /api/auth/refresh lives in api/client.js (refreshSession) because the client
// calls it automatically on a 401.
