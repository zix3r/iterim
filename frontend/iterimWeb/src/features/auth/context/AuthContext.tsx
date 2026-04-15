import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchWithAuth } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH = '/auth';

// Handles both { errors: string[] } and ASP.NET ModelState { field: string[] } shapes
function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.errors) && d.errors.length > 0) return String(d.errors[0]);
  for (const key of Object.keys(d)) {
    if (['type', 'title', 'status', 'traceId'].includes(key)) continue;
    const val = d[key];
    if (Array.isArray(val) && val.length > 0) return String(val[0]);
  }
  if (typeof d.title === 'string') return d.title;
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${AUTH}/me`);
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchMe().finally(() => setIsLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetchWithAuth(`${AUTH}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('[auth] login failed', { status: res.status, data });
      const msg = extractError(data, res.status === 401 ? 'Invalid credentials.' : 'Login failed.');
      throw new Error(msg);
    }
    setUser(await res.json());
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetchWithAuth(`${AUTH}/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = extractError(data, 'Registration failed.');
      throw new Error(msg);
    }
    setUser(await res.json());
  }, []);

  const logout = useCallback(async () => {
    await fetchWithAuth(`${AUTH}/logout`, { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}