"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { JwtPayload } from '@/lib/jwt';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

type User = {
  id: string;
  name: string;
  email: string;
  plan: string;
  walletBalance: number;
  minutesUsed: number;
  totalMinutes: number;
  agentsAllowed: number;
  extraMinuteRate?: number;
};

type RegisterUserData = {
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token on the server
          const response = await fetch('/api/auth/validate', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

 const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Save token to localStorage
    localStorage.setItem('token', data.token);

    // Also set the token as a cookie (for server-side requests)
    document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    // Decode user info from token
    const decoded = jwtDecode<JwtPayload>(data.token);
    setUser({
       id: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      plan: decoded.plan,
      walletBalance: (decoded as any).walletBalance || 0,
      minutesUsed: (decoded as any).minutesUsed || 0,
      totalMinutes: (decoded as any).totalMinutes || 0,
      agentsAllowed: (decoded as any).agentsAllowed || 0,
      extraMinuteRate: (decoded as any).extraMinuteRate,
    });

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const logout = () => {
  // Remove from both localStorage and cookies
  localStorage.removeItem('token');
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  setUser(null);
  router.push('/login');
};

  const register = async (userData: RegisterUserData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto login after registration
      await login(userData.email, userData.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
