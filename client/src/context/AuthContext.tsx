import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  registerApi,
  loginApi,
  getMeApi,
  logoutApi,
  RegisterPayload,
  LoginPayload,
} from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('smart_livestock_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session and verify token on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smart_livestock_token');
      if (storedToken) {
        try {
          const res = await getMeApi();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('smart_livestock_token');
            setToken(null);
            setUser(null);
          }
        } catch {
          // Token invalid or network issue
          localStorage.removeItem('smart_livestock_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginApi(payload);
      if (res.token && res.user) {
        localStorage.setItem('smart_livestock_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await registerApi(payload);
      if (res.token && res.user) {
        localStorage.setItem('smart_livestock_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('smart_livestock_token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
