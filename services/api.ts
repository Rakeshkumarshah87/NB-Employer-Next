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
  email: string;
  company_number: string;
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
    (headers as Record<string, string>)['X-Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-JSON or empty responses gracefully
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    // Server returned non-JSON (e.g. 500 with empty body or HTML error page)
    throw new Error(`Server error (${response.status}). Please try again.`);
  }

  return data;
}

/**
 * POST /auth/send-otp
 * Request an OTP for login
 */
export async function sendOtpApi(mobileno: string): Promise<ApiResponse<{ otp?: string }>> {
  return apiRequest<{ otp?: string }>('/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileno }),
  });
}

/**
 * POST /auth/login
 * Authenticate employer with mobile number and OTP
 */
export async function loginApi(
  mobileno: string,
  otp: string
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ mobileno, password: otp }), // Keep 'password' key for backend backwards compat
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

// ── Post Job Types ──────────────────────────────────────

export interface PostJobData {
  job_role_name: string;
  monthly_from: string;
  monthly_to: string;
  no_of_openings: string;
  working_days: string;
  open_time: string;
  close_time: string;
  shift: string;
  job_type: string;
  category_type: string;
  work_from_home_status: number;
  qualification_data: string;
  experience_data: string;
  min_exp: number;
  max_exp: number;
  gender_data: string;
  english_data: string;
  job_info: string;
}

/**
 * POST /post-job
 * Submit a new job posting
 */
export async function postJobApi(data: PostJobData): Promise<ApiResponse<{ job_id: number; job_temp_id: string }>> {
  return apiRequest<{ job_id: number; job_temp_id: string }>('/post-job', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * GET /job-roles?q=SEARCH
 * Fetch job roles for autocomplete
 */
export async function searchJobRolesApi(query: string) {
  return apiRequest<Array<{ id: number; job_category_id: number; name: string }>>(`/job-roles?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}

export async function getEmployerInfoApi(jobId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/employer-info?job_id=${jobId}`, {
    method: 'GET',
  });
}

export async function saveEmployerInfoApi(data: any): Promise<ApiResponse<any>> {
  return apiRequest<any>('/save-employer-info', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveAgreementApi(jobId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>('/approve-agreement', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

// ── Candidate Requirements Types ────────────────────────

export interface RequirementItem {
  id: number;
  name: string;
}

export interface SkillItem {
  id: number;
  name: string;
}

export interface CandidateRequirementsData {
  job_id: number;
  job_category_id: number;
  job_info: string;
  requirements: Array<{ id: number; requirement: string }>;
  selected_requirements: number[];
  skills: SkillItem[];
  selected_skills: number[];
}

export interface SaveRequirementsPayload {
  job_id: number;
  requirements: RequirementItem[];
  skills: RequirementItem[];
  job_info: string;
}

/**
 * GET /job-requirements?job_id={id}
 * Fetch requirements, skills, and existing job_info for a job posting
 */
export async function getCandidateRequirementsApi(
  jobId: number
): Promise<ApiResponse<CandidateRequirementsData>> {
  return apiRequest<CandidateRequirementsData>(`/job-requirements?job_id=${jobId}`, {
    method: 'GET',
  });
}

/**
 * POST /save-requirements
 * Save selected requirements, skills, and job description
 */
export async function saveCandidateRequirementsApi(
  payload: SaveRequirementsPayload
): Promise<ApiResponse<{ job_id: number }>> {
  return apiRequest<{ job_id: number }>('/save-requirements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── All Post Jobs APIs ──────────────────────────────────

/**
 * GET /all-jobs
 * Fetch all employer jobs (active + expired)
 */
export async function getAllJobsApi(): Promise<ApiResponse<any>> {
  return apiRequest<any>('/all-jobs', { method: 'GET' });
}

/**
 * GET /plan-info
 * Fetch employer's plan status, limits, and offers
 */
export async function getPlanInfoApi(): Promise<ApiResponse<any>> {
  return apiRequest<any>('/plan-info', { method: 'GET' });
}

/**
 * POST /update-job-status
 * Activate or expire a job
 */
export async function updateJobStatusApi(postId: number, status: number): Promise<ApiResponse<any>> {
  return apiRequest<any>('/update-job-status', {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, status }),
  });
}

/**
 * GET /job-detail?post_id=X
 * Fetch job details + candidate counts
 */
export async function getJobDetailApi(postId: number): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/job-detail?post_id=${postId}`, { method: 'GET' });
}

// All Post Jobs - Candidates Applied
export const getCandidatesApplied = async (postId: number, offset: number = 0, limit: number = 10, statusType: string = 'All') => {
  return await apiRequest<any>(
    `/candidates-applied?post_id=${postId}&offset=${offset}&limit=${limit}&status_type=${encodeURIComponent(statusType)}`,
    {
      method: "GET",
    }
  );
};

// All Post Jobs - Candidates Recommended
export const getCandidatesRecommended = async (postId: number, offset: number = 0, limit: number = 10) => {
  return await apiRequest<any>(
    `/candidates-recommended?post_id=${postId}&offset=${offset}&limit=${limit}`,
    {
      method: "GET",
    }
  );
};

// Packages
export async function getPackagesApi(): Promise<ApiResponse<any>> {
  return apiRequest<any>('/packages', { method: 'GET' });
}

// Payment - Create Order
export async function createOrderApi(packageId: number, amount: number): Promise<ApiResponse<any>> {
  return apiRequest<any>('/create-order', {
    method: 'POST',
    body: JSON.stringify({ package_id: packageId, amount }),
  });
}

// Payment - Update Status
export async function updatePaymentStatusApi(dbId: number, paymentId: string): Promise<ApiResponse<any>> {
  return apiRequest<any>('/update-payment-status', {
    method: 'POST',
    body: JSON.stringify({ db_id: dbId, payment_id: paymentId }),
  });
}
