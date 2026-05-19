import { useEffect, useState } from "react";
import {
  buildLocationOptions,
  computeLocationFee,
  DEFAULT_FREE_LOCATIONS,
  DEFAULT_LOCATION_FEES,
  type LocationOption,
} from "../lib/locations";

// Module-level cache so multiple components on the same page don't refetch.
let cachedFees: Record<string, number> | null = null;
let cachedFree: string[] | null = null;
let inFlight: Promise<void> | null = null;

async function fetchPublicSettings(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (!res.ok) return;
      const json = await res.json();
      if (json && typeof json === "object") {
        if (json.location_fees && typeof json.location_fees === "object") {
          cachedFees = json.location_fees as Record<string, number>;
        }
        if (Array.isArray(json.free_locations)) {
          cachedFree = json.free_locations as string[];
        }
      }
    } catch {
      /* network/JSON failure — fall back to defaults */
    }
  })();
  return inFlight;
}

/**
 * Returns the unified list of pickup / drop-off locations, fees, and helpers.
 * Data is fetched once from `/api/settings/public` (which mirrors the backend
 * `LOCATION_FEES` / `FREE_LOCATIONS` constants) and cached for the page
 * lifetime. Defaults are used until the fetch resolves.
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
    if (cachedFees && cachedFree) return;
    fetchPublicSettings().then(() => {
      if (cancelled) return;
      if (cachedFees) setFees(cachedFees);
      if (cachedFree) setFree(cachedFree);
    });
    return () => {
      cancelled = true;
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
