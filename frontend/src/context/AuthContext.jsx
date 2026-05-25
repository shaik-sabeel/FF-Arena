import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Load user data on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Failed to load user', err);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login action
  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Invalid credentials'
      };
    }
  };

  // Register action
  const register = async (username, email, password, freeFireId, freeFireName) => {
    try {
      const res = await API.post('/auth/register', {
        username,
        email,
        password,
        freeFireId,
        freeFireName
      });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Registration failed'
      };
    }
  };



  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Update profile details
  const updateProfile = async (freeFireId, freeFireName, role) => {
    try {
      const res = await API.put('/api/user/profile' || '/user/profile', {
        freeFireId,
        freeFireName,
        role
      });
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.msg || 'Profile update failed'
      };
    }
  };

  // Update wallet state directly
  const syncWalletBalance = (newBalance) => {
    if (user) {
      setUser({
        ...user,
        walletBalance: newBalance
      });
    }
  };

  // Fetch fresh user data (for sync)
  const refreshUser = async () => {
    if (token) {
      try {
        const res = await API.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Error refreshing user details', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        syncWalletBalance,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
