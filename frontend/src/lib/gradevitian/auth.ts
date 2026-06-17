/** gradeVITian auth API + token storage (Bearer token in localStorage, matching the
 *  site's existing admin-token pattern). */
import { apiGet, apiRequest } from "@/lib/api/client";

export interface GVUser {
  id: number;
  name: string;
  email: string;
  username: string;
  created_at: string;
}

export interface SavedCalc {
  id: number;
  calc_type: string;
  payload: Record<string, unknown>;
  result: string;
  created_at: string;
}

export interface GVComment {
  id: number;
  name: string;
  body: string;
  created_at: string;
}

export interface GVNotification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
}

const TOKEN_KEY = "gv_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function apiSignup(input: {
  name: string; email: string; username: string; password: string;
}): Promise<{ token: string; user: GVUser }> {
  return apiRequest("/gv/auth/signup", "POST", input);
}

export async function apiLogin(input: {
  identifier: string; password: string;
}): Promise<{ token: string; user: GVUser }> {
  return apiRequest("/gv/auth/login", "POST", input);
}

export async function apiMe(token: string): Promise<{ user: GVUser }> {
  return apiGet("/gv/auth/me", token);
}

export async function apiForgotPassword(email: string): Promise<{ ok: boolean }> {
  return apiRequest("/gv/auth/forgot-password", "POST", { email });
}

export async function apiResetPassword(token: string, password: string): Promise<{ ok: boolean }> {
  return apiRequest("/gv/auth/reset-password", "POST", { token, password });
}

// ── Saved calculations ─────────────────────────────────────────────────────────

export async function apiSaveCalc(
  token: string,
  calc: { calc_type: string; payload: Record<string, unknown>; result: string },
): Promise<{ calc: SavedCalc }> {
  return apiRequest("/gv/calcs", "POST", calc, token);
}

export async function apiListCalcs(token: string): Promise<{ calcs: SavedCalc[] }> {
  return apiGet("/gv/calcs", token);
}

export async function apiDeleteCalc(token: string, id: number): Promise<{ ok: boolean }> {
  return apiRequest(`/gv/calcs/${id}`, "DELETE", undefined, token);
}

// ── Comments ────────────────────────────────────────────────────────────────

export async function apiListComments(): Promise<{ comments: GVComment[] }> {
  return apiGet("/gv/comments");
}

export async function apiAddComment(
  input: { name: string; body: string },
  token?: string | null,
): Promise<{ comment: GVComment }> {
  return apiRequest("/gv/comments", "POST", input, token ?? undefined);
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function apiListNotifications(token: string): Promise<{ notifications: GVNotification[] }> {
  return apiGet("/gv/notifications", token);
}

export async function apiReadNotification(token: string, id: number): Promise<{ ok: boolean }> {
  return apiRequest(`/gv/notifications/${id}/read`, "POST", undefined, token);
}

// ── Live calculator form state (autosave) ────────────────────────────────────

export async function apiGetCalcState<T>(token: string, calcType: string): Promise<{ payload: T | null }> {
  return apiGet(`/gv/calc-state/${calcType}`, token);
}

export async function apiPutCalcState(token: string, calcType: string, payload: unknown): Promise<{ ok: boolean }> {
  return apiRequest(`/gv/calc-state/${calcType}`, "PUT", { payload }, token);
}
