import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Priority: sessionStorage (isolated per tab)
    let token = sessionStorage.getItem('token');
    let savedUser = sessionStorage.getItem('user');

    // Migration fallback: if present in localStorage, transfer to sessionStorage
    if (!token && localStorage.getItem('token')) {
      token = localStorage.getItem('token');
      savedUser = localStorage.getItem('user');
      if (token) {
        sessionStorage.setItem('token', token);
        if (savedUser) sessionStorage.setItem('user', savedUser);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    // Store in tab-specific sessionStorage so different tabs can have different accounts
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    // Clean up localStorage to prevent cross-tab leaks
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token } = res.data.data;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(user);
    return user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updated) => {
    sessionStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
