/**
 * Authentication Service
 * Handles admin login, TOTP verification, and token management
 */

import { graphqlRequest } from "../api/graphql";

export interface LoginResponse {
  Admin_startPasswordLogin: string; // challengeToken
}

export interface VerifyTotpResponse {
  Admin_verifyTotp: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface VerifyBackupCodeResponse {
  Admin_verifyBackupCode: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface UsersResponse {
  Admin_users: AdminUser[];
}

/**
 * Step 1: Start password login
 * Returns a challenge token for TOTP verification
 */
export async function startPasswordLogin(
  email: string,
  password: string
): Promise<string> {
  const query = `
    mutation StartPasswordLogin($email: String!, $password: String!) {
      Admin_startPasswordLogin(email: $email, password: $password)
    }
  `;

  const data = await graphqlRequest<LoginResponse>(query, {
    email,
    password,
  });

  return data.Admin_startPasswordLogin;
}

/**
 * Step 2: Verify TOTP code
 * Returns access and refresh tokens
 */
export async function verifyTotp(
  challengeToken: string,
  totpCode: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const query = `
    mutation VerifyTotp($challengeToken: String!, $totpCode: String!) {
      Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
        accessToken
        refreshToken
      }
    }
  `;

  const data = await graphqlRequest<VerifyTotpResponse>(query, {
    challengeToken,
    totpCode,
  });

  return data.Admin_verifyTotp;
}

/**
 * Alternative Step 2: Verify backup code
 * Returns access and refresh tokens
 */
export async function verifyBackupCode(
  challengeToken: string,
  backupCode: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const query = `
    mutation VerifyBackupCode($challengeToken: String!, $backupCode: String!) {
      Admin_verifyBackupCode(challengeToken: $challengeToken, backupCode: $backupCode) {
        accessToken
        refreshToken
      }
    }
  `;

  const data = await graphqlRequest<VerifyBackupCodeResponse>(query, {
    challengeToken,
    backupCode,
  });

  return data.Admin_verifyBackupCode;
}

/**
 * Get admin users (requires authentication)
 */
export async function getAdminUsers(
  accessToken: string,
  page: number = 1,
  limit: number = 10
): Promise<AdminUser[]> {
  const query = `
    query GetUsers($page: Int!, $limit: Int!) {
      Admin_users(page: $page, limit: $limit) {
        id
        email
        createdAt
      }
    }
  `;

  const data = await graphqlRequest<UsersResponse>(
    query,
    { page, limit },
    accessToken
  );

  return data.Admin_users;
}

/**
 * Token Storage Management
 */
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof document === "undefined") return null;
    return getCookie("accessToken");
  },

  getRefreshToken: (): string | null => {
    if (typeof document === "undefined") return null;
    return getCookie("refreshToken");
  },

  getAdminEmail: (): string | null => {
    if (typeof document === "undefined") return null;
    return getCookie("adminEmail");
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof document === "undefined") return;
    setCookie("accessToken", accessToken);
    setCookie("refreshToken", refreshToken);
  },

  setAdminEmail: (email: string): void => {
    if (typeof document === "undefined") return;
    setCookie("adminEmail", email);
  },

  clearTokens: (): void => {
    if (typeof document === "undefined") return;
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    deleteCookie("adminEmail");
  },
};

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const encoded = encodeURIComponent(value);
  // Session cookie with Lax policy; add Secure on HTTPS
  document.cookie = `${name}=${encoded}; path=/; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; Max-Age=0; SameSite=Lax`;
}
