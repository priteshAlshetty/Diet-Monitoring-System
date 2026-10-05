import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore, setUnauthorizedHandler } from "../api/client";
import { login as loginRequest } from "../api_integration";

const AuthContext = createContext(null);
const USER_KEY = "dms_user";

// Fallback: read the user from a JWT payload if the login response has no `user`.
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(tokenStore.get());
  const [user, setUser] = useState(loadUser());

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const login = useCallback(async (credentials) => {
    const res = await loginRequest(credentials);
    if (res?.success === false || !res?.token) {
      throw new Error(res?.message || "Login failed.");
    }
    const newToken = res.token;
    const newUser = res.user ?? decodeJwt(newToken);

    tokenStore.set(newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      userId: user?.id ?? user?.user_id ?? null,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
