/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, ApiResponse } from '../types';
import { apiFetch, getApiUrl } from '../utils/api';

interface AuthContextType {
  state: AuthState;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  apiRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<ApiResponse<T>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem('vinebot_user');
    const storedToken = localStorage.getItem('vinebot_token') || localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        return {
          user,
          token: storedToken,
          isAuthenticated: true,
          loading: false
        };
      } catch (e) {
        // Fallback to unauthenticated if JSON is corrupt
      }
    }
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false
    };
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('vinebot_user');
    const storedToken = localStorage.getItem('vinebot_token') || localStorage.getItem('token');

    if (storedToken) {
      if (storedUser) {
        try {
          setState({
            user: JSON.parse(storedUser),
            token: storedToken,
            isAuthenticated: true,
            loading: false
          });
        } catch (e) {
          localStorage.removeItem('vinebot_user');
        }
      }

      // Automatically refresh user profile and session validity on app mount
      apiFetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.data) {
              const updatedUser = data.data;
              localStorage.setItem('vinebot_user', JSON.stringify(updatedUser));
              localStorage.setItem('vinebot_token', storedToken);
              localStorage.setItem('token', storedToken);
              setState({
                user: updatedUser,
                token: storedToken,
                isAuthenticated: true,
                loading: false
              });
              return;
            }
          }
          if (res.status === 401 && !storedUser) {
            localStorage.removeItem('vinebot_user');
            localStorage.removeItem('vinebot_token');
            localStorage.removeItem('token');
            localStorage.removeItem('vinebot_refresh');
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false
            });
          }
        })
        .catch(() => {
          setState(prev => ({ ...prev, loading: false }));
        });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('vinebot_token', token);
    if (refreshToken) {
      localStorage.setItem('vinebot_refresh', refreshToken);
    }
    localStorage.setItem('vinebot_user', JSON.stringify(user));
    setState({
      user,
      token,
      isAuthenticated: true,
      loading: false
    });
  };

  const logout = () => {
    const refresh = localStorage.getItem('vinebot_refresh');
    
    // Call server to revoke
    if (refresh && state.token) {
      apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ refreshToken: refresh })
      }).catch(() => {});
    }

    localStorage.removeItem('token');
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
    const activeToken = state.token || localStorage.getItem('vinebot_token') || localStorage.getItem('token');
    
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await apiFetch(endpoint, {
        ...options,
        headers
      });

      // Only perform automatic logout if /api/auth/me specifically returns 401 Unauthorized
      if (response.status === 401 && endpoint.includes('/api/auth/me')) {
        logout();
        return { success: false, message: 'Session expired. Please login again.' };
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('API request error:', err);
      return { success: false, message: 'Network connection notice. Please try again.' };
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
