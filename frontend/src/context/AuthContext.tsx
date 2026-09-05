import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, setToken, getStoredUser, setStoredUser, apiRequest } from '../api';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isPayrollAdmin: boolean;
  isPayrollUser: boolean;
  isHRManager: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const DEMO_USERS = [
  { role: 'Admin (Full Access)', email: 'admin@oxp.com', password: 'admin123', badge: 'HR Payroll Admin' },
  { role: 'Payroll Specialist', email: 'aarav@oxp.com', password: 'payroll123', badge: 'HR Payroll User' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      const data = await apiRequest('/api/auth/me');
      const formatted: User = {
        ...data,
        roles: data.roles || [],
        employee_name: data.employee?.name || data.email.split('@')[0],
      };
      setUser(formatted);
      setStoredUser(formatted);
    } catch (err: any) {
      console.error('Session restore error:', err);
      if (err.status === 401 || err.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setToken(res.token);
    setTokenState(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setStoredUser(null);
    setUser(null);
  };

  const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    if (userRoles.includes('HR Payroll Admin') || userRoles.includes('Admin') || user?.role === 'Admin') return true;
    return userRoles.includes(role) || user?.role === role;
  };

  const isPayrollAdmin = Boolean(
    userRoles.includes('HR Payroll Admin') ||
    userRoles.includes('Admin') ||
    user?.role === 'Admin' ||
    user?.role === 'HR Payroll Admin'
  );
  const isHRManager = isPayrollAdmin || Boolean(
    userRoles.includes('HR Manager') ||
    user?.role === 'HR Manager'
  );
  const isPayrollUser = isPayrollAdmin || isHRManager || Boolean(
    userRoles.includes('HR Payroll User') ||
    user?.role === 'HR Payroll User'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        isPayrollAdmin,
        isPayrollUser,
        isHRManager,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
