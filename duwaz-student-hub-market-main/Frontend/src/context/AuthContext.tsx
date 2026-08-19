import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'DRIVER';

export interface User {
  userId: number;
  studentName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  // Driver-specific (only set when role === 'DRIVER')
  driverId?: number;
  driverStatus?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (token: string, user: User) => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'duwaz_token';
const USER_KEY = 'duwaz_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Refresh profileImage from API in background (may have changed since last login)
        if (parsedUser.userId && parsedUser.role !== 'DRIVER') {
          fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/Student/read/${parsedUser.userId}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
            .then(r => r.ok ? r.json() : null)
            .then(student => {
              if (student?.profileImage !== undefined) {
                const updated = { ...parsedUser, profileImage: student.profileImage ?? undefined };
                setUser(updated);
                localStorage.setItem(USER_KEY, JSON.stringify(updated));
              }
            })
            .catch(() => {}); // silent — not critical
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback((token: string, user: User) => {
    login(token, user);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'ADMIN',
        isDriver: user?.role === 'DRIVER',
        isLoading,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
