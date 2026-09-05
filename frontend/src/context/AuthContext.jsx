import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, getStoredUser, setStoredUser, apiRequest } from '../api';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  { role: 'Admin (Full Access)', email: 'admin@oxp.com', password: 'admin123', badge: 'HR Payroll Admin' },
  { role: 'Payroll Specialist', email: 'aarav@oxp.com', password: 'payroll123', badge: 'HR Payroll User' },
  { role: 'Employee', email: 'john@oxp.com', password: 'employee123', badge: 'Employee' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      const data = await apiRequest('/api/auth/me');
      const formatted = {
        ...data,
        roles: data.roles || [],
        employee_name: data.employee?.name || data.email.split('@')[0],
      };
      setUser(formatted);
      setStoredUser(formatted);
    } catch (err) {
      console.error('Session restore error:', err);
      // If unauthorized, clear
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

  const login = async (email, password) => {
    const res = await apiRequest('/api/auth/login', {
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

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('HR Payroll Admin')) return true; // Admin has all rights
    return user.roles.includes(role);
  };

  const isPayrollAdmin = user?.roles?.includes('HR Payroll Admin');
  const isPayrollUser = isPayrollAdmin || user?.roles?.includes('HR Payroll User');
  const isHRManager = isPayrollAdmin || user?.roles?.includes('HR Manager');

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

export function useAuth() {
  return useContext(AuthContext);
}
