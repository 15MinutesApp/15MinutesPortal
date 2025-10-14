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
    const storedAccessToken = tokenStorage.getAccessToken();
    const storedRefreshToken = tokenStorage.getRefreshToken();
    const storedEmail = tokenStorage.getAdminEmail();

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setAdminEmail(storedEmail);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const login = (
    newAccessToken: string,
    newRefreshToken: string,
    email?: string
  ) => {
    tokenStorage.setTokens(newAccessToken, newRefreshToken);
    if (email) {
      tokenStorage.setAdminEmail(email);
      setAdminEmail(email);
    }
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenStorage.clearTokens();
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
