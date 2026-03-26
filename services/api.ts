/**
 * API Service Layer
 * Handles all HTTP requests to the PHP backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/job-employers-api/api/public';

// ── Cookie Helpers ──────────────────────────────────────

/**
 * Set a cookie with the given name, value, and expiry in days
 */
export function setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

// ── Auth Token Helpers ──────────────────────────────────

const AUTH_TOKEN_KEY = 'nb_auth_token';
const AUTH_USER_KEY  = 'nb_auth_user';

/**
 * Save auth token and user data to cookies
 */
export function saveAuth(token: string, userData: AuthUser): void {
  setCookie(AUTH_TOKEN_KEY, token, 7);
  setCookie(AUTH_USER_KEY, JSON.stringify(userData), 7);
}

/**
 * Get saved auth token
 */
export function getAuthToken(): string | null {
  return getCookie(AUTH_TOKEN_KEY);
}

/**
 * Get saved auth user data
 */
export function getAuthUser(): AuthUser | null {
  const raw = getCookie(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth(): void {
  deleteCookie(AUTH_TOKEN_KEY);
  deleteCookie(AUTH_USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// ── Types ───────────────────────────────────────────────

export interface AuthUser {
  employer_id: number;
  mobileno: string;
  company_name: string;
  contact_person: string;
  company_logo: string;
  city: string;
}

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  employer_id: number;
  mobileno: string;
  company_name: string;
  contact_person: string;
  company_logo: string;
  city: string;
  token: string;
}

// ── API Methods ─────────────────────────────────────────

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();
  return data;
}

/**
 * POST /auth/login
 * Authenticate employer with mobile number and password
 */
export async function loginApi(
  mobileno: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ mobileno, password }),
  });
}

/**
 * GET /auth/me
 * Get current authenticated employer data
 */
export async function getMeApi(): Promise<ApiResponse<AuthUser>> {
  return apiRequest<AuthUser>('/me', {
    method: 'GET',
  });
}
