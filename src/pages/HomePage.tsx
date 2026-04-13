import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LLink from "../components/LLink";
import { useLocale } from "../hooks/useLocale";
import { useTranslation } from "react-i18next";
import { useSEO, buildLocalBusinessSchema, buildFAQSchema } from "../hooks/useSEO";
import {
  MapPin,
  CalendarBlank,
  Car,
  ShieldCheck,
  Clock,
  CurrencyDollar,
  Star,
  Phone,
  WhatsappLogo,
  ArrowRight,
  CheckCircle,
  Users,
  Airplane,
  Headset,
  Tag,
  CreditCard,
  Key,
  SealCheck,
  Lightning,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "../hooks/useApi";
import CarCard from "../components/CarCard";
import FAQAccordion from "../components/FAQAccordion";
import Footer from "../components/Footer";

const whyUsIcons = [CurrencyDollar, Clock, ShieldCheck, MapPin];
const howItWorksIcons = [Car, CalendarBlank, Key];
const trustStatsValues = [
  { value: "500+", icon: Users, key: "clients" },
  { value: "4.9★", icon: Star, key: "rating" },
  { value: "24/7", icon: Headset, key: "support" },
  { value: "2", icon: Airplane, key: "locations" },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();

  const faqItems = (t("home.faq.items", { returnObjects: true }) as { question: string; answer: string }[]);
  const categories = [
    { key: "ekonomike", icon: Car, dbName: "Ekonomike" },
    { key: "suv", icon: Car, dbName: "SUV" },
    { key: "luksoze", icon: Car, dbName: "Luksoze" },
    { key: "familjare", icon: Car, dbName: "Familjare" },
    { key: "automatike", icon: Car, dbName: "Automatike" },
  ];
  const whyUsItems = (t("home.whyUs.items", { returnObjects: true }) as { title: string; desc: string }[]);
  const howItWorksSteps = (t("home.howItWorks.steps", { returnObjects: true }) as { title: string; desc: string }[]);
  const guarantees = (t("home.guarantees", { returnObjects: true }) as { title: string; desc: string }[]);
  const guaranteeIcons = [SealCheck, CreditCard, ShieldCheck];
  const guaranteeColors = [
    { color: "text-primary", bg: "bg-primary/10" },
    { color: "text-success", bg: "bg-success/10" },
    { color: "text-accent", bg: "bg-accent/10" },
  ];

  useSEO({
    title: "Makina me Qira Tiranë — Rezervo Online",
    description: "Shërbimi nr.1 i makinave me qira në Tiranë. Rezervo online, merr makinën nga aeroporti ose qendra. Çmime transparente nga €25/ditë. Disponueshëm 24/7.",
    keywords: "makina me qira tirane, rent a car tirana, makine me qira shqiperi, makinë me qira aeroport tirana",
    canonical: "/",
    structuredData: [
      buildLocalBusinessSchema(),
      buildFAQSchema(faqItems),
    ],
  });

  const navigate = useNavigate();
  const { localePath } = useLocale();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [promoDismissed, setPromoDismissed] = useState(false);

  const { data: allCars } = useQuery("Car");
  const [featuredCarIds, setFeaturedCarIds] = useState<string[]>([]);
  const [bannerHero, setBannerHero] = useState("https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1200&q=80");
  const [bannerAbout, setBannerAbout] = useState("https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80");

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => {
        const ids = (data.homepage_featured_cars || "")
          .split(",")
          .filter(Boolean);
        setFeaturedCarIds(ids);
        if (data.banner_hero) setBannerHero(data.banner_hero);
        if (data.banner_about) setBannerAbout(data.banner_about);
      })
      .catch(() => {});
  }, []);

  const featuredCars = allCars
    ? featuredCarIds.length > 0
      ? allCars.filter((c: any) => featuredCarIds.includes(String(c.id)))
      : allCars
    : [];

  const { data: dbReviews } = useQuery("Review", {
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    limit: 3,
  });

  const testimonials: { name: string; rating: number; text: string; location: string }[] = [
    { name: "Arta Hoxha", rating: 5, text: "Shërbim i shkëlqyer! Makina ishte e pastër dhe në gjendje perfekte. Do ta rekomandoj me siguri!", location: "Tiranë" },
    { name: "Erjon Basha", rating: 5, text: "Procesi i rezervimit ishte shumë i thjeshtë dhe i shpejtë. Ekipi ishte shumë profesional dhe i dobishëm.", location: "Durrës" },
    { name: "Mirela Koci", rating: 5, text: "Çmimet janë shumë të arsyeshme dhe shërbimi është i nivelit të lartë. Do të rezervoj përsëri!", location: "Vlorë" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    navigate(localePath(`/flota?${params.toString()}`));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Floating WhatsApp Button ─────────────────────────────── */}
      <a
        href="https://wa.me/355697562951?text=Përshëndetje!%20Dëshiroj%20të%20rezervoj%20një%20makinë."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Kontaktoni ne WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 no-underline group px-4 py-3"
      >
        <WhatsappLogo size={22} weight="fill" />
        <span className="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Na kontaktoni
        </span>
      </a>

      {/* ── Promo Banner ─────────────────────────────────────────── */}
      {!promoDismissed && (
        <div className="bg-gradient-to-r from-accent/90 to-primary text-white py-2.5 px-4 text-center relative">
          <p className="text-sm font-medium">
            <Tag size={14} weight="fill" className="inline mr-1.5 -mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: t("home.promoBanner") }} />{" "}
            <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-xs tracking-wide">TIRANA10</span>
          </p>
          <button
            onClick={() => setPromoDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            aria-label="Mbyll"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section
        className="relative min-h-[600px] flex items-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0">
          <img
            src={bannerHero}
            alt="Rental car in Tirana city street"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-neutral-900/70" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl mb-10">
            <h1
              id="hero-heading"
              className="text-4xl md:text-5xl font-medium text-white mb-4 leading-tight"
            >
              {t("home.hero.title")}
              <br />
              <span className="text-accent">{t("home.hero.titleHighlight")}</span>
            </h1>
            <p className="text-lg text-neutral-200 leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 max-w-4xl">
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <div className="lg:col-span-1">
                <label htmlFor="pickup" className="block text-xs font-medium text-neutral-600 mb-1.5">
                  {t("home.hero.pickupFrom")}
                </label>
                <div className="relative">
                  <MapPin size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <select
                    id="pickup"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                  >
                    <option value="">{t("home.hero.selectPlace")}</option>
                    <option value="Tiranë Qendër">{t("home.hero.centerTirana")}</option>
                    <option value="Aeroporti">{t("home.hero.airport")}</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <label htmlFor="dropoff" className="block text-xs font-medium text-neutral-600 mb-1.5">
                  {t("home.hero.returnTo")}
                </label>
                <div className="relative">
                  <MapPin size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <select
                    id="dropoff"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                  >
                    <option value="">{t("home.hero.selectPlace")}</option>
                    <option value="Tiranë Qendër">{t("home.hero.centerTirana")}</option>
                    <option value="Aeroporti">{t("home.hero.airport")}</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <label htmlFor="startDate" className="block text-xs font-medium text-neutral-600 mb-1.5">
                  {t("home.hero.departureDate")}
                </label>
                <div className="relative">
                  <CalendarBlank size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <label htmlFor="endDate" className="block text-xs font-medium text-neutral-600 mb-1.5">
                  {t("home.hero.returnDate")}
                </label>
                <div className="relative">
                  <CalendarBlank size={16} weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div className="lg:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2"
                >
                  <Car size={16} weight="regular" />
                  {t("home.hero.searchBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Trust Stats Bar (à la Hertz/Sixt) ───────────────────── */}
      <section className="bg-white border-b border-border py-5 px-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustStatsValues.map((stat) => (
              <div key={stat.key} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <stat.icon size={20} weight="regular" className="text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900 leading-none">{stat.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t(`home.trustStats.${stat.key}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section
        className="py-16 px-6 bg-background"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="featured-heading" className="text-3xl font-medium text-neutral-900">
                {t("home.featuredCars.title")}
              </h2>
              <p className="text-neutral-500 mt-1">{t("home.featuredCars.subtitle")}</p>
            </div>
            <LLink to="/flota" className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-200 no-underline">
              {t("home.featuredCars.viewAll")}
              <ArrowRight size={16} weight="regular" />
            </LLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredCars.map((car, i) => (
              <div key={car.id} className={`animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                <CarCard car={car} />
              </div>
            ))}
          </div>

          <div className="mt-6 md:hidden text-center">
            <LLink to="/flota" className="inline-flex items-center gap-2 text-sm font-medium text-primary no-underline">
              {t("home.featuredCars.viewAll")}
              <ArrowRight size={16} weight="regular" />
            </LLink>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section
        className="py-16 px-6 bg-secondary"
        aria-labelledby="categories-heading"
      >
        <div className="max-w-[1440px] mx-auto">
          <h2 id="categories-heading" className="text-3xl font-medium text-neutral-900 mb-2 text-center">
            {t("home.categories.title")}
          </h2>
          <p className="text-neutral-500 text-center mb-10">{t("home.categories.subtitle")}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <LLink
                key={cat.key}
                to={`/flota?kategoria=${cat.dbName}`}
                className="bg-white rounded-lg p-6 text-center border border-border hover:-translate-y-1 transition-all duration-300 no-underline group"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3 group-hover:bg-primary transition-colors duration-200">
                  <Car size={24} weight="regular" className="text-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-sm font-medium text-neutral-900 mb-1">
                  {t(`home.categories.${cat.key}.name`)}
                </h3>
                <p className="text-xs text-neutral-500">{t(`home.categories.${cat.key}.desc`)}</p>
              </LLink>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (Enterprise 3-step) ─────────────────────── */}
      <section className="py-16 px-6 bg-white" aria-labelledby="how-heading">
        <div className="max-w-[1440px] mx-auto">
          <h2 id="how-heading" className="text-3xl font-medium text-neutral-900 mb-2 text-center">
            {t("home.howItWorks.title")}
          </h2>
          <p className="text-neutral-500 text-center mb-12">{t("home.howItWorks.subtitle")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 z-0" />
            {howItWorksSteps.map((step, i) => {
              const StepIcon = howItWorksIcons[i];
              return (
                <div key={i} className="relative z-10 flex flex-col items-center text-center bg-background rounded-xl border border-border p-8 hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                      <StepIcon size={28} weight="regular" className="text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-primary text-primary text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <LLink to="/flota" className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity no-underline">
              <Lightning size={16} weight="fill" />
              {t("home.howItWorks.cta")}
            </LLink>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        className="py-16 px-6 bg-white"
        id="rreth-nesh"
        aria-labelledby="why-heading"
      >
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="why-heading" className="text-3xl font-medium text-neutral-900 mb-4">
                {t("home.whyUs.title")}
              </h2>
              <p className="text-neutral-500 mb-8 leading-relaxed">{t("home.whyUs.subtitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {whyUsItems.map((item, i) => {
                  const Icon = whyUsIcons[i];
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Icon size={20} weight="regular" className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-neutral-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ height: "400px" }}
            >
              <img
                src={bannerAbout}
                alt="Happy customer standing by rented car"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Price Guarantee + No Hidden Fees Banner (à la Rentalcars) */}
      <section className="py-12 px-6 bg-gradient-to-br from-primary/5 to-accent/5 border-y border-primary/10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guarantees.map((item, i) => {
              const Icon = guaranteeIcons[i];
              const colors = guaranteeColors[i];
              return (
                <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-border p-6 shadow-sm">
                  <div className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={22} weight="regular" className={colors.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">{item.title}</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="py-16 px-6 bg-background"
        aria-labelledby="testimonials-heading"
      >
        <div className="max-w-[1440px] mx-auto">
          <h2 id="testimonials-heading" className="text-3xl font-medium text-neutral-900 mb-2 text-center">
            {t("home.reviews.title")}
          </h2>
          <p className="text-neutral-500 text-center mb-10">{t("home.reviews.subtitle")}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(dbReviews && dbReviews.length > 0
              ? dbReviews
              : testimonials.map((item) => ({
                  id: item.name,
                  rating: item.rating,
                  text: item.text,
                  authorName: item.name,
                  aspects: item.location,
                  approved: true,
                }))
            ).map((review: any, i: number) => (
              <div
                key={review.id ?? i}
                className="bg-white rounded-lg border border-border p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_: any, j: number) => (
                    <Star key={j} size={16} weight="fill" className="text-accent" />
                  ))}
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                  &#34;{review.text}&#34;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(review.authorName ?? review.name ?? "?").charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {review.authorName ?? review.name}
                    </p>
                    <p className="text-xs text-neutral-500">{review.aspects ?? review.location ?? ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Register CTA for Customers ──────────────────────── */}
      <section className="py-14 px-6 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users size={28} weight="duotone" className="text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
            {t("home.registerCta.title", "Krijo llogarinë falas")}
          </h2>
          <p className="text-neutral-500 text-sm mb-6 max-w-lg mx-auto">
            {t("home.registerCta.subtitle", "Regjistrohu për të menaxhuar rezervimet, kontratat dhe historinë e qirave të tua — gjithçka në një vend.")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LLink
              to="/llogaria"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-gradient-primary text-white hover:opacity-90 transition-opacity no-underline shadow-sm"
            >
              <Users size={16} weight="bold" />
              {t("home.registerCta.btn", "Regjistrohu tani")}
            </LLink>
            <LLink
              to="/flota"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border border-border text-neutral-700 hover:bg-secondary transition-colors no-underline"
            >
              <Car size={16} weight="regular" />
              {t("home.registerCta.fleet", "Shiko flotën")}
            </LLink>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-success" /> {t("home.registerCta.f1", "Pa pagesë")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-success" /> {t("home.registerCta.f2", "Menaxho rezervimet")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-success" /> {t("home.registerCta.f3", "Histori e plotë")}</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion items={faqItems} />

      {/* Contact CTA */}
      <section
        className="py-16 px-6 bg-gradient-primary"
        id="kontakti"
        aria-labelledby="contact-heading"
      >
        <div className="max-w-[1440px] mx-auto text-center">
          <h2 id="contact-heading" className="text-3xl font-medium text-white mb-3">
            {t("home.cta.title")}
          </h2>
          <p className="text-blue-100 mb-8">{t("home.cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`https://wa.me/355697562951?text=${t("home.cta.whatsappMsg")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium bg-success text-success-foreground hover:opacity-90 transition-opacity duration-200 no-underline"
            >
              <Phone size={18} weight="regular" />
              {t("home.cta.whatsapp")}
            </a>
            <a
              href="tel:+355697562951"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium bg-white text-primary hover:bg-secondary transition-colors duration-200 no-underline"
            >
              <Phone size={18} weight="regular" />
              {t("header.phone")}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
