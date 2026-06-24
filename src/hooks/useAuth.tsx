import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'anxin_auth';

interface AuthUser {
  username: string;
  role: string;
  displayName: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

function loadAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { token: null, user: null };
}

function saveAuth(token: string | null, user: AuthUser | null) {
  if (token && user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

const AuthContext = createContext<AuthState | null>(null);

function getProxyUrl(): string {
  return (import.meta.env.VITE_AI_PROXY_URL || '').replace(/\/$/, '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and verify token
  useEffect(() => {
    const stored = loadAuth();
    if (stored.token) {
      const proxyUrl = getProxyUrl();
      if (proxyUrl) {
        fetch(`${proxyUrl}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${stored.token}` },
        })
          .then(res => {
            if (res.ok) {
              setToken(stored.token);
              setUser(stored.user);
            } else {
              saveAuth(null, null);
            }
          })
          .catch(() => {
            // Backend might not be running, but keep the token for offline use
            setToken(stored.token);
            setUser(stored.user);
          })
          .finally(() => setLoading(false));
      } else {
        // No backend configured, use stored token
        setToken(stored.token);
        setUser(stored.user);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const proxyUrl = getProxyUrl();
    if (!proxyUrl) throw new Error('未設定後端 API 網址');

    const res = await fetch(`${proxyUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登入失敗');

    const newUser: AuthUser = { username: data.username, role: data.role, displayName: data.displayName || data.username };
    setToken(data.token);
    setUser(newUser);
    saveAuth(data.token, newUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    saveAuth(null, null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Get the current auth token (can be called outside React components) */
export function getAuthToken(): string | null {
  return loadAuth().token;
}
