/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, ApiResponse } from '../types';

interface AuthContextType {
  state: AuthState;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  apiRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<ApiResponse<T>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    // Attempt to resume session
    const storedUser = localStorage.getItem('vinebot_user');
    const storedToken = localStorage.getItem('vinebot_token');

    if (storedUser && storedToken) {
      try {
        setState({
          user: JSON.parse(storedUser),
          token: storedToken,
          isAuthenticated: true,
          loading: false
        });
      } catch (e) {
        localStorage.removeItem('vinebot_user');
        localStorage.removeItem('vinebot_token');
        setState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('vinebot_user', JSON.stringify(user));
    localStorage.setItem('vinebot_token', token);
    localStorage.setItem('vinebot_refresh', refreshToken);
    setState({
      user,
      token,
      isAuthenticated: true,
      loading: false
    });
  };

  const getApiUrl = (endpoint: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (!baseUrl) return endpoint;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
  };

  const logout = () => {
    const refresh = localStorage.getItem('vinebot_refresh');
    
    // Call server to revoke
    if (refresh && state.token) {
      fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ refreshToken: refresh })
      }).catch(() => {});
    }

    localStorage.removeItem('vinebot_user');
    localStorage.removeItem('vinebot_token');
    localStorage.removeItem('vinebot_refresh');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('vinebot_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  };

  const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const headers = new Headers(options.headers || {});
    if (state.token) {
      headers.set('Authorization', `Bearer ${state.token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers
      });

      if ((response.status === 401 || response.status === 403) && state.isAuthenticated) {
        // Automatic logout on unauthenticated
        logout();
        return { success: false, message: 'Session expired. Please login again.' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('API request error:', err);
      return { success: false, message: 'Network connection error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser, apiRequest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
