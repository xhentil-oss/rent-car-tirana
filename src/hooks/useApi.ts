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
};

function getToken(): string | null {
  return localStorage.getItem("rct_token");
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Token refresh mutex — prevents concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem("rct_refresh_token");
  if (!refreshToken) return null;
  try {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      localStorage.setItem("rct_token", data.accessToken);
      localStorage.setItem("rct_refresh_token", data.refreshToken);
      return data.accessToken;
    }
  } catch { /* refresh failed */ }
  // Refresh failed — clear session
  localStorage.removeItem("rct_token");
  localStorage.removeItem("rct_refresh_token");
  localStorage.removeItem("rct_user");
  return null;
}

async function fetchWithRefresh(url: string, options: RequestInit): Promise<Response> {
  let res = await fetch(url, options);
  if (res.status === 401) {
    // Use mutex to prevent concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      const newHeaders = { ...options.headers } as Record<string, string>;
      newHeaders["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers: newHeaders });
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
  // Support single-entity fetch: useQuery("Car", "uuid") → GET /api/cars/uuid
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
    const url = entityId
      ? `${API_BASE}${endpoint}/${entityId}`
      : `${API_BASE}${endpoint}${buildQuery(filters)}`;
    fetchWithRefresh(url, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (isIdFetch) {
          // Single entity: return the object directly
          setData(Array.isArray(json) ? json[0] ?? null : json);
        } else {
          setData(Array.isArray(json) ? json : json.data ?? json.items ?? [json]);
        }
        setError(null);
      })
      .catch((err) => {
        console.warn(`useQuery(${entity}):`, err.message);
        setData(isIdFetch ? null : []);
        setError(err.message);
      })
      .finally(() => setIsPending(false));
  }, [entity, isIdFetch ? entityId : JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
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

  // Check for existing session on mount
  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem("rct_user");
    if (token && stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        setIsAnonymous(false);
      } catch {
        localStorage.removeItem("rct_token");
        localStorage.removeItem("rct_user");
      }
    }
    setIsPending(false);
  }, []);

  const login = useCallback(async (email?: string, password?: string) => {
    if (!email || !password) {
      window.location.href = "/admin";
      return;
    }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("rct_token", data.accessToken);
    localStorage.setItem("rct_refresh_token", data.refreshToken);
    localStorage.setItem("rct_user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAnonymous(false);
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.errors) throw new Error(err.errors.map((e: any) => e.msg).join(", "));
      throw new Error(err.error || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("rct_token", data.accessToken);
    localStorage.setItem("rct_refresh_token", data.refreshToken);
    localStorage.setItem("rct_user", JSON.stringify(data.user));
    setUser(data.user);
    setIsAnonymous(false);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("rct_token");
    localStorage.removeItem("rct_refresh_token");
    localStorage.removeItem("rct_user");
    setUser(null);
    setIsAnonymous(true);
    window.location.href = "/";
  }, []);

  return { user, isPending, isAnonymous, login, register, logout };
}
