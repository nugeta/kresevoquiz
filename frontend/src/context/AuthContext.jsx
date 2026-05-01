import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track whether user was authenticated so we can show toast on unexpected logout
  const wasAuthenticatedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      if (response.data.authenticated) {
        setUser(response.data);
        wasAuthenticatedRef.current = true;
      } else {
        // Try to refresh the token
        try {
          await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          const retry = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
          if (retry.data.authenticated) {
            setUser(retry.data);
            wasAuthenticatedRef.current = true;
          } else {
            setUser(false);
          }
        } catch {
          setUser(false);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Try refresh
        try {
          await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
          const retry = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
          setUser(retry.data.authenticated ? retry.data : false);
          if (retry.data.authenticated) wasAuthenticatedRef.current = true;
        } catch {
          // Only show toast if user was previously logged in (not on initial page load)
          if (wasAuthenticatedRef.current) toast.error('Sesija je istekla. Molimo prijavi se ponovo.');
          setUser(false);
        }
      } else {
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const formatApiErrorDetail = (detail) => {
    if (detail == null) return "Nešto je pošlo po zlu. Pokušajte ponovno.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { username, password },
        { withCredentials: true }
      );
      setUser({
        authenticated: true,
        ...response.data
      });
      wasAuthenticatedRef.current = true;
      return { success: true };
    } catch (error) {
      // Special case: banned user
      if (error.response?.status === 403 && error.response?.data?.detail === 'BANNED') {
        return { success: false, banned: true };
      }
      return {
        success: false,
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message
      };
    }
  };

  const register = async (username, password, invite_code = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { username, password, invite_code },
        { withCredentials: true }
      );
      setUser({
        authenticated: true,
        ...response.data
      });
      wasAuthenticatedRef.current = true;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: formatApiErrorDetail(error.response?.data?.detail) || error.message
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    wasAuthenticatedRef.current = false;
    setUser(false);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: user && user.authenticated,
    isAdmin: user && user.role === 'admin',
    refreshUser: checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
