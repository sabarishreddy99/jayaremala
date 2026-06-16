"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  apiLogin,
  apiMe,
  apiSignup,
  clearToken,
  getToken,
  setToken,
  type GVUser,
} from "@/lib/gradevitian/auth";

interface GVAuthContextValue {
  user: GVUser | null;
  loading: boolean;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (input: { name: string; email: string; username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const GVAuthContext = createContext<GVAuthContextValue | null>(null);

export function GVAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GVUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore the session from a stored token.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = getToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) setTokenState(stored);
      try {
        const res = await apiMe(stored);
        if (!cancelled) setUser(res.user);
      } catch {
        clearToken();
        if (!cancelled) setTokenState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { token: t, user: u } = await apiLogin({ identifier, password });
    setToken(t);
    setTokenState(t);
    setUser(u);
  }, []);

  const signup = useCallback(
    async (input: { name: string; email: string; username: string; password: string }) => {
      const { token: t, user: u } = await apiSignup(input);
      setToken(t);
      setTokenState(t);
      setUser(u);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <GVAuthContext.Provider value={{ user, loading, token, login, signup, logout }}>
      {children}
    </GVAuthContext.Provider>
  );
}

export function useGVAuth(): GVAuthContextValue {
  const ctx = useContext(GVAuthContext);
  if (!ctx) throw new Error("useGVAuth must be used within GVAuthProvider");
  return ctx;
}
