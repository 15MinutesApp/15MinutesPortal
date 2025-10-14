"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { tokenStorage } from "@/lib/auth/authService";

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

  // Check for existing tokens on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        const data = await response.json();

        if (data.isAuthenticated) {
          setIsAuthenticated(true);
          setAdminEmail(data.adminEmail);
          // Tokens are now in HTTP-only cookies, not accessible via JS
          setAccessToken("http-only");
          setRefreshToken("http-only");
        }
      } catch (error) {
        console.error("Auth status check failed:", error);
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
    // Tokens are now stored in HTTP-only cookies by the API
    if (email) {
      setAdminEmail(email);
    }
    setAccessToken("http-only");
    setRefreshToken("http-only");
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }

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
