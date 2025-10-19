"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  adminEmail: string | null;
  login: (accessToken: string, refreshToken: string, email?: string) => void;
  logout: () => void;
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

  const logout = () => {
    // Clear local state
    // Backend should clear cookies on logout endpoint call
    setAccessToken(null);
    setRefreshToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
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
