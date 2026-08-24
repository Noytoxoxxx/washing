import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";
import type { User, ProfessionalSummary } from "../types";

interface AuthState {
  user: User | null;
  professionalProfile: ProfessionalSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User | null; professionalProfile?: ProfessionalSummary | null }>("/auth/me");
      setUserState(data.user);
      setProfessionalProfile(data.professionalProfile ?? null);
    } catch {
      setUserState(null);
      setProfessionalProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const data = await api.post<{ user: User }>("/auth/login", { email, password, remember });
    await refresh();
    return data.user;
  }, [refresh]);

  const register = useCallback(
    async (payload: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
      const data = await api.post<{ user: User }>("/auth/register", payload);
      await refresh();
      return data.user;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUserState(null);
    setProfessionalProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, professionalProfile, loading, refresh, login, register, logout, setUser: setUserState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
