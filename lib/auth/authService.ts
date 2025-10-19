/**
 * Authentication Service
 * Handles admin login, TOTP verification, and token management
 *
 * Note: Tokens are stored in HTTP-only cookies by the backend.
 * Client-side JavaScript cannot access these cookies for security.
 * Authentication state is managed through server-side verification.
 */

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}
