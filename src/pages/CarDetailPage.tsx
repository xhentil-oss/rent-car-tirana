import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSEO, buildCarProductSchema, buildBreadcrumbSchema } from "../hooks/useSEO";
import {
  Users,
  Briefcase,
  GasPump,
  Gear,
  ShieldCheck,
  MapPin,
  CheckCircle,
  ArrowLeft,
  SpinnerGap,
  Star,
  Clock,
  CaretRight,
  Headset,
  SealCheck,
  Lightning,
  Gauge,
  Wind,
  Thermometer,
  CarSimple,
  Info,
  ArrowRight,
  Phone,
  WhatsappLogo,
  CaretLeft,
  CaretRight as CaretRightIcon,
  GoogleLogo,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@animaapp/playground-react-sdk";
import CarCard from "../components/CarCard";
import FAQAccordion from "../components/FAQAccordion";
import Footer from "../components/Footer";
import StatusBadge from "../components/StatusBadge";

const faqItems = [
  {
    question: "A përfshihet sigurimi?",
    answer:
      "Po, të gjitha makinat tona vijnë me sigurim bazë të përfshirë. Mund të shtoni sigurim shtesë gjatë rezervimit.",
  },
  {
    question: "Çfarë ndodh me dëmtimet?",
    answer:
      "Çdo makinë ka depozitë sigurie. Dëmtimet e vogla mbulohen nga sigurimi. Ju rekomandojmë sigurim të plotë.",
  },
  {
    question: "A mund ta marr makinën nga aeroporti?",
    answer:
      "Po, ofrojmë shërbim pickup falas nga Aeroporti Ndërkombëtar Tirana. Rezervoni në faqen e rezervimit.",
  },
];

const EXTRAS_PREVIEW = [
  { icon: Wind, label: "Klimë A/C" },
  { icon: Gauge, label: "Tempomat" },
  { icon: Thermometer, label: "Ngrohje" },
  { icon: CarSimple, label: "Parking Sensor" },
];

const TRUST_ITEMS = [
  { icon: SealCheck, label: "Verifikuar & i pastër", color: "text-emerald-500" },
  { icon: Lightning, label: "Konfirmim i menjëhershëm", color: "text-amber-500" },
  { icon: Headset, label: "Mbështetje 24/7", color: "text-blue-500" },
  { icon: ShieldCheck, label: "Sigurim i përfshirë", color: "text-primary" },
];

const PICKUP_LOCATIONS = [
  { value: "Tiranë - Qendër", label: "Tiranë - Qendër", icon: "🏙️" },
  { value: "Aeroporti Ndërkombëtar", label: "Aeroporti Ndërkombëtar", icon: "✈️" },
  { value: "Tiranë - Rruga e Kavajës", label: "Tiranë - Rruga e Kavajës", icon: "📍" },
  { value: "Durrës - Plazh", label: "Durrës - Plazh", icon: "🏖️" },
  { value: "Shkodër", label: "Shkodër", icon: "🏔️" },
  { value: "Vlorë", label: "Vlorë", icon: "⛵" },
];

// Static Google-style reviews fallback
const STATIC_REVIEWS = [
  {
    id: "r1",
    authorName: "Endri Muka",
    rating: 5,
    text: "Shërbim i shkëlqyer! Makina ishte e pastër dhe ekipi shumë i sjellshëm. Do ta rekomandoj pa dyshim.",
    avatar: "EM",
    date: "2 javë më parë",
  },
  {
    id: "r2",
    authorName: "Sara Hoxha",
    rating: 5,
    text: "Rezervova online dhe gjithçka shkoi perfekt. Pickup nga aeroporti ishte shumë i lehtë.",
    avatar: "SH",
    date: "1 muaj më parë",
  },
  {
    id: "r3",
    authorName: "Arben Daci",
    rating: 5,
    text: "Çmime të arsyeshme dhe makinë në gjendje shumë të mirë. Kilometrazh pa limit ishte plus i madh!",
    avatar: "AD",
    date: "3 javë më parë",
  },
];

// Scroll-triggered animation hook
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

type Tab = "specs" | "features" | "policy";

// Car images — generate extra views from the base image via unsplash params (real apps would have multiple URLs)
function getCarImages(baseImage: string): string[] {
  // If it's already an unsplash URL, generate variations; otherwise just repeat
  if (baseImage.includes("unsplash.com")) {
    const base = baseImage.split("?")[0];
    return [
      `${base}?w=1200&q=80`,
      `${base}?w=1200&q=80&sat=-20`,
      `${base}?w=1200&q=80&con=20`,
      `${base}?w=1200&q=80&bri=10`,
    ];
  }
  return [baseImage, baseImage, baseImage];
}

export default function CarDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: allCars, isPending } = useQuery("Car");
  const { data: allReservations } = useQuery("Reservation");
  const { data: dbReviews } = useQuery("Review", { where: { approved: true }, orderBy: { createdAt: "desc" }, limit: 6 });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tab, setTab] = useState<Tab>("specs");
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(PICKUP_LOCATIONS[0].value);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);

  // Scroll-triggered refs
  const { ref: specsRef, inView: specsInView } = useInView();
  const { ref: reviewsRef, inView: reviewsInView } = useInView();

  useEffect(() => {
    const t1 = setTimeout(() => setHeroVisible(true), 80);
    const t2 = setTimeout(() => setCardVisible(true), 280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Show floating CTA when booking card is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (!bookingCardRef.current) return;
      const rect = bookingCardRef.current.getBoundingClientRect();
      setShowFloatingBtn(rect.bottom < 0 || rect.top > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const car = (allCars ?? []).find((c) => c.slug === slug);

  // Dynamic SEO per car — called unconditionally (hooks rule)
  useSEO(
    car
      ? {
          title: `${car.brand} ${car.model} ${car.year} me Qira Tiranë — €${car.pricePerDay}/ditë`,
          description: `Merre ${car.brand} ${car.model} (${car.year}) me qira në Tiranë nga €${car.pricePerDay}/ditë. Kategoria ${car.category}, ${car.transmission}, ${car.fuel}. Disponueshëm 24/7 — marrje nga aeroporti.`,
          keywords: `${car.brand} ${car.model} me qira tirane, ${car.category.toLowerCase()} me qira shqiperi, rent ${car.brand} tirana`,
          canonical: `/makina/${car.slug}`,
          ogImage: car.image,
          ogType: "product",
          structuredData: [
            buildCarProductSchema(car),
            buildBreadcrumbSchema([
              { name: "Kryefaqja", url: "/" },
              { name: "Flota", url: "/flota" },
              { name: `${car.brand} ${car.model}`, url: `/makina/${car.slug}` },
            ]),
          ],
        }
      : {
          title: "Makina me Qira Tiranë",
          description: "Shërbimi nr.1 i makinave me qira në Tiranë.",
          canonical: "/flota",
        }
  );

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <SpinnerGap size={36} className="animate-spin text-primary" />
          <p className="text-sm text-neutral-500">{t("carDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-neutral-900 mb-4">{t("carDetail.notFound")}</h1>
          <Link to="/flota" className="text-primary no-underline hover:underline">
            {t("carDetail.backToFleet")}
          </Link>
        </div>
      </div>
    );
  }

  const relatedCars = (allCars ?? [])
    .filter((c) => c.category === car.category && c.id !== car.id)
    .slice(0, 3);

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const days = calcDays();
  const total = days * car.pricePerDay;
  const today = new Date().toISOString().split("T")[0];

  // Live availability check
  const isDateRangeConflict = () => {
    if (!startDate || !endDate) return false;
    const reqStart = new Date(startDate).getTime();
    const reqEnd = new Date(endDate).getTime();
    const activeReservations = (allReservations ?? []).filter(
      (r) => r.carId === car.id && r.status !== "Anuluar" && r.status !== "Completed"
    );
    return activeReservations.some((r) => {
      const rStart = new Date(r.startDate).getTime();
      const rEnd = new Date(r.endDate).getTime();
      return reqStart < rEnd && reqEnd > rStart;
    });
  };

  const carIsUnavailable = car.status === "I rezervuar" || car.status === "Në mirëmbajtje";
  const dateConflict = isDateRangeConflict();
  const available = !carIsUnavailable && !dateConflict;

  const availabilityLabel = carIsUnavailable
    ? car.status
    : dateConflict
    ? "Zënë në këto data"
    : "Në dispozicion";

  const availableStatus = !carIsUnavailable && !dateConflict;

  const specs = [
    { icon: Gear, label: t("carDetail.specs.transmission"), value: car.transmission },
    { icon: GasPump, label: t("carDetail.specs.fuel"), value: car.fuel },
    { icon: Users, label: t("carDetail.specs.seats"), value: `${car.seats} ${t("carCard.seats", { count: car.seats }).split(" ")[1] ?? "vende"}` },
    { icon: Briefcase, label: t("carDetail.specs.luggage"), value: `${car.luggage} ${t("carCard.luggage", { count: car.luggage }).split(" ")[1] ?? "valixhe"}` },
    { icon: MapPin, label: t("carDetail.specs.category"), value: car.category },
    { icon: ShieldCheck, label: t("carDetail.specs.insurance"), value: t("carDetail.specs.insuranceValue") },
  ];

  const carImages = getCarImages(car.image);

  // Reviews — prefer DB, fallback to static
  const reviews = (dbReviews && dbReviews.length > 0)
    ? dbReviews.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        text: r.text,
        avatar: r.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        date: new Date(r.createdAt).toLocaleDateString("sq-AL", { month: "long", year: "numeric" }),
      }))
    : STATIC_REVIEWS;

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── FLOATING RESERVE BUTTON (mobile/scroll) ────────── */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          showFloatingBtn ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        <button
          onClick={() =>
            navigate(`/rezervo?car=${car.id}${startDate ? `&start=${startDate}` : ""}${endDate ? `&end=${endDate}` : ""}`)
          }
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-white font-bold text-sm shadow-2xl shadow-primary/40 hover:opacity-90 active:scale-[0.97] transition-all duration-200 cursor-pointer"
        >
          <Lightning size={16} weight="fill" />
          {t("carDetail.floatingBtn", { brand: car.brand, model: car.model })}
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>

      {/* ── GALLERY LIGHTBOX ─────────────────────────────────── */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
          onClick={() => setGalleryOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setGalleryOpen(true)}
            className="md:hidden absolute top-[52px] right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 text-white text-[11px] font-medium hover:bg-black/70 transition cursor-pointer"
            style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 0.7s ease 0.3s" }}
          >
            📷 Galeri
          </button>

          {/* Inner layout: [prev] [image] [next + thumbnails-column] */}
          <div
            className="flex items-center gap-3 max-w-[92vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev arrow */}
            <button
              className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + carImages.length) % carImages.length); }}
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            {/* Main image */}
            <img
              src={carImages[galleryIndex]}
              alt={`${car.brand} ${car.model} foto ${galleryIndex + 1}`}
              className="max-h-[80vh] max-w-[60vw] object-contain rounded-xl flex-shrink-0"
            />

            {/* Right column: next arrow + thumbnail strip */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              {/* Next arrow */}
              <button
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % carImages.length); }}
              >
                <CaretRightIcon size={20} weight="bold" />
              </button>

              {/* Vertical thumbnail strip */}
              <div className="flex flex-col gap-2">
                {carImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                      i === galleryIndex
                        ? "border-white scale-105 shadow-lg"
                        : "border-white/25 opacity-55 hover:opacity-100 hover:border-white/60"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Counter */}
              <p className="text-[11px] text-white/40 text-center">
                {galleryIndex + 1} / {carImages.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO FULLSCREEN ─────────────────────────────────── */}
      <div ref={heroRef} className="relative w-full overflow-hidden" style={{ height: "72vh", minHeight: 520 }}>
        {/* Background image */}
        <img
          src={carImages[galleryIndex]}
          alt={`${car.brand} ${car.model}`}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700"
          style={{ transform: heroVisible ? "scale(1)" : "scale(1.05)" }}
        />

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/60 via-transparent to-transparent" />

        {/* Back nav */}
        <div
          className="absolute top-6 left-6 transition-all duration-500"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(-12px)" }}
        >
          <Link
            to="/flota"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200 no-underline"
          >
            <ArrowLeft size={15} weight="bold" />
            {t("carDetail.back")}
          </Link>
        </div>

        {/* Status pill top-right */}
        <div
          className="absolute top-6 right-6 transition-all duration-500 delay-100"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(-12px)" }}
        >
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${
            availableStatus
              ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
              : "bg-red-500/20 border-red-400/40 text-red-300"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${availableStatus ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            {availabilityLabel}
          </span>
        </div>

        {/* Thumbnail strip — desktop: bottom-right above text; mobile: top-right badge only */}
        {/* Mobile: small gallery pill top-right (under status badge) */}
        <button
          onClick={() => setGalleryOpen(true)}
          className="md:hidden absolute top-[52px] right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/25 text-white text-[11px] font-medium hover:bg-black/70 transition cursor-pointer"
          style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 0.7s ease 0.3s" }}
        >
          📷 Galeri
        </button>

        {/* Desktop: thumbnail strip fixed bottom-right, stays above text because text is bottom-left */}
        <div
          className="hidden md:flex absolute bottom-6 right-6 gap-2 transition-all duration-700 delay-300"
          style={{ opacity: heroVisible ? 1 : 0 }}
        >
          {carImages.slice(0, 3).map((img, i) => (
            <button
              key={i}
              onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}
              className={`w-16 h-11 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${i === galleryIndex ? "border-white scale-105 shadow-lg" : "border-white/30 opacity-70 hover:opacity-100 hover:border-white/60"}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          <button
            onClick={() => setGalleryOpen(true)}
            className="w-16 h-11 rounded-lg bg-black/50 backdrop-blur-sm border-2 border-white/30 text-white text-[11px] font-semibold flex items-center justify-center hover:bg-black/70 hover:border-white/60 transition-all cursor-pointer"
          >
            +foto
          </button>
        </div>

        {/* Hero Content — bottom left */}
        <div
          className="absolute bottom-0 left-0 right-0 md:right-0 px-6 md:px-10 pb-8 transition-all duration-700"
          style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(24px)" }}
        >
          {/* Category breadcrumb */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{car.category}</span>
            <CaretRight size={10} className="text-white/30" />
            <span className="text-xs font-medium text-white/50">{car.year}</span>
          </div>

          {/* Car name */}
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
            {car.brand} <span className="font-light">{car.model}</span>
          </h1>

          {/* Quick pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { icon: Gear, text: car.transmission },
              { icon: GasPump, text: car.fuel },
              { icon: Users, text: `${car.seats} vende` },
              { icon: Briefcase, text: `${car.luggage} valixhe` },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/85 text-xs font-medium">
                <Icon size={12} weight="fill" className="text-white/60" />
                {text}
              </span>
            ))}
          </div>

          {/* Price row */}
            <div className="flex items-end gap-4">
            <div>
              <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">{t("carDetail.from")}</span>
              <span className="text-4xl font-bold text-white">€{car.pricePerDay}</span>
              <span className="text-white/50 text-sm ml-1">{t("carDetail.perDay")}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">{t("carDetail.weekly")}</span>
              <span className="text-xl font-semibold text-white/80">€{car.pricePerDay * 7}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-xs text-white/50 uppercase tracking-wider block mb-0.5">{t("carDetail.monthly")}</span>
              <span className="text-xl font-semibold text-white/80">€{car.pricePerDay * 28}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="bg-white border-b border-border/60">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between gap-4 py-3 overflow-x-auto no-scrollbar">
            {[
              { icon: SealCheck, label: t("carDetail.trust.verified"), color: "text-emerald-500" },
              { icon: Lightning, label: t("carDetail.trust.instant"), color: "text-amber-500" },
              { icon: Headset, label: t("carDetail.trust.support"), color: "text-blue-500" },
              { icon: ShieldCheck, label: t("carDetail.trust.insurance"), color: "text-primary" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <Icon size={16} weight="fill" className={color} />
                <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">{label}</span>
              </div>
            ))}
            <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto pl-4 border-l border-border">
              <Star size={14} weight="fill" className="text-amber-400" />
              <span className="text-xs font-semibold text-neutral-800">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-neutral-500">({reviews.length} vlerësime)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

          {/* LEFT — details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
              {(["specs", "features", "policy"] as Tab[]).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                    tab === tabKey
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {t(`carDetail.tabs.${tabKey}`)}
                </button>
              ))}
            </div>

            {/* TAB: Specs — with scroll-triggered animation */}
            {tab === "specs" && (
              <div ref={specsRef} key="specs" className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {specs.map(({ icon: Icon, label, value }, i) => (
                  <div
                    key={label}
                    className="group bg-white rounded-xl border border-border/80 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300"
                    style={{
                      opacity: specsInView ? 1 : 0,
                      transform: specsInView ? "translateY(0)" : "translateY(20px)",
                      transition: `opacity 0.4s ease ${i * 70}ms, transform 0.4s ease ${i * 70}ms, border-color 0.2s, box-shadow 0.2s`,
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors duration-200">
                      <Icon size={20} weight="fill" className="text-primary" />
                    </div>
                    <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-neutral-800">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Features */}
            {tab === "features" && (
              <div
                key="features"
                className="bg-white rounded-xl border border-border/80 p-6"
                style={{ animation: "fadeIn 0.3s ease-out" }}
              >
                <p className="text-sm text-neutral-500 mb-5">
                  {t("carDetail.features.title", { brand: car.brand, model: car.model })}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Klimë A/C me temperaturë duale",
                    "Radio/Bluetooth/USB",
                    "Ngrohje ndenjëse",
                    "Kamera parkimi",
                    "Sensor parkimi (para/prapa)",
                    "Tempomat (cruise control)",
                    "Airbag të shumtë",
                    "ABS + ESP elektronik",
                    "Sistemë navigacioni",
                    "Xhama elektrik",
                    "Pasqyra elektrike me ngrohje",
                    `${car.luggage} valixhe madhësi M`,
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <CheckCircle size={16} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-neutral-700">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-border/60">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{t("carDetail.features.extras")}</p>
                  <div className="flex flex-wrap gap-3">
                    {EXTRAS_PREVIEW.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-neutral-300 text-xs text-neutral-500">
                        <Icon size={13} weight="duotone" />
                        {label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                    <Info size={13} />
                    {t("carDetail.features.extrasNote")}
                  </p>
                </div>
              </div>
            )}

            {/* TAB: Policy */}
            {tab === "policy" && (
              <div
                key="policy"
                className="bg-white rounded-xl border border-border/80 p-6 space-y-5"
                style={{ animation: "fadeIn 0.3s ease-out" }}
              >
                {(["age", "license", "fuel", "mileage", "cancellation"] as const).map((key) => ({
                  title: t(`carDetail.policy.${key}.title`),
                  text: t(`carDetail.policy.${key}.text`),
                })).map(({ title, text }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-1 rounded-full bg-primary/30 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 mb-1">{title}</p>
                      <p className="text-sm text-neutral-500 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description Card */}
            <div className="bg-gradient-to-br from-secondary/60 to-secondary/30 rounded-xl border border-secondary/80 p-6">
              <h2 className="text-base font-semibold text-neutral-800 mb-2">
                {t("carDetail.about.title")}
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {t("carDetail.about.text", { brand: car.brand, model: car.model, year: car.year, category: car.category, transmission: car.transmission, fuel: car.fuel, seats: car.seats, luggage: car.luggage })}
              </p>
            </div>

            {/* ── GOOGLE REVIEWS ─────────────────────────────────── */}
            <div ref={reviewsRef}>
              {/* Header */}
              <div
                className="flex items-center justify-between mb-5"
                style={{
                  opacity: reviewsInView ? 1 : 0,
                  transform: reviewsInView ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
                    <GoogleLogo size={18} weight="bold" className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">{t("carDetail.reviews.title")}</h3>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} weight={s <= Math.round(avgRating) ? "fill" : "regular"} className="text-amber-400" />
                      ))}
                      <span className="text-xs text-neutral-500 ml-1">{avgRating.toFixed(1)} · {t("carDetail.reviews.count", { count: reviews.length })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reviews.slice(0, 3).map((review, i) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border border-border/80 p-4 hover:shadow-md transition-all duration-300"
                    style={{
                      opacity: reviewsInView ? 1 : 0,
                      transform: reviewsInView ? "translateY(0)" : "translateY(20px)",
                      transition: `opacity 0.5s ease ${i * 100 + 100}ms, transform 0.5s ease ${i * 100 + 100}ms, box-shadow 0.2s`,
                    }}
                  >
                    {/* Google icon top-right */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {review.avatar}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-800 leading-tight">{review.authorName}</p>
                          <p className="text-[10px] text-neutral-400">{review.date}</p>
                        </div>
                      </div>
                      <GoogleLogo size={14} weight="bold" className="text-blue-400/60 shrink-0" />
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} weight={s <= review.rating ? "fill" : "regular"} className="text-amber-400" />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-3">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support CTA */}
            <div className="bg-neutral-900 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">{t("carDetail.support.question")}</p>
                <p className="text-xs text-white/50">{t("carDetail.support.available")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href="tel:+355691234567"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-xs font-medium hover:bg-white/20 transition-all duration-200 no-underline"
                >
                  <Phone size={14} weight="fill" />
                  {t("carDetail.support.phone")}
                </a>
                <a
                  href="https://wa.me/355691234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-all duration-200 no-underline"
                >
                  <WhatsappLogo size={14} weight="fill" />
                  {t("carDetail.support.whatsapp")}
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT — Booking Card */}
          <div className="lg:col-span-1">
            <div
              ref={bookingCardRef}
              className="sticky top-24 transition-all duration-700"
              style={{ opacity: cardVisible ? 1 : 0, transform: cardVisible ? "translateY(0)" : "translateY(20px)" }}
            >
              {/* Main booking card */}
              <div className="bg-white rounded-2xl border border-border shadow-xl overflow-hidden mb-4">

                {/* Card header */}
                <div className="bg-gradient-primary p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/70 text-xs mb-1 uppercase tracking-wider">{t("carDetail.booking.bookNow")}</p>
                      <h2 className="text-white text-xl font-bold">
                        {car.brand} {car.model}
                      </h2>
                      <p className="text-white/60 text-xs mt-0.5">{car.category} · {car.year}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white/60 text-xs block mb-0.5">nga</span>
                      <span className="text-3xl font-bold text-white">€{car.pricePerDay}</span>
                      <span className="text-white/60 text-xs">/ditë</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Date pickers */}
                  <div className="space-y-3 mb-3">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        {t("carDetail.booking.departure")}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={today}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        {t("carDetail.booking.return")}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || today}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all duration-200"
                      />
                    </div>

                    {/* Pickup Location Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                        <MapPin size={11} weight="fill" className="inline mr-1" />
                        {t("carDetail.booking.pickupLocation")}
                      </label>
                      <div className="relative">
                        <select
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-border text-sm text-neutral-800 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all duration-200 appearance-none cursor-pointer pr-8"
                        >
                          {PICKUP_LOCATIONS.map((loc) => (
                            <option key={loc.value} value={loc.value}>
                              {loc.icon} {loc.label}
                            </option>
                          ))}
                        </select>
                        <CaretRightIcon size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 rotate-90 pointer-events-none" />
                      </div>
                      {pickupLocation === "Aeroporti Ndërkombëtar" && (
                        <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                          <CheckCircle size={11} weight="fill" />
                          {t("carDetail.booking.airportFree")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Live availability indicator when dates selected */}
                  {startDate && endDate && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-3 ${
                      dateConflict
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${dateConflict ? "bg-red-500" : "bg-emerald-500"}`} />
                      {dateConflict
                        ? t("carDetail.booking.dateTaken")
                        : t("carDetail.booking.freeDays", { days })}
                    </div>
                  )}

                  {/* Price breakdown — animated */}
                  <div
                    className="overflow-hidden transition-all duration-400"
                    style={{ maxHeight: days > 0 ? "200px" : "0px", opacity: days > 0 ? 1 : 0 }}
                  >
                    <div className="bg-secondary/40 rounded-xl p-4 mb-4 border border-secondary">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-neutral-600">
                          <span>{t("carDetail.booking.basePrice", { price: car.pricePerDay, days })}</span>
                          <span className="font-medium">€{total}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>{t("carDetail.booking.insurance")}</span>
                          <span className="text-emerald-600 font-medium">{t("carDetail.booking.insuranceFree")}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>{t("carDetail.booking.serviceFee")}</span>
                          <span className="text-emerald-600 font-medium">{t("carDetail.booking.serviceFree")}</span>
                        </div>
                        <div className="pt-2 border-t border-secondary flex justify-between font-bold text-neutral-900 text-base">
                          <span>{t("carDetail.booking.totalLabel")}</span>
                          <span className="text-primary">€{total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      navigate(
                        `/rezervo?car=${car.id}${startDate ? `&start=${startDate}` : ""}${endDate ? `&end=${endDate}` : ""}&pickup=${encodeURIComponent(pickupLocation)}`,
                      )
                    }
                    disabled={!available || (!!startDate && !!endDate && dateConflict)}
                    className="w-full py-4 rounded-xl text-sm font-bold bg-gradient-primary text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-btn-primary text-base"
                  >
                    {carIsUnavailable ? (
                      <span>{t("carDetail.booking.unavailable")}</span>
                    ) : dateConflict ? (
                      <span>{t("carDetail.booking.chooseDates")}</span>
                    ) : (
                      <>
                        <Lightning size={16} weight="fill" />
                        <span>{t("carDetail.booking.reserve")}</span>
                        <ArrowRight size={16} weight="bold" />
                      </>
                    )}
                  </button>

                  {available && (
                    <p className="text-center text-xs text-neutral-400 mt-2 flex items-center justify-center gap-1">
                      <Lightning size={12} weight="fill" className="text-amber-400" />
                      {t("carDetail.booking.instant")}
                    </p>
                  )}
                </div>
              </div>

              {/* Support mini card */}
              <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Headset size={18} weight="fill" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-800">{t("carDetail.support2.title")}</p>
                  <p className="text-xs text-neutral-400 truncate">+355 69 123 4567</p>
                </div>
                <a
                  href="tel:+355691234567"
                  className="text-xs text-primary font-semibold hover:underline no-underline flex items-center gap-0.5 shrink-0"
                >
                  <Phone size={13} weight="fill" />
                  {t("carDetail.support2.call")}
                </a>
              </div>

              {/* Price breakdown cards */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { period: t("carDetail.pricing.daily"), amount: car.pricePerDay, unit: t("carDetail.perDay") },
                  { period: t("carDetail.pricing.weekly"), amount: car.pricePerDay * 7, unit: `/${t("carDetail.weekly").split(" ")[0].toLowerCase()}` },
                  { period: t("carDetail.pricing.monthly"), amount: car.pricePerDay * 28, unit: `/${t("carDetail.monthly").split(" ")[0].toLowerCase()}` },
                ].map(({ period, amount, unit }) => (
                  <div key={period} className="bg-white rounded-xl border border-border p-3 text-center">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">{period}</p>
                    <p className="text-base font-bold text-neutral-900">€{amount}</p>
                    <p className="text-[10px] text-neutral-400">{unit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RELATED CARS ─────────────────────────────────────── */}
        {relatedCars.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900">{t("carDetail.related.title")}</h2>
                <p className="text-sm text-neutral-500 mt-1">{t("carDetail.related.subtitle", { category: car.category })}</p>
              </div>
              <Link
                to="/flota"
                className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-primary no-underline hover:gap-2.5 transition-all duration-200"
              >
                {t("carDetail.related.viewAll")}
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCars.map((c, i) => (
                <div
                  key={c.id}
                  style={{ animation: `fadeIn 0.4s ease-out ${i * 100}ms both` }}
                >
                  <CarCard car={c as any} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FAQ */}
      <FAQAccordion
        items={(t("carDetail.faqItems", { returnObjects: true }) as { question: string; answer: string }[])}
        title={t("carDetail.faqTitle")}
      />
      <Footer />
    </div>
  );
}
