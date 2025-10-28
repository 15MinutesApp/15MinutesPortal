"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  adminEmail: string | null;
  login: (accessToken: string, refreshToken: string, email?: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // HTTP-only cookie'leri server-side kontrol et
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.authenticated) {
          // Kullanıcı authenticated, state'i güncelle
          setIsAuthenticated(true);
          setAccessToken("http-only");
          setRefreshToken("http-only");
          if (data.data?.email) {
            setAdminEmail(data.data.email);
          }
        } else {
          // Kullanıcı authenticated değil
          setIsAuthenticated(false);
          setAccessToken(null);
          setRefreshToken(null);
          setAdminEmail(null);
        }
      } catch (error) {
        console.error("Auth status check failed:", error);
        setIsAuthenticated(false);
        setAccessToken(null);
        setRefreshToken(null);
        setAdminEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (
    newAccessToken: string,
    newRefreshToken: string,
    email?: string
  ) => {
    // Tokens are stored in HTTP-only cookies by backend
    // We only need to update UI state
    if (email) {
      setAdminEmail(email);
    }
    setAccessToken("http-only");
    setRefreshToken("http-only");
    setIsAuthenticated(true);
  };

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("Token refreshed successfully");
        return true;
      } else {
        console.log("Token refresh failed");
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  // Auto-refresh token periodically to keep user logged in
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh interval: every 30 minutes (1800000 ms)
    // This keeps the user logged in by refreshing before expiry
    const refreshInterval = setInterval(async () => {
      try {
        const success = await refreshAccessToken();
        if (success) {
          console.log("Token auto-refreshed successfully");
        } else {
          console.log("Token auto-refresh failed, user will remain logged in");
          // Don't logout automatically, let user stay logged in
        }
      } catch (error) {
        console.error("Auto-refresh error:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount or when auth status changes
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshAccessToken]);

  const logout = async () => {
    try {
      // Logout endpoint'ini çağır ve HTTP-only cookie'leri sil
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }

    // Clear local state
    setAccessToken(null);
    setRefreshToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);

    // Login sayfasına yönlendir
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        adminEmail,
        login,
        logout,
        refreshAccessToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
