import { useEffect, useState } from "react";
import {
  buildLocationOptions,
  computeLocationFee,
  DEFAULT_FREE_LOCATIONS,
  DEFAULT_LOCATION_FEES,
  type LocationOption,
} from "../lib/locations";

// ─── Persistent + module-level cache ──────────────────────────────────────
// Strategy: defaults are the FLOOR — the dropdown never falls below them.
// The API response is merged on top: it can add new locations or update
// prices, but it cannot remove a default location. This guarantees the
// pickup/dropoff dropdown ALWAYS shows the full set even when:
//   - API is slow / down
//   - API returns a partial response
//   - Browser cached an old bundle
//   - Admin accidentally cleared a setting
//
// Last-good response is mirrored to localStorage so subsequent page loads
// hydrate with the full data BEFORE the network round-trip resolves.

const STORAGE_KEY = "rct_locations_v1";

interface CachedShape {
  fees: Record<string, number>;
  free: string[];
  fetchedAt: number;
}

function readLocalStorageCache(): CachedShape | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.fees && typeof parsed.fees === "object" &&
      Array.isArray(parsed.free)
    ) {
      return parsed as CachedShape;
    }
  } catch {
    /* ignore corrupted localStorage */
  }
  return null;
}

function writeLocalStorageCache(fees: Record<string, number>, free: string[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fees, free, fetchedAt: Date.now() }));
  } catch {
    /* quota exceeded / disabled — ignore */
  }
}

// Merge API response over defaults — defaults are the floor, API additions
// or price overrides win.
function mergeFees(apiFees: Record<string, number> | null | undefined): Record<string, number> {
  const merged: Record<string, number> = { ...DEFAULT_LOCATION_FEES };
  if (apiFees && typeof apiFees === "object") {
    for (const [k, v] of Object.entries(apiFees)) {
      const num = Number(v);
      if (Number.isFinite(num) && num >= 0 && k) merged[k.trim()] = num;
    }
  }
  return merged;
}

function mergeFree(apiFree: string[] | null | undefined): string[] {
  const merged = new Set<string>(DEFAULT_FREE_LOCATIONS);
  if (Array.isArray(apiFree)) {
    for (const v of apiFree) {
      if (typeof v === "string" && v.trim()) merged.add(v.trim());
    }
  }
  return Array.from(merged);
}

// Seed module-level cache from localStorage immediately so the very first
// render after a fresh tab open already has the last-known values.
const seed = readLocalStorageCache();
let cachedFees: Record<string, number> = mergeFees(seed?.fees);
let cachedFree: string[] = mergeFree(seed?.free);
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try { cb(); } catch { /* ignore subscriber errors */ }
  });
}

async function fetchPublicSettings(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/settings/public", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && typeof json === "object") {
        // Always merge with defaults — never lose a built-in location.
        cachedFees = mergeFees(json.location_fees);
        cachedFree = mergeFree(json.free_locations);
        writeLocalStorageCache(cachedFees, cachedFree);
        notifySubscribers();
      }
    } catch {
      // Network/JSON failure — defaults remain in cachedFees/cachedFree;
      // dropdown still shows the full default set.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Returns the unified list of pickup / drop-off locations, fees, and helpers.
 *
 * Guarantees:
 *   - First render is ALWAYS populated (defaults or last localStorage cache)
 *   - API additions/overrides appear once the fetch resolves
 *   - Default locations are NEVER removed by the API response
 *   - Subscribers re-render automatically when cache updates
 */
export function useLocations(lang: "sq" | "en" = "sq") {
  const [fees, setFees] = useState<Record<string, number>>(cachedFees);
  const [free, setFree] = useState<string[]>(cachedFree);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      setFees(cachedFees);
      setFree(cachedFree);
    };

    subscribers.add(sync);
    fetchPublicSettings().then(sync);

    return () => {
      cancelled = true;
      subscribers.delete(sync);
    };
  }, []);

  const options: LocationOption[] = buildLocationOptions(fees, free, lang);

  return {
    fees,
    free,
    options,
    /** Default starting value for a fresh form (first free location). */
    defaultLocation: free[0] || options[0]?.value || "",
    computeFee: (pickup: string, dropoff: string) =>
      computeLocationFee(pickup, dropoff, fees),
  };
}
