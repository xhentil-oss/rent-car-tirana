import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Car, FacebookLogo, InstagramLogo, MapPin, Phone, EnvelopeSimple } from "@phosphor-icons/react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-900 text-white py-14 px-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline mb-4">
              <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center shrink-0">
                <Car size={20} weight="fill" className="text-white" />
              </div>
              <span className="font-semibold text-lg text-white">Rent Car <span className="text-accent">Tirana</span></span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary transition-colors no-underline">
                <FacebookLogo size={16} className="text-white" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-primary transition-colors no-underline">
                <InstagramLogo size={16} className="text-white" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t("footer.navigation")}</h3>
            <ul className="space-y-2.5">
              {[
                { label: t("footer.nav.fleet"), to: "/flota" },
                { label: t("footer.nav.book"), to: "/rezervo" },
                { label: t("footer.nav.reviews"), to: "/vleresime" },
                { label: t("footer.nav.account"), to: "/llogaria" },
                { label: t("footer.nav.sitemap"), to: "/sitemap" },
                { label: "Kontakt", to: "/kontakt" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-neutral-400 hover:text-white transition-colors no-underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SEO pages */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t("footer.services")}</h3>
            <ul className="space-y-2.5">
              {[
                { label: t("footer.seo.tirana"), to: "/makina-me-qira-tirane" },
                { label: t("footer.seo.airport"), to: "/makine-me-qira-aeroport" },
                { label: t("footer.seo.suv"), to: "/flota?kategoria=SUV" },
                { label: t("footer.seo.luxury"), to: "/flota?kategoria=Luksoze" },
                { label: t("footer.seo.automatic"), to: "/flota?transmetimi=Automatike" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-neutral-400 hover:text-white transition-colors no-underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{t("footer.contactTitle")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-neutral-400 mt-0.5 shrink-0" />
                <span className="text-sm text-neutral-400">{t("footer.address")}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-neutral-400 shrink-0" />
                <a href="tel:+355691234567" className="text-sm text-neutral-400 hover:text-white no-underline">+355 69 123 4567</a>
              </li>
              <li className="flex items-center gap-3">
                <EnvelopeSimple size={16} className="text-neutral-400 shrink-0" />
                <a href="mailto:info@rentcartiranaairport.com" className="text-sm text-neutral-400 hover:text-white no-underline">{t("footer.email")}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust + Payment strip */}
        <div className="border-t border-neutral-800 pt-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <span className="text-xs text-neutral-400">
                <span className="font-semibold text-neutral-200">4.9 / 5</span> {t("footer.trustRating")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 mr-1">{t("footer.accepts")}</span>
              {["VISA", "MC", "Cash", "Bank"].map((m) => (
                <span key={m} className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-semibold text-neutral-300">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Rent Car Tirana. {t("footer.rights")}</p>
          <div className="flex gap-4">
            <Link to="/privatesie" className="text-xs text-neutral-500 hover:text-neutral-300 no-underline">{t("footer.privacy")}</Link>
            <Link to="/termat-e-sherbimit" className="text-xs text-neutral-500 hover:text-neutral-300 no-underline">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
