import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getAuthToken, getAuthUser, clearAuth, getMeApi, saveAuth, type AuthUser } from '@/services/api';
import { useRouter } from 'next/router';

// ── Context Type ────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        // Try reading cached user from cookie (fallback)
        const cachedUser = getAuthUser();
        if (cachedUser) {
          setUser(cachedUser);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await getMeApi();
        if (res.status && res.data) {
          setUser(res.data);
        } else {
          // Instead of clearing auth immediately on local API failure/401,
          // fallback to the cached user cookie so the app remains usable.
          const cachedUser = getAuthUser();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            clearAuth();
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Fallback to cached user
        const cachedUser = getAuthUser();
        if (cachedUser) {
          setUser(cachedUser);
        } else {
          clearAuth();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Refresh user data manually
  const refreshUser = useCallback(async () => {
    try {
      const res = await getMeApi();
      if (res.status && res.data) {
        setUser(res.data);
        // Update cookie too
        const token = getAuthToken();
        if (token) {
          saveAuth(token, res.data);
        }
      }
    } catch (err) {
      console.error("Refresh user failed:", err);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
