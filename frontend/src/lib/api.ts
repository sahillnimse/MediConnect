"use client";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type Role = "patient" | "hospital" | "admin";

export interface Session {
  token: string;
  role: Role;
  name: string;
  user_id: number;
  email?: string;
}

const SESSION_KEY = "mqc_session";

// ── Session helpers (localStorage-backed) ─────────────────────────────────
export function saveSession(s: Session) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    document.cookie = `token=${s.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
  }
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    const s = getSession();
    if (s) h["Authorization"] = `Bearer ${s.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail)
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
          : body.detail;
    } catch {
      /* ignore */
    }
    // Avoid clearing session for admin‑specific endpoints – admin may need to see the UI even if a token issue occurs
    if (res.status === 401 && auth && !path.startsWith("/api/admin/")) clearSession();
    throw new ApiError(detail, res.status);
  }


  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Multipart upload (file fields) ────────────────────────────────────────
// Browsers must set the multipart boundary themselves, so this helper omits
// any Content-Type header rather than reusing api()'s JSON default.
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const h: Record<string, string> = {};
  const s = getSession();
  if (s) h["Authorization"] = `Bearer ${s.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: h,
    body: formData,
  });

  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail)
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
          : body.detail;
    } catch {
      /* ignore */
    }
    if (res.status === 401) clearSession();
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── File download (auth'd blob fetch) ─────────────────────────────────────
export async function apiDownload(path: string): Promise<Blob> {
  const h: Record<string, string> = {};
  const s = getSession();
  if (s) h["Authorization"] = `Bearer ${s.token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers: h });
  if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
  return res.blob();
}

// ── Formatting ────────────────────────────────────────────────────────────
export function inr(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}