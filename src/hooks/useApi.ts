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
  PricingRule: "/pricing-rules",
  UserAdminProfile: "/users",
  Invoice: "/invoices",
  ActivityLog: "/activity-logs",
  MaintenanceRecord: "/fleet/maintenance",
  InsuranceRecord: "/fleet/insurance",
  RegistrationRecord: "/fleet/registration",
  FuelLog: "/fleet/fuel",
  DamageReport: "/fleet/damage",
  ChatMessage: "/chat",
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

function buildQuery(filters?: Record<string, unknown>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.where) params.set("where", JSON.stringify(filters.where));
  if (filters.orderBy) params.set("orderBy", JSON.stringify(filters.orderBy));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString() ? `?${params.toString()}` : "";
}

// ─── useQuery ──────────────────────────────────────────────────
export function useQuery(entity: string, filters?: Record<string, unknown>) {
  const [data, setData] = useState<any[] | undefined>(undefined);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = ENTITY_MAP[entity] || `/${entity.toLowerCase()}s`;

  const refetch = useCallback(() => {
    setIsPending(true);
    const qs = buildQuery(filters);
    fetch(`${API_BASE}${endpoint}${qs}`, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : json.data ?? json.items ?? [json]);
        setError(null);
      })
      .catch((err) => {
        console.warn(`useQuery(${entity}):`, err.message);
        setData([]);
        setError(err.message);
      })
      .finally(() => setIsPending(false));
  }, [entity, JSON.stringify(filters)]);

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
    const res = await fetch(`${API_BASE}${endpoint}${qs}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? json.items ?? [json];
  }, [entity]);

  return { query };
}

// ─── useMutation ───────────────────────────────────────────────
export function useMutation(entity: string) {
  const endpoint = ENTITY_MAP[entity] || `/${entity.toLowerCase()}s`;

  const create = useCallback(async (data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `${res.status}`);
    }
    return res.json();
  }, [entity]);

  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}${endpoint}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `${res.status}`);
    }
    return res.json();
  }, [entity]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}${endpoint}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `${res.status}`);
    }
    return res.json();
  }, [entity]);

  return { create, update, remove };
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
      // Redirect to admin login or show prompt
      window.location.hash = "#/admin";
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

  const logout = useCallback(() => {
    localStorage.removeItem("rct_token");
    localStorage.removeItem("rct_refresh_token");
    localStorage.removeItem("rct_user");
    setUser(null);
    setIsAnonymous(true);
    window.location.hash = "#/";
  }, []);

  return { user, isPending, isAnonymous, login, logout };
}
