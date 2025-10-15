/**
 * Authentication Service
 * Handles admin login, TOTP verification, and token management
 */

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
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
