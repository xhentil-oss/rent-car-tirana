export const LANGS = ["sq", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "sq";

// Albanian path → English path mapping
const SQ_TO_EN: Record<string, string> = {
  "/":                          "/en",
  "/flota":                     "/en/fleet",
  "/rezervo":                   "/en/book",
  "/faleminderit":              "/en/thank-you",
  "/llogaria":                  "/en/my-account",
  "/vleresime":                 "/en/reviews",
  "/makina-me-qira-tirane":     "/en/car-rental-tirana",
  "/makine-me-qira-aeroport":   "/en/airport-car-rental",
  "/makina-suv-me-qira":        "/en/suv-car-rental",
  "/makina-automatike-me-qira": "/en/automatic-car-rental",
  "/makina-luksoze-me-qira":    "/en/luxury-car-rental",
  "/sitemap":                   "/en/sitemap",
  "/kontakt":                   "/en/contact",
  "/termat-e-sherbimit":        "/en/terms",
  "/privatesie":                "/en/privacy",
  "/blog":                      "/en/blog",
};

// Reverse: English path → Albanian path
const EN_TO_SQ: Record<string, string> = {};
for (const [sq, en] of Object.entries(SQ_TO_EN)) {
  EN_TO_SQ[en] = sq;
}

// Dynamic prefix pairs: [sqPrefix, enPrefix]
const DYNAMIC_PREFIXES: [string, string][] = [
  ["/makina/", "/en/car/"],
  ["/blog/", "/en/blog/"],
];

/** Detect language from pathname */
export function detectLang(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "sq";
}

/** Translate an Albanian path to the target language. Admin paths pass through unchanged. */
export function localePath(sqPath: string, lang: Lang): string {
  if (lang === "sq") return sqPath;
  if (sqPath.startsWith("/admin")) return sqPath;

  const [pathname, ...rest] = sqPath.split("?");
  const qs = rest.length ? "?" + rest.join("?") : "";

  // Exact match
  if (SQ_TO_EN[pathname]) return SQ_TO_EN[pathname] + qs;

  // Dynamic prefix match
  for (const [sqPfx, enPfx] of DYNAMIC_PREFIXES) {
    if (pathname.startsWith(sqPfx)) {
      return enPfx + pathname.slice(sqPfx.length) + qs;
    }
  }

  // Fallback: prepend /en
  return "/en" + sqPath;
}

/** Convert any path (sq or en) to the target language */
export function switchPath(currentPath: string, fromLang: Lang, toLang: Lang): string {
  if (fromLang === toLang) return currentPath;

  const [pathname, ...rest] = currentPath.split("?");
  const qs = rest.length ? "?" + rest.join("?") : "";

  // First convert to Albanian
  let sqPath = pathname;
  if (fromLang === "en") {
    if (EN_TO_SQ[pathname]) {
      sqPath = EN_TO_SQ[pathname];
    } else {
      for (const [sqPfx, enPfx] of DYNAMIC_PREFIXES) {
        if (pathname.startsWith(enPfx)) {
          sqPath = sqPfx + pathname.slice(enPfx.length);
          break;
        }
      }
      if (sqPath === pathname) {
        // Unknown en route — strip /en prefix
        sqPath = pathname.replace(/^\/en/, "") || "/";
      }
    }
  }

  if (toLang === "sq") return sqPath + qs;
  return localePath(sqPath + qs, "en");
}

/** Get the alternate language path for hreflang (from current pathname) */
export function getAlternatePath(pathname: string, lang: Lang): { sq: string; en: string } {
  const sqPath = lang === "sq" ? pathname : switchPath(pathname, "en", "sq");
  const enPath = lang === "en" ? pathname : switchPath(pathname, "sq", "en");
  return { sq: sqPath, en: enPath };
}
