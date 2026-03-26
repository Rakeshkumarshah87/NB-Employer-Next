import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getAuthToken, getAuthUser, clearAuth, getMeApi, type AuthUser } from '@/services/api';
import { useRouter } from 'next/router';

// ── Context Type ────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
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
          clearAuth();
          setUser(null);
        }
      } catch {
        // If API is unreachable, try cached user data
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

  // Logout function
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
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
