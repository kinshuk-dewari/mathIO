"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiLogin, apiMe, apiRegister } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "matiks_token";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const hydrate = useCallback(async (nextToken: string) => {
    try {
      const me = await apiMe(nextToken);
      setUser(me);
      setToken(nextToken);
      setStatus("authenticated");
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      hydrate(stored);
    } else {
      setStatus("unauthenticated");
    }
  }, [hydrate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken } = await apiLogin(email, password);
      localStorage.setItem(TOKEN_KEY, newToken);
      await hydrate(newToken);
    },
    [hydrate],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await apiRegister(email, password);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}