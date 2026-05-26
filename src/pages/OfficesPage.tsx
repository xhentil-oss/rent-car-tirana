import React from "react";
import LLink from "../components/LLink";
import {
  MapPin,
  Phone,
  EnvelopeSimple,
  Clock,
  WhatsappLogo,
  NavigationArrow,
  Buildings,
} from "@phosphor-icons/react";
import { useSEO, buildLocalBusinessSchema, buildBreadcrumbSchema } from "../hooks/useSEO";

type Office = {
  badge: string;
  name: string;
  address: string;
  hours: string;
  iframeSrc: string;
  directionsUrl: string;
  phone?: string;
};

const OFFICES: Office[] = [
  {
    badge: "Aeroport",
    name: "Rio Rent — Tirana Airport",
    address: "Rruga e Aeroportit, Tiranë 1001",
    hours: "Çdo ditë · 24/7",
    iframeSrc:
      "https://www.google.com/maps?q=41.4163103,19.6752078(Rio+Rent+Tirana+Airport)&z=15&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Rio+Rent+-+Rent+Car+Tirana+Airport",
    phone: "+355697562951",
  },
  {
    badge: "Qendër",
    name: "Rio Rent — Tiranë",
    address: "Rruga 28 Nëntori, 1/3, Tiranë 1001",
    hours: "E Hënë – E Diel · 08:00 – 20:00",
    iframeSrc:
      "https://www.google.com/maps?q=41.3303371,19.7830510(Rio+Rent+Tirana)&z=16&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Rio+Rent+Tirana",
    phone: "+355697562951",
  },
];

export default function OfficesPage() {
  useSEO({
    title: "Zyrat tona — Rent Car Tirana",
    description:
      "Vizitoni zyrat tona në Tiranë: aeroporti Nënë Tereza dhe qendra (Rruga 28 Nëntori). Shih hartën, drejtimet dhe orarin e punës.",
    keywords:
      "zyrat rent car tirana, vendndodhja, harta, rio rent aeroporti, rruga 28 nentori, drejtimet",
    canonical: "/zyrat",
    structuredData: [
      buildLocalBusinessSchema(),
      buildBreadcrumbSchema([
        { name: "Kryefaqja", url: "/" },
        { name: "Zyrat", url: "/zyrat" },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold mb-5">
            <Buildings size={14} weight="fill" />
            ZYRAT TONA
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Na gjeni në Tiranë
          </h1>
          <p className="text-neutral-300 text-lg max-w-xl mx-auto">
            Dy zyra në dispozicionin tuaj — në aeroportin Nënë Tereza dhe në qendër të Tiranës. Klikoni mbi hartë për drejtimet.
          </p>
        </div>
      </div>

      {/* Office cards with maps */}
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {OFFICES.map((office) => (
            <article
              key={office.address}
              className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
                    <MapPin size={12} weight="fill" />
                    {office.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-neutral-800 mb-1">{office.name}</h2>
                <p className="text-sm text-neutral-600">{office.address}</p>
              </div>

              {/* Map */}
              <div className="h-72 bg-neutral-100">
                <iframe
                  title={office.name}
                  src={office.iframeSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Info */}
              <div className="px-6 py-5 space-y-3 border-t border-neutral-100">
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} weight="fill" className="text-primary shrink-0" />
                  <span className="text-neutral-700">{office.hours}</span>
                </div>
                {office.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} weight="fill" className="text-primary shrink-0" />
                    <a
                      href={`tel:${office.phone}`}
                      className="text-neutral-700 hover:text-primary no-underline"
                    >
                      {office.phone.replace("+355", "+355 ").replace(/(\d{2})(\d{3})(\d{4})$/, "$1 $2 $3")}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <a
                  href={office.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors no-underline"
                >
                  <NavigationArrow size={14} weight="fill" />
                  Merr drejtimet
                </a>
                {office.phone && (
                  <a
                    href={`https://wa.me/${office.phone.replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors no-underline"
                    aria-label="WhatsApp"
                  >
                    <WhatsappLogo size={16} weight="fill" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-1.5">Keni pyetje rreth marrjes / kthimit?</h3>
            <p className="text-sm text-neutral-500">
              Kontaktoni stafin tonë në çdo kohë — ofrojmë marrje falas në aeroport dhe në qendër.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LLink
              to="/kontakt"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors no-underline"
            >
              <EnvelopeSimple size={15} weight="fill" />
              Na kontaktoni
            </LLink>
            <a
              href="tel:+355697562951"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors no-underline"
            >
              <Phone size={15} weight="fill" />
              +355 69 756 2951
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
