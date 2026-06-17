/**
 * Google Analytics 4 (GA4) integration.
 *
 * The Measurement ID is read from VITE_GA_MEASUREMENT_ID (e.g. "G-XXXXXXXXXX").
 * If the env var is empty, every function here is a no-op — so local/dev
 * builds without an ID simply do not send any data.
 *
 * Because the site is a React Router SPA, gtag's automatic page_view is
 * disabled (`send_page_view: false`) and we fire page_view manually on every
 * route change via <AnalyticsTracker />.
 */

const GA_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || "";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const gaEnabled = !!GA_ID;

let initialized = false;

/** Inject the gtag.js script and configure GA4. Safe to call multiple times. */
export function initGA(): void {
  if (!GA_ID || initialized || typeof window === "undefined") return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

/** Send a page_view event. Call on every route change. */
export function trackPageView(path: string, title?: string): void {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
}

/** Send a custom event with arbitrary params. */
export function trackEvent(name: string, params: Record<string, any> = {}): void {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

/**
 * Reservation conversion. Maps to GA4's recommended `purchase` event so it
 * shows up under Monetization / conversions and can be imported into Google
 * Ads as a conversion goal.
 */
export function trackReservation(opts: {
  reservationId: string;
  total: number;
  carName?: string;
  pickup?: string;
}): void {
  trackEvent("purchase", {
    transaction_id: opts.reservationId,
    value: Number.isFinite(opts.total) ? opts.total : 0,
    currency: "EUR",
    items: opts.carName
      ? [{ item_id: opts.carName, item_name: opts.carName, item_category: opts.pickup }]
      : [],
  });
}
