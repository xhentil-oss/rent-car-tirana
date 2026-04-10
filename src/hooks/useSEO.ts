import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: "website" | "article" | "product";
  structuredData?: object | object[];
}

const SITE_NAME = "Rent Car Tirana";
const DEFAULT_OG_IMAGE = "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1200&q=80";
const SITE_URL = "https://rentcartiranaairport.com";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setStructuredData(id: string, data: object | object[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(Array.isArray(data) ? data : data);
}

export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  ogType = "website",
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = `${title} | ${SITE_NAME}`;

    // Meta description
    setMeta("description", description);

    // Keywords
    if (keywords) setMeta("keywords", keywords);

    // Robots
    setMeta("robots", "index, follow");

    // Canonical
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : `${SITE_URL}${window.location.pathname}`;
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("og:title", `${title} | ${SITE_NAME}`, true);
    setMeta("og:description", description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:image:width", String(ogImageWidth), true);
    setMeta("og:image:height", String(ogImageHeight), true);
    if (ogImageAlt) setMeta("og:image:alt", ogImageAlt, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", "sq_AL", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${title} | ${SITE_NAME}`);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage);
    if (ogImageAlt) setMeta("twitter:image:alt", ogImageAlt);

    // Structured Data
    if (structuredData) {
      setStructuredData("structured-data-dynamic", structuredData);
    }

    return () => {
      // Cleanup structured data on unmount to avoid stale schemas
      const el = document.getElementById("structured-data-dynamic");
      if (el) el.remove();
    };
  }, [title, description, keywords, canonical, ogImage, ogType, structuredData]);
}

// Pre-built structured data generators
export const buildLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Rent Car Tirana",
  "description": "Shërbimi nr.1 i makinave me qira në Tiranë. Rezervo online, merr makinën nga qendra ose aeroporti.",
  "url": SITE_URL,
  "telephone": "+355691234567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Ruga Myslym Shyri",
    "addressLocality": "Tiranë",
    "addressCountry": "AL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "41.3275",
    "longitude": "19.8187"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  },
  "priceRange": "€€",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "500",
    "bestRating": "5"
  },
  "sameAs": [
    "https://wa.me/355691234567"
  ]
});

export const buildCarProductSchema = (car: {
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  image: string;
  slug: string;
  fuel: string;
  transmission: string;
  seats: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": `${car.brand} ${car.model} (${car.year})`,
  "description": `Makinë me qira ${car.brand} ${car.model} ${car.year} kategoria ${car.category}. ${car.transmission}, ${car.fuel}, ${car.seats} vende. Disponueshme në Tiranë.`,
  "image": [
    {
      "@type": "ImageObject",
      "url": car.image,
      "name": `${car.brand} ${car.model} ${car.year} - Makina me qira Tiranë`,
      "description": `Foto ${car.brand} ${car.model} ${car.year} kategoria ${car.category} me qira Tiranë`,
      "width": "1200",
      "height": "800",
      "representativeOfPage": true
    }
  ],
  "brand": {
    "@type": "Brand",
    "name": car.brand
  },
  "offers": {
    "@type": "Offer",
    "price": car.pricePerDay,
    "priceCurrency": "EUR",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": car.pricePerDay,
      "priceCurrency": "EUR",
      "unitText": "DAY"
    },
    "availability": "https://schema.org/InStock",
    "url": `${SITE_URL}/makina/${car.slug}`
  },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Transmisioni", "value": car.transmission },
    { "@type": "PropertyValue", "name": "Karburanti", "value": car.fuel },
    { "@type": "PropertyValue", "name": "Vendesh", "value": String(car.seats) }
  ]
});

/**
 * Builds an ImageObject schema for a standalone image (gallery, media, etc.)
 */
export const buildImageObjectSchema = ({
  url,
  name,
  description,
  width = 1200,
  height = 800,
}: {
  url: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "url": url,
  "name": name,
  "description": description ?? name,
  "width": String(width),
  "height": String(height),
  "encodingFormat": "image/jpeg",
  "license": `${SITE_URL}/terms`,
  "creator": {
    "@type": "Organization",
    "name": "Rent Car Tirana",
    "url": SITE_URL
  }
});

export const buildFAQSchema = (items: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": items.map((item) => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});

export const buildBreadcrumbSchema = (crumbs: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": crumbs.map((c, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": c.name,
    "item": `${SITE_URL}${c.url}`
  }))
});
