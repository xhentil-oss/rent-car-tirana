/**
 * Custom hooks to replace @animaapp/playground-react-sdk
 * Maps entity names to our backend API endpoints
 */
import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api";

// Map Anima entity names to our API endpoints
const ENTITY_MAP: Record<string, string> = {
  Car: "/cars",
  Reservation: "/reservations",
  Customer: "/customers",
  Review: "/reviews",
  ReviewAdmin: "/reviews/admin",
  PricingRule: "/pricing-rules",
  PricingRuleAdmin: "/pricing-rules/admin",
  MonthlyRate: "/monthly-rates",
  MonthlyRatePublic: "/monthly-rates/public",
  UserAdminProfile: "/users",
  Invoice: "/invoices",
  ActivityLog: "/activity-logs",
  MaintenanceRecord: "/fleet/maintenance",
  InsuranceRecord: "/fleet/insurance",
  RegistrationRecord: "/fleet/registration",
  FuelLog: "/fleet/fuel",
  DamageReport: "/fleet/damage",
  ChatMessage: "/chat",
  Setting: "/settings",
  ReservationAvailability: "/reservations/availability",
  BlogPost: "/blog",
  BlogPostAdmin: "/blog/admin",
  CustomerDocument: "/customer-documents",
  CommunicationLog: "/communication-logs",
  Deposit: "/deposits",
  GoogleReview: "/google-reviews",
};

// Cookies are sent automatically — only Content-Type needed
function getHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// Token refresh mutex — prevents concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  const opts = { ...options, credentials: "include" as RequestCredentials };
  let res = await fetch(url, opts);
  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      res = await fetch(url, opts);
    }
  }
  return res;
}

function buildQuery(filters?: Record<string, unknown>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.where && typeof filters.where === "object") {
    for (const [k, v] of Object.entries(filters.where as Record<string, unknown>)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
  }
  if (filters.orderBy) params.set("orderBy", JSON.stringify(filters.orderBy));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString() ? `?${params.toString()}` : "";
}

// ─── useQuery ──────────────────────────────────────────────────
export function useQuery(entity: string, filtersOrId?: Record<string, unknown> | string) {
  const isIdFetch = typeof filtersOrId === "string";
  const filters = isIdFetch ? undefined : filtersOrId;
  const entityId = isIdFetch ? filtersOrId : undefined;
  const skip = !!filters?.skip;
  const [data, setData] = useState<any>(undefined);
  const [isPending, setIsPending] = useState(!skip && !(isIdFetch && !entityId));
  const [error, setError] = useState<string | null>(null);

  const endpoint = ENTITY_MAP[entity] || `/${entity.toLowerCase()}s`;

  const refetch = useCallback(() => {
    if (skip) { setData(isIdFetch ? null : []); setIsPending(false); return; }
    setIsPending(true);
    const controller = new AbortController();
    const url = entityId
      ? `${API_BASE}${endpoint}/${entityId}`
      : `${API_BASE}${endpoint}${buildQuery(filters)}`;
    fetchWithRefresh(url, { headers: getHeaders(), cache: 'no-store', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        if (isIdFetch) {
          setData(Array.isArray(json) ? json[0] ?? null : json);
        } else {
          setData(Array.isArray(json) ? json : json.data ?? json.items ?? [json]);
        }
        setError(null);
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        console.warn(`useQuery(${entity}):`, err.message);
        setData(isIdFetch ? null : []);
        setError(err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setIsPending(false); });

    // Return cleanup so useEffect can abort on unmount/refetch
    (refetch as any)._cleanup = () => controller.abort();
  }, [entity, isIdFetch, isIdFetch ? entityId : JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
    return () => { (refetch as any)._cleanup?.(); };
  }, [refetch]);

  return { data, isPending, error, refetch };
}

// ─── useLazyQuery ──────────────────────────────────────────────
export function useLazyQuery(entity: string) {
  const endpoint = ENTITY_MAP[entity] || `/${entity.toLowerCase()}s`;

  const query = useCallback(async (filters?: Record<string, unknown>) => {
    const qs = buildQuery(filters);
    const res = await fetchWithRefresh(`${API_BASE}${endpoint}${qs}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? json.items ?? [json];
  }, [entity]);

  return { query };
}

// ─── useMutation ───────────────────────────────────────────────
export function useMutation(entity: string) {
  const endpoint = ENTITY_MAP[entity] || `/${entity.toLowerCase()}s`;
  const [isPending, setIsPending] = useState(false);

  const create = useCallback(async (data: Record<string, unknown>) => {
    setIsPending(true);
    try {
      const res = await fetchWithRefresh(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `${res.status}`);
      }
      return res.json();
    } finally {
      setIsPending(false);
    }
  }, [entity]);

  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    setIsPending(true);
    try {
      const res = await fetchWithRefresh(`${API_BASE}${endpoint}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status}`);
      }
      return res.json();
    } finally {
      setIsPending(false);
    }
  }, [entity]);

  const remove = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      const res = await fetchWithRefresh(`${API_BASE}${endpoint}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status}`);
      }
      return res.json();
    } finally {
      setIsPending(false);
    }
  }, [entity]);

  return { create, update, remove, isPending };
}

// ─── useAuth ───────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Restore user from localStorage immediately (fast), then verify with server in background
  useEffect(() => {
    const stored = localStorage.getItem("rct_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setIsAnonymous(false);
      } catch {
        localStorage.removeItem("rct_user");
      }
    }
    setIsPending(false);

    // Background session verify — syncs with server cookie state
    fetchWithRefresh(`${API_BASE}/auth/me`, {})
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          localStorage.setItem("rct_user", JSON.stringify(data.user));
          setUser(data.user);
          setIsAnonymous(false);
        } else {
          // Cookie expired or revoked — clear stale local state
          localStorage.removeItem("rct_user");
          setUser(null);
          setIsAnonymous(true);
        }
      })
      .catch(() => { /* network error — keep current local state */ });
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    if (!email || !password) {
      window.location.href = "/admin";
      return;
    }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login dështoi");
    }
    const data = await res.json();
    // 2FA required — return as-is so the caller can show OTP input
    if (data.requires2fa) return data;

    localStorage.setItem("rct_user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAnonymous(false);
    return data.user;
  }, []);

  const loginWith2FA = useCallback(async (tempToken: string, otp: string) => {
    const res = await fetch(`${API_BASE}/auth/login-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tempToken, otp }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "2FA dështoi");
    }
    const data = await res.json();
    localStorage.setItem("rct_user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAnonymous(false);
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.errors) throw new Error(err.errors.map((e: any) => e.msg).join(", "));
      throw new Error(err.error || "Regjistrimi dështoi");
    }
    const data = await res.json();
    localStorage.setItem("rct_user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAnonymous(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { /* ignore network errors during logout */ }
    localStorage.removeItem("rct_user");
    setUser(null);
    setIsAnonymous(true);
    window.location.href = "/";
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Kërkesa dështoi");
    }
    return res.json();
  }, []);

  return { user, isPending, isAnonymous, login, loginWith2FA, register, logout, forgotPassword };
}
