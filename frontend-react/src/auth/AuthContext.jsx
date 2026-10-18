import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { refreshSession, setUnauthorizedHandler } from "../api/client";
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  changePassword as changePasswordRequest,
} from "../api_integration";

const AuthContext = createContext(null);
const USER_KEY = "dms_user";

// The tokens live in HttpOnly cookies and cannot be read from JavaScript. We only keep
// the (non-secret) user object in localStorage as a hint that a session probably exists.
// The server cookies stay the source of truth: see the refresh check on startup below.
function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

const SESSION_EXPIRED = "Your session expired. Please sign in again.";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  // "ready" is false only while we verify a remembered session on page load.
  const [ready, setReady] = useState(() => !loadUser());
  const [authNotice, setAuthNotice] = useState("");

  const clearSession = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("dms_token"); // leftover from the old bearer-token version
    setUser(null);
  }, []);

  // The API client calls this when a 401 could not be fixed by refreshing.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setAuthNotice(SESSION_EXPIRED);
    });
  }, [clearSession]);

  // On page load, if we remember a user, confirm the session is still valid. This also
  // issues a fresh access cookie. A failed check (cookies gone) sends the user to login.
  useEffect(() => {
    if (!loadUser()) return;
    let off = false;
    refreshSession()
      .then((ok) => {
        if (off || ok) return;
        clearSession();
        setAuthNotice(SESSION_EXPIRED);
      })
      .catch(() => { /* network/429: keep the session, the next request will retry */ })
      .finally(() => { if (!off) setReady(true); });
    return () => { off = true; };
  }, [clearSession]);

  const startSession = useCallback((res) => {
    if (res?.success === false || !res?.user) {
      throw new Error(res?.message || "Authentication failed.");
    }
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    setAuthNotice("");
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await loginRequest(credentials)),
    [startSession]
  );

  // The server also logs the user in on signup (it sets the cookies). We don't want that:
  // the user should sign in themselves, so clear those cookies and show a notice.
  const signup = useCallback(async (details) => {
    const res = await registerRequest(details);
    if (res?.success === false) {
      throw new Error(res?.message || "Account creation failed.");
    }
    try { await logoutRequest(); } catch { /* cookies expire on their own anyway */ }
    setAuthNotice("Sign-up successful. Please sign in with your password.");
  }, []);

  const logout = useCallback(async () => {
    try { await logoutRequest(); } catch { /* clear locally anyway */ }
    clearSession();
  }, [clearSession]);

  // The server clears the cookies on success, so the user has to sign in again.
  const changePassword = useCallback(
    async (passwords) => {
      await changePasswordRequest(passwords);
      clearSession();
      setAuthNotice("Password updated. Please sign in again.");
    },
    [clearSession]
  );

  const clearNotice = useCallback(() => setAuthNotice(""), []);

  const value = useMemo(
    () => ({
      user,
      userId: user?.id ?? user?.user_id ?? null,
      isAuthenticated: Boolean(user),
      ready,
      authNotice,
      clearNotice,
      login,
      signup,
      logout,
      changePassword,
    }),
    [user, ready, authNotice, clearNotice, login, signup, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
