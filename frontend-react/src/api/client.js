// Base HTTP client for cookie-based auth.
//
// The backend sets two HttpOnly cookies (access_token, refresh_token). JavaScript
// cannot read them, so there is no token handling here: the browser attaches the
// cookies by itself. The frontend is served by the Express app, so every request
// is same-origin and uses relative URLs (no CORS).
//
// On a 401 from a protected route the client calls POST /api/auth/refresh once,
// retries the original request, and only ends the session if the refresh fails.

// Leave VITE_API_URL unset in production. Only set it if the API is on another origin
// (that needs CORS with credentials on the server). In dev, prefer a Vite proxy.
const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// AuthContext registers a callback so an expired session logs the user out.
let onSessionEnd = () => { };
export const setUnauthorizedHandler = (fn) => { onSessionEnd = fn; };

async function send(path, method, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { res, data };
}

function toError({ res, data }) {
  const err = new Error(data?.message || `Request failed (${res.status})`);
  err.status = res.status;
  err.code = data?.errorCode ?? null; // e.g. TOKEN_EXPIRED, INVALID_CREDENTIALS
  return err;
}

// Shared promise so several requests that fail together trigger only one refresh.
let refreshing = null;

// Resolves true when a new access cookie was set, false when the refresh cookie is
// missing/expired/invalid (session over). Throws on network errors, 429, 5xx.
export function refreshSession() {
  if (!refreshing) {
    refreshing = send("/api/auth/refresh", "POST")
      .then((r) => {
        if (r.res.ok) return true;
        if (r.res.status === 401) return false;
        throw toError(r);
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
  let result = await send(path, method, body);

  // Only protected routes refresh. Login/signup/logout pass auth:false, so a wrong
  // password (401 INVALID_CREDENTIALS) is never mistaken for an expired session.
  if (result.res.status === 401 && auth) {
    let renewed;
    try {
      renewed = await refreshSession();
    } catch {
      throw toError(result); // refresh itself failed (network, 429): keep the session
    }
    if (!renewed) {
      onSessionEnd();
      throw toError(result);
    }
    result = await send(path, method, body); // retry once
    if (result.res.status === 401) onSessionEnd();
  }

  if (!result.res.ok) throw toError(result);
  return result.data;
}
