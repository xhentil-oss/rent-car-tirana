import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initGA, trackPageView, loadAnalyticsConfig } from "../lib/analytics";
import { trackPageview as trackPageviewFP } from "../lib/track";

/**
 * Loads admin-configured IDs (DB), boots GA4/Ads once, and reports a page_view
 * on every SPA route change. Renders nothing. Must live inside <BrowserRouter>.
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  const bootedRef = useRef(false);

  // Mount: fetch runtime config first, then init GA and fire the landing view
  // (both GA4 and first-party). Subsequent navigations are handled below.
  useEffect(() => {
    loadAnalyticsConfig().then(() => {
      initGA();
      const path = window.location.pathname + window.location.search;
      trackPageView(path);
      trackPageviewFP(path);
      bootedRef.current = true;
    });
  }, []);

  // Route changes after the initial boot — skip the first run so the landing
  // page isn't counted twice.
  useEffect(() => {
    if (!bootedRef.current) return;
    const path = location.pathname + location.search;
    trackPageView(path);
    trackPageviewFP(path);
  }, [location.pathname, location.search]);

  return null;
}
