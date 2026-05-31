import { useEffect, useState } from "react";
import {
  buildLocationOptions,
  computeLocationFee,
  DEFAULT_FREE_LOCATIONS,
  DEFAULT_LOCATION_FEES,
  type LocationOption,
} from "../lib/locations";

// Module-level cache so multiple components on the same page don't refetch.
// `loaded` flips to true only after a SUCCESSFUL fetch — failed/empty responses
// reset `inFlight` so the next mount can retry instead of being locked out.
let cachedFees: Record<string, number> | null = null;
let cachedFree: string[] | null = null;
let loaded = false;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try { cb(); } catch { /* ignore subscriber errors */ }
  });
}

async function fetchPublicSettings(): Promise<void> {
  if (loaded) return; // already have good data
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/settings/public", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && typeof json === "object") {
        let gotData = false;
        if (json.location_fees && typeof json.location_fees === "object" && Object.keys(json.location_fees).length > 0) {
          cachedFees = json.location_fees as Record<string, number>;
          gotData = true;
        }
        if (Array.isArray(json.free_locations) && json.free_locations.length > 0) {
          cachedFree = json.free_locations as string[];
          gotData = true;
        }
        if (gotData) {
          loaded = true;
          notifySubscribers();
        }
      }
    } catch {
      // Network/JSON failure — leave `loaded = false` so we retry next mount.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Returns the unified list of pickup / drop-off locations, fees, and helpers.
 * Data is fetched from `/api/settings/public` and cached for the session;
 * subscribers are notified when the cache updates so every component using
 * this hook re-renders with fresh data (fixes the "dropdown sometimes empty"
 * race condition).
 */
export function useLocations(lang: "sq" | "en" = "sq") {
  const [fees, setFees] = useState<Record<string, number>>(
    cachedFees || DEFAULT_LOCATION_FEES,
  );
  const [free, setFree] = useState<string[]>(
    cachedFree || DEFAULT_FREE_LOCATIONS,
  );

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      if (cachedFees) setFees(cachedFees);
      if (cachedFree) setFree(cachedFree);
    };

    // Subscribe so we pick up cache updates from other instances / late fetches.
    subscribers.add(sync);

    if (!loaded) {
      fetchPublicSettings().then(sync);
    } else {
      sync();
    }

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
