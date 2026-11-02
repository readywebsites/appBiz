import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { storage } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithEmail: (credentials: { email: string; password: string }) => Promise<any>;
  sendPhoneOtp: (phone: string) => Promise<any>;
  verifyPhoneOtp: (payload: {
    phone: string;
    otp: string;
    full_name?: string;
    business_name?: string;
    email?: string;
  }) => Promise<any>;
  sendEmailOtp: (email: string) => Promise<any>;
  verifyEmailOtp: (payload: { email: string; otp: string }) => Promise<any>;
  register: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      await api.clearTokens();
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
  };

  const loginWithEmail = async (credentials: { email: string; password: string }) => {
    const res = await api.loginWithEmail(credentials);
    if (!res.requires_otp && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const sendPhoneOtp = async (phone: string) => {
    return api.sendPhoneOtp(phone);
  };

  const verifyPhoneOtp = async (payload: {
    phone: string;
    otp: string;
    full_name?: string;
    business_name?: string;
    email?: string;
  }) => {
    const res = await api.verifyPhoneOtp(payload);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const sendEmailOtp = async (email: string) => {
    return api.sendEmailOtp(email);
  };

  const verifyEmailOtp = async (payload: { email: string; otp: string }) => {
    const res = await api.verifyEmailOtp(payload);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const updateProfile = async (data: any) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const logout = async () => {
    const refresh = await storage.getItem('biz499_refresh_token');
    await api.logoutBackend(refresh || undefined);
    setUser(null);
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
        register,
        updateProfile,
        logout,
        deleteAccount,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

