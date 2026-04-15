import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLocale } from "../hooks/useLocale";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  CalendarBlank,
  Clock,
  User,
  Phone,
  EnvelopeSimple,
  CheckCircle,
  CaretDown,
  CaretUp,
  Tag,
  Info,
  FileText,
  WarningCircle,
  DownloadSimple,
} from "@phosphor-icons/react";
import { downloadContractPdf } from "../lib/generateContractPdf";
import SignaturePad from "../components/SignaturePad";
import { useQuery, useMutation } from "../hooks/useApi";
import Footer from "../components/Footer";
import { useSEO } from "../hooks/useSEO";
import {
  getSeasonForDate,
  calculateSeasonalTotal,
  getDominantSeason,
  getAllSeasonPrices,
} from "../lib/seasonalPricing";
import { applyPricingRules, RULE_TYPE_LABELS } from "../lib/pricingRules";
import type { PricingRule } from "../lib/pricingRules";
import { sendBookingConfirmation } from "../lib/emailService";

interface BookingForm {
  pickup: string;
  dropoff: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  extras: string[];
  insurance: string;
  discountCode: string;
}

const extraOptions = [
  { id: "gps", label: "GPS Navigator", price: 5 },
  { id: "child-seat", label: "Karrige për fëmijë", price: 8 },
  { id: "extra-driver", label: "Shtesë shoferi", price: 10 },
  { id: "wifi", label: "Wi-Fi Portativ", price: 6 },
];

const insuranceOptions = [
  { id: "basic", label: "Sigurim bazë (përfshirë)", price: 0 },
  { id: "full", label: "Sigurim i plotë", price: 15 },
  { id: "premium", label: "Sigurim premium", price: 25 },
];

// ── Seasonal Price Table Component ──────────────────────────────────────────
function SeasonalPriceTable({ basePrice }: { basePrice: number }) {
  const [open, setOpen] = React.useState(false);
  const allPrices = getAllSeasonPrices(basePrice);
  const currentSeason = getSeasonForDate(new Date());

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={16} weight="regular" className="text-primary" />
          <span className="text-sm font-medium text-neutral-900">Çmimet sezonale</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${currentSeason.badgeColor}`}>
            {currentSeason.emoji} Aktualisht: {currentSeason.label}
          </span>
        </div>
        {open ? (
          <CaretUp size={16} weight="regular" className="text-neutral-400 flex-shrink-0" />
        ) : (
          <CaretDown size={16} weight="regular" className="text-neutral-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-border">
          <p className="text-xs text-neutral-500 mb-4 mt-3 flex items-start gap-1.5">
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            Çmimet ndryshojnë sipas sezonit. Çmimi bazë i kësaj makine është €{basePrice}/ditë.
          </p>
          <div className="space-y-2">
            {allPrices.map(({ season, pricePerDay }) => (
              <div
                key={season.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${season.id === currentSeason.id ? `${season.badgeColor} ring-1 ring-current/20` : "bg-neutral-50 border-border"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{season.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{season.label}</p>
                    <p className="text-xs text-neutral-500">
                      {season.months.map((m) => ["Jan","Shk","Mar","Pri","Maj","Qer","Kor","Gus","Sht","Tet","Nën","Dhj"][m - 1]).join(", ")}
                    </p>
                  </div>
                  {season.id === currentSeason.id && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 border border-current/20">Aktual</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-neutral-900">€{pricePerDay}<span className="text-xs font-normal text-neutral-500">/ditë</span></p>
                  {season.multiplier !== 1 && (
                    <p className="text-xs text-neutral-500">
                      {season.multiplier > 1
                        ? `+${Math.round((season.multiplier - 1) * 100)}%`
                        : `-${Math.round((1 - season.multiplier) * 100)}%`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  const { t } = useTranslation();
  useSEO({
    title: "Rezervo Makinën — Konfirmim i Menjëhershëm",
    description: "Rezervo makinën me qira online tani. Plotëso formularin, zglidh shteset e sigurimin, nënshkruaj kontratën dixhitale. Konfirmim i menjëhershëm me email.",
    keywords: "rezervo makinë online tirana, booking makine qira shqiperi, car rental reservation albania",
    canonical: "/rezervo",
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { localePath } = useLocale();
  const { data: allCars } = useQuery("Car");
  const { data: allReservations } = useQuery("ReservationAvailability");
  const carId = searchParams.get("car");
  const car = carId ? (allCars ?? []).find((c) => c.id === carId) : undefined;

  const [form, setForm] = useState<BookingForm>({
    pickup: searchParams.get("pickup") || "",
    dropoff: searchParams.get("dropoff") || "",
    startDate: searchParams.get("start") || "",
    startTime: "10:00",
    endDate: searchParams.get("end") || "",
    endTime: "10:00",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    extras: [],
    insurance: "basic",
    discountCode: "",
  });

  // Check if car is available (status + date conflict)
  const carStatusBlocked = car
    ? car.status === "I rezervuar" || car.status === "Në mirëmbajtje"
    : false;

  const isCarAvailable = React.useMemo(() => {
    if (!car) return true;
    // Block if car status is not available regardless of dates
    if (car.status === "I rezervuar" || car.status === "Në mirëmbajtje") return false;
    if (!form.startDate || !form.endDate) return true;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    return !(allReservations ?? []).some((r) => {
      if (r.carId !== car.id) return false;
      if (r.status === "Cancelled" || r.status === "Completed") return false;
      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);
      return start <= rEnd && end >= rStart;
    });
  }, [car, form.startDate, form.endDate, allReservations]);

  const { create: createCustomer } = useMutation("Customer");
  const { create: createReservation } = useMutation("Reservation");
  const [errors, setErrors] = useState<Partial<BookingForm>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [contractDownloaded, setContractDownloaded] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load pricing rules from DB
  const { data: pricingRules } = useQuery("PricingRule", { where: { isActive: true } });

  const { days, hours } = (() => {
    if (!form.startDate || !form.endDate) return { days: 0, hours: 0 };
    const start = new Date(`${form.startDate}T${form.startTime || "10:00"}`);
    const end = new Date(`${form.endDate}T${form.endTime || "10:00"}`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return { days: 0, hours: 0 };
    const totalHours = diffMs / (1000 * 60 * 60);
    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    // Round up partial day to full day for pricing
    const billableDays = remainingHours > 0 ? fullDays + 1 : fullDays;
    return { days: billableDays, hours: Math.round(totalHours) };
  })();

  // Seasonal pricing calculation
  const seasonalData = React.useMemo(() => {
    if (!form.startDate || !form.endDate || !car) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) return null;
    return calculateSeasonalTotal(car.pricePerDay, start, end);
  }, [form.startDate, form.endDate, car]);

  const dominantSeason = React.useMemo(() => {
    if (!form.startDate || !form.endDate) return getSeasonForDate(new Date());
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end <= start) return getSeasonForDate(new Date());
    return getDominantSeason(start, end);
  }, [form.startDate, form.endDate]);

  const LOCATION_FEES: Record<string, number> = {
    "Aeroporti Nënë Tereza": 10,
    "Aeroporti Ndërkombëtar": 10,
    "Durrës": 15,
    "Vlorë": 20,
    "Sarandë": 25,
    "Shkodër": 20,
  };
  const pickupFee = LOCATION_FEES[form.pickup] ?? 0;
  const dropoffFee = form.pickup === form.dropoff ? 0 : (LOCATION_FEES[form.dropoff] ?? 0);
  const locationFeeTotal = pickupFee + dropoffFee;

  const extrasTotal = form.extras.reduce((sum, id) => {
    const opt = extraOptions.find((e) => e.id === id);
    return sum + (opt ? opt.price * days : 0);
  }, 0);

  const insurancePrice =
    insuranceOptions.find((i) => i.id === form.insurance)?.price || 0;
  // Use seasonal base price if dates are selected, otherwise flat daily price
  const basePrice = seasonalData ? seasonalData.total : days * (car?.pricePerDay ?? 0);
  const insuranceTotal = insurancePrice * days;

  // Apply admin pricing rules on top of seasonal price — must be after basePrice declaration
  const pricingRuleResult = React.useMemo(() => {
    if (!car || !form.startDate || !form.endDate || days === 0 || basePrice === 0) return null;
    const activeRules = (pricingRules ?? []) as PricingRule[];
    if (activeRules.length === 0) return null;
    const ctx = {
      carId: car.id,
      carCategory: car.category,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      days,
      bookingDate: new Date(),
      promoCode: form.discountCode || undefined,
    };
    const result = applyPricingRules(activeRules, basePrice, ctx);
    return result.appliedDiscounts.length > 0 ? result : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingRules, car, form.startDate, form.endDate, form.discountCode, days, basePrice]);

  // Rule-based discounts replace the old hardcoded TIRANA10 logic
  const ruleDiscount = pricingRuleResult ? pricingRuleResult.totalDiscount : 0;
  const legacyDiscount =
    !pricingRuleResult && form.discountCode.toUpperCase() === "TIRANA10"
      ? Math.round(basePrice * 0.1)
      : 0;
  const discount = ruleDiscount + legacyDiscount;
  const total = basePrice + extrasTotal + insuranceTotal + locationFeeTotal - discount;

  // Effective car subtotal (base ± rule adjustments, no extras/insurance/location).
  // For surcharges ruleDiscount < 0, so carSubtotal > basePrice — shown as the daily rate.
  const carSubtotal = Math.round((basePrice - ruleDiscount - legacyDiscount) * 100) / 100;
  // Effective per-day rate shown to customer — includes surcharges folded in
  const effectiveDailyRate = days > 0
    ? Math.round(carSubtotal / days * 100) / 100
    : (car?.pricePerDay ?? 0);

  const validate = () => {
    const newErrors: Partial<BookingForm> = {};
    if (!form.pickup) newErrors.pickup = t("booking.validation.pickup");
    if (!form.dropoff) newErrors.dropoff = t("booking.validation.dropoff");
    if (!form.startDate) newErrors.startDate = t("booking.validation.startDate");
    if (!form.endDate) newErrors.endDate = t("booking.validation.endDate");
    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T${form.startTime || "10:00"}`);
      const end = new Date(`${form.endDate}T${form.endTime || "10:00"}`);
      if (end <= start) newErrors.endDate = t("booking.validation.endDateAfter");
    }
    if (!form.firstName) newErrors.firstName = t("booking.validation.firstName");
    if (!form.lastName) newErrors.lastName = t("booking.validation.lastName");
    if (!form.phone) newErrors.phone = t("booking.validation.phone");
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = t("booking.validation.email");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = validate();
    if (!signatureData) {
      setSignatureError(true);
      valid = false;
    } else {
      setSignatureError(false);
    }
    if (!termsAccepted) {
      setTermsError(true);
      valid = false;
    } else {
      setTermsError(false);
    }
    if (!valid) return;
    if (!car) return;
    setSaving(true);
    setBookingError(null);
    try {
      // 1. Criar ose gjej klientin
      const customer = await createCustomer({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        type: "Standard",
      });
      // 2. Krijo rezervimin
      const reservation = await createReservation({
        carId: car.id,
        customerId: customer.id,
        pickupLocation: form.pickup,
        dropoffLocation: form.dropoff,
        startDate: new Date(`${form.startDate}T${form.startTime}`),
        startTime: form.startTime,
        endDate: new Date(`${form.endDate}T${form.endTime}`),
        endTime: form.endTime,
        notes: "",
        source: "Web",
        status: "Pending",
        totalPrice: total,
        insurance: form.insurance,
        extras: form.extras.join(","),
        discountCode: form.discountCode || undefined,
      });
      // 3. Dërgo email konfirmimi (non-blocking)
      sendBookingConfirmation({
        customerName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        customerEmail: form.email.trim(),
        carName: `${car.brand} ${car.model}`,
        pickupLocation: form.pickup,
        dropoffLocation: form.dropoff,
        startDate: new Date(`${form.startDate}T${form.startTime}`).toLocaleDateString("sq-AL"),
        endDate: new Date(`${form.endDate}T${form.endTime}`).toLocaleDateString("sq-AL"),
        startTime: form.startTime,
        endTime: form.endTime,
        totalPrice: total,
        insurance: form.insurance,
        reservationId: reservation.id,
      });
      setSubmitted(true);
      // Redirect to thank-you page with booking summary via state (no PII in URL)
      navigate(localePath('/faleminderit'), {
        state: {
          rid: reservation.id,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          car: `${car.brand} ${car.model}`,
          pickup: form.pickup,
          start: new Date(`${form.startDate}T${form.startTime}`).toLocaleDateString("sq-AL"),
          end: new Date(`${form.endDate}T${form.endTime}`).toLocaleDateString("sq-AL"),
          total: String(total),
        },
      });
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : t("errors.bookingFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleExtra = (id: string) => {
    setForm((f) => ({
      ...f,
      extras: f.extras.includes(id)
        ? f.extras.filter((e) => e !== id)
        : [...f.extras, id],
    }));
  };

  // No carId in URL → show clear error immediately (don't wait for data)
  if (!carId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="bg-white rounded-xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <WarningCircle size={28} weight="regular" className="text-error" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Nuk u zgjodh asnjë makinë</h1>
          <p className="text-sm text-neutral-500 mb-6">Ju lutemi zgjidhni një makinë nga flota jonë për të vazhduar me rezervimin.</p>
          <button
            onClick={() => navigate(localePath("/flota"))}
            className="px-6 py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Shiko flotën
          </button>
        </div>
      </div>
    );
  }

  // carId present but cars still loading
  if (carId && !car && (allCars === undefined)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-neutral-500">{t("booking.loading")}</p>
      </div>
    );
  }

  // carId present but not found in DB
  if (carId && !car && allCars !== undefined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="bg-white rounded-xl border border-border p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <WarningCircle size={28} weight="regular" className="text-error" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Makina nuk u gjet</h1>
          <p className="text-sm text-neutral-500 mb-6">Makina me këtë ID nuk ekziston ose nuk është më e disponueshme.</p>
          <button
            onClick={() => navigate(localePath("/flota"))}
            className="px-6 py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Shiko flotën
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="bg-white rounded-xl border border-border p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} weight="regular" className="text-success" />
          </div>
          <h1 className="text-2xl font-medium text-neutral-900 mb-2">
            {t("booking.confirmed.title")}
          </h1>
          <p className="text-neutral-500 mb-4">
            {t("booking.confirmed.subtitle")}
          </p>
          <p className="text-sm text-neutral-400">{t("booking.confirmed.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-white border-b border-border py-6 px-6">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-2xl font-medium text-neutral-900">
            {t("booking.title")}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {t("booking.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-6"
            noValidate
          >
            {/* Location & Dates */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">
                {t("booking.locationDates")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="b-pickup"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.pickup")}
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <select
                      id="b-pickup"
                      value={form.pickup}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pickup: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                    >
                      <option value="">{t("booking.selectPlace")}</option>
                      <option value="Tiranë Qendër">Tiranë Qendër</option>
                      <option value="Aeroporti Nënë Tereza">✈ Aeroporti Nënë Tereza (+€10)</option>
                      <option value="Durrës">Durrës (+€15)</option>
                      <option value="Vlorë">Vlorë (+€20)</option>
                      <option value="Sarandë">Sarandë (+€25)</option>
                      <option value="Shkodër">Shkodër (+€20)</option>
                    </select>
                  </div>
                  {pickupFee > 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <MapPin size={11} weight="fill" />
                      Tarifë dërgese: +€{pickupFee}
                    </p>
                  )}
                  {errors.pickup && (
                    <p className="text-xs text-error mt-1">{errors.pickup}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="b-dropoff"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.dropoff")}
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <select
                      id="b-dropoff"
                      value={form.dropoff}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dropoff: e.target.value }))
                      }
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                    >
                      <option value="">{t("booking.selectPlace")}</option>
                      <option value="Tiranë Qendër">Tiranë Qendër</option>
                      <option value="Aeroporti Nënë Tereza">✈ Aeroporti Nënë Tereza (+€10)</option>
                      <option value="Durrës">Durrës (+€15)</option>
                      <option value="Vlorë">Vlorë (+€20)</option>
                      <option value="Sarandë">Sarandë (+€25)</option>
                      <option value="Shkodër">Shkodër (+€20)</option>
                    </select>
                  </div>
                  {dropoffFee > 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <MapPin size={11} weight="fill" />
                      Tarifë kthimi: +€{dropoffFee}
                    </p>
                  )}
                  {errors.dropoff && (
                    <p className="text-xs text-error mt-1">{errors.dropoff}</p>
                  )}
                </div>

                {/* Start Date + Time */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t("booking.departureDatetime")}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarBlank
                        size={16}
                        weight="regular"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                      <input
                        id="b-start"
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, startDate: e.target.value }))
                        }
                        className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                    <div className="relative w-36">
                      <Clock
                        size={16}
                        weight="regular"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                      <select
                        value={form.startTime}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, startTime: e.target.value }))
                        }
                        className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = String(i).padStart(2, "0");
                          return (
                            <option key={h} value={`${h}:00`}>{`${h}:00`}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-error mt-1">{errors.startDate}</p>
                  )}
                </div>

                {/* End Date + Time */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t("booking.returnDatetime")}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarBlank
                        size={16}
                        weight="regular"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                      <input
                        id="b-end"
                        type="date"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, endDate: e.target.value }))
                        }
                        className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                    <div className="relative w-36">
                      <Clock
                        size={16}
                        weight="regular"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                      />
                      <select
                        value={form.endTime}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, endTime: e.target.value }))
                        }
                        className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const h = String(i).padStart(2, "0");
                          return (
                            <option key={h} value={`${h}:00`}>{`${h}:00`}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-error mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">
                {t("booking.yourInfo")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="b-fname"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.firstName")}
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      id="b-fname"
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      placeholder={t("booking.firstNamePlaceholder")}
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-error mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="b-lname"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.lastName")}
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      id="b-lname"
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      placeholder={t("booking.lastNamePlaceholder")}
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-xs text-error mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="b-phone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.phone")}
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      id="b-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder={t("booking.phonePlaceholder")}
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-error mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="b-email"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t("booking.email")}
                  </label>
                  <div className="relative">
                    <EnvelopeSimple
                      size={16}
                      weight="regular"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      id="b-email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder={t("booking.emailPlaceholder")}
                      className="w-full pl-9 pr-3 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-error mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Extras */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">
                {t("booking.extrasInsurance")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {extraOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors duration-200 ${
                      form.extras.includes(opt.id)
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-neutral-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.extras.includes(opt.id)}
                      onChange={() => toggleExtra(opt.id)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-neutral-800 flex-1">
                      {opt.label}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      +€{opt.price}/ditë
                    </span>
                  </label>
                ))}
              </div>

              <h3 className="text-sm font-medium text-neutral-700 mb-3">
                {t("booking.insuranceType")}
              </h3>
              <div className="space-y-2">
                {insuranceOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors duration-200 ${
                      form.insurance === opt.id
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-neutral-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="insurance"
                      value={opt.id}
                      checked={form.insurance === opt.id}
                      onChange={() =>
                        setForm((f) => ({ ...f, insurance: opt.id }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-neutral-800 flex-1">
                      {opt.label}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {opt.price === 0 ? t("booking.free") : `+€${opt.price}${t("booking.perDay")}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Seasonal Pricing Banner */}
            {form.startDate && form.endDate && days > 0 && (
              <div className={`rounded-lg border p-4 ${dominantSeason.badgeColor}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{dominantSeason.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{dominantSeason.label}</span>
                      {dominantSeason.multiplier !== 1 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60">
                          {dominantSeason.multiplier > 1
                            ? `+${Math.round((dominantSeason.multiplier - 1) * 100)}% mbi bazë`
                            : `-${Math.round((1 - dominantSeason.multiplier) * 100)}% zbritje sezonale`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-80">{dominantSeason.description}</p>
                    {/* Multi-season breakdown */}
                    {seasonalData && seasonalData.breakdown.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                        <p className="text-xs font-medium opacity-70">Ndarja sipas sezonit:</p>
                        {seasonalData.breakdown.map((b) => (
                          <div key={b.season.id} className="flex justify-between text-xs">
                            <span>{b.season.emoji} {b.season.label} ({b.days} ditë × €{b.pricePerDay})</span>
                            <span className="font-medium">€{b.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seasonal Price Table (always visible, collapsed by default) */}
            {car && (
              <SeasonalPriceTable basePrice={car.pricePerDay} />
            )}

            {/* Discount */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">
                {t("booking.discountCode")}
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={form.discountCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discountCode: e.target.value }))
                  }
                  placeholder={t("booking.discountPlaceholder")}
                  className="flex-1 px-4 py-3 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  className="px-5 py-3 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary-hover transition-colors duration-200 cursor-pointer"
                >
                  {t("booking.apply")}
                </button>
              </div>
              {pricingRuleResult && pricingRuleResult.appliedDiscounts.some(d => d.rule.type === "promo_code") && (
                <p className="text-xs text-success mt-2 flex items-center gap-1">
                  <CheckCircle size={14} weight="regular" />
                  Kodi u aplikua! -{pricingRuleResult.appliedDiscounts.find(d => d.rule.type === "promo_code")?.rule.discountType === "percent"
                    ? `${pricingRuleResult.appliedDiscounts.find(d => d.rule.type === "promo_code")?.rule.discountValue}%`
                    : `€${pricingRuleResult.appliedDiscounts.find(d => d.rule.type === "promo_code")?.rule.discountValue}`} zbritje
                </p>
              )}
              {!pricingRuleResult && form.discountCode.toUpperCase() === "TIRANA10" && (
                <p className="text-xs text-success mt-2 flex items-center gap-1">
                  <CheckCircle size={14} weight="regular" />
                  Kodi u aplikua! -10% zbritje
                </p>
              )}
            </div>

            {/* Contract & Signature */}
            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={20} weight="regular" className="text-primary" />
                <h2 className="text-lg font-medium text-neutral-900">{t("booking.contract.title")}</h2>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                {t("booking.contract.subtitle")}
              </p>

              {/* Contract Terms Box */}
              <div className="bg-neutral-50 border border-border rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-xs text-neutral-600 leading-relaxed space-y-2">
                <p className="font-semibold text-neutral-800">{t("booking.contract.termsTitle")}</p>
                <p><strong>1. Dorëzimi dhe kthimi:</strong> Klienti merr përsipër të kthejë automjetin në gjendjen që e ka marrë, në vendin e dakordësuar dhe brenda orarit të caktuar.</p>
                <p><strong>2. Shoferi:</strong> Automjeti mund të përdoret vetëm nga shoferi i regjistruar në kontratë, me leje drejtimi të vlefshme. Shoferi duhet të ketë mbushur 21 vjeç.</p>
                <p><strong>3. Sigurimi:</strong> Automjeti është i mbuluar me sigurimin e zgjedhur gjatë rezervimit. Dëmet që nuk mbulohen nga sigurimi janë përgjegjësi e klientit.</p>
                <p><strong>4. Karburanti:</strong> Automjeti dorëzohet me rezervuar të plotë dhe duhet kthyer me rezervuar të plotë, ose tarifë shtesë do të aplikohet.</p>
                <p><strong>5. Trafiku dhe gjobat:</strong> Klienti mban përgjegjësi për çdo gjobë trafiku të kryer gjatë periudhës së qirasë.</p>
                <p><strong>6. Ndotja dhe dëmtimi:</strong> Dëmtimet e brendshme (ndotja e tepërt, dëme nga pirja e duhanit) tarifohen shtesë. Dëmitimet e jashtme raportohen menjëherë.</p>
                <p><strong>7. Deposit:</strong> Një shumë garanci mund të bllokohet në kartën e klientit gjatë periudhës së qirasë dhe lirohet pa kushte pas kthimit të automjetit pa dëme.</p>
                <p><strong>8. Anulimi:</strong> Anulimi 48+ orë para tërhieves është falas. Anulimi me vonesë mund të tarifohet deri në 50% të vlerës totale.</p>
                <p><strong>9. Ligji:</strong> Ky kontrat rregullohet nga ligjet e Republikës së Shqipërisë. Çdo mosmarrëveshje i nënshtrohet Gjykatës së Tiranës.</p>
                <p className="text-neutral-400 italic">Duke nënshkruar, klienti pranon të gjitha kushtet e mësipërme dhe konfirmon se i ka lexuar dhe kuptuar ato.</p>
              </div>

              {/* Terms checkbox */}
              <label className={`flex items-start gap-3 mb-5 cursor-pointer p-3 rounded-lg border transition-colors ${termsAccepted ? "border-primary bg-secondary" : termsError ? "border-error bg-error/5" : "border-border hover:border-neutral-400"}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                />
                <span className="text-sm text-neutral-700">
                  {t("booking.contract.acceptLabel")}
                </span>
              </label>
              {termsError && (
                <p className="text-xs text-error mb-3 flex items-center gap-1">
                  <WarningCircle size={13} weight="regular" />
                  {t("booking.contract.mustAccept")}
                </p>
              )}

              {/* Signature pad */}
              <div className="mb-1">
                <p className="text-sm font-medium text-neutral-700 mb-2">{t("booking.contract.signatureLabel")}</p>
                <SignaturePad
                  onSign={(data) => {
                    setSignatureData(data);
                    setSignatureError(false);
                    setContractDownloaded(false);
                  }}
                  onClear={() => {
                    setSignatureData(null);
                    setContractDownloaded(false);
                  }}
                  signed={!!signatureData}
                />
                {signatureError && (
                  <p className="text-xs text-error mt-2 flex items-center gap-1">
                    <WarningCircle size={13} weight="regular" />
                    {t("booking.contract.signatureRequired")}
                  </p>
                )}
              </div>

              {/* Download Contract PDF — shows after signing */}
              {signatureData && (
                <div className={`mt-4 rounded-lg border p-4 transition-colors ${contractDownloaded ? "border-success/40 bg-success/5" : "border-primary/30 bg-secondary"}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {contractDownloaded ? t("booking.contract.downloadedTitle") : t("booking.contract.downloadTitle")}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {contractDownloaded ? t("booking.contract.downloadedSubtitle") : t("booking.contract.downloadSubtitle")}
                    </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!car || !signatureData) return;
                        const today = new Date().toLocaleDateString("sq-AL", { year: "numeric", month: "long", day: "numeric" });
                        downloadContractPdf({
                          clientName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim() || "Klient",
                          clientEmail: form.email.trim() || "—",
                          clientPhone: form.phone.trim() || "—",
                          carName: `${car.brand} ${car.model}`,
                          carCategory: car.category,
                          carTransmission: car.transmission,
                          carImage: car.image,
                          pickupLocation: form.pickup || "—",
                          dropoffLocation: form.dropoff || "—",
                          startDate: form.startDate
                            ? new Date(form.startDate).toLocaleDateString("sq-AL")
                            : "—",
                          startTime: form.startTime,
                          endDate: form.endDate
                            ? new Date(form.endDate).toLocaleDateString("sq-AL")
                            : "—",
                          endTime: form.endTime,
                          days,
                          insurance: form.insurance,
                          extras: form.extras,
                          basePrice,
                          extrasTotal,
                          insuranceTotal,
                          discount,
                          total,
                          signatureDataUrl: signatureData,
                          contractDate: today,
                        });
                        setContractDownloaded(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors flex-shrink-0"
                    >
                      <DownloadSimple size={16} weight="regular" />
                      {t("booking.contract.downloadBtn")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {carStatusBlocked && (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
                <span className="text-error text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-error">{t("booking.carUnavailable")}</p>
                  <p className="text-xs text-error/80 mt-0.5">
                    {t("booking.carUnavailableDetail", { status: car?.status })} <a href="/flota" className="underline">{t("header.fleet")}</a>.
                  </p>
                </div>
              </div>
            )}
            {!carStatusBlocked && !isCarAvailable && form.startDate && form.endDate && (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
                <span className="text-error text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-error">{t("booking.dateConflict")}</p>
                  <p className="text-xs text-error/80 mt-0.5">{t("booking.dateConflictDetail")} <a href="/flota" className="underline">{t("header.fleet")}</a>.</p>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={saving || !isCarAvailable}
              className="w-full py-4 rounded-md text-base font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-60"
            >
              {saving ? t("booking.submitting") : !isCarAvailable ? t("booking.unavailableBtn") : t("booking.submit")}
            </button>
            {bookingError && (
              <div className="mt-3 p-3 rounded-md bg-error/10 border border-error/20">
                <p className="text-sm text-error font-medium">{bookingError}</p>
              </div>
            )}
          </form>

          {/* Summary */}
          <div className="lg:col-span-1">
            {/* Mobile toggle */}
            <button
              className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-lg border border-border mb-4 cursor-pointer"
              onClick={() => setSummaryOpen(!summaryOpen)}
              aria-expanded={summaryOpen}
            >
              <span className="text-sm font-medium text-neutral-800">
                {t("booking.summary")}
              </span>
              {summaryOpen ? (
                <CaretUp
                  size={16}
                  weight="regular"
                  className="text-neutral-500"
                />
              ) : (
                <CaretDown
                  size={16}
                  weight="regular"
                  className="text-neutral-500"
                />
              )}
            </button>

            <div className={`lg:block ${summaryOpen ? "block" : "hidden"}`}>
              <div className="sticky top-24 bg-white rounded-lg border border-border p-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                  {t("booking.summaryTitle")}
                </h2>

                <div className="flex gap-3 mb-4 pb-4 border-b border-border">
                  <img
                    src={car.image}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    className="w-20 h-16 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {car.category} · {car.transmission}
                    </p>
                    <p className="text-xs text-neutral-500">
                      €{car.pricePerDay}/ditë
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                    {/* Seasonal base price breakdown in summary */}
                  {/* Active pricing rule discounts */}
                  {pricingRuleResult && pricingRuleResult.appliedDiscounts.map((disc) => {
                    const meta = RULE_TYPE_LABELS[disc.rule.type] ?? { emoji: "🏷️", color: "bg-green-100 text-green-700 border-green-200" };
                    return (
                      <div key={disc.rule.id} className={`text-xs px-2 py-1 rounded-md border inline-flex items-center gap-1 ${meta.color}`}>
                        <span>{disc.label}</span>
                        <span className="font-semibold">-€{disc.discountAmount}</span>
                      </div>
                    );
                  })}
                  {seasonalData && seasonalData.breakdown.length > 1 ? (
                    <>
                      {seasonalData.breakdown.map((b) => {
                        // Scale each season's per-day price by the effective rate ratio
                        // so multi-season breakdowns also reflect surcharges silently
                        const ratio = basePrice > 0 ? carSubtotal / basePrice : 1;
                        const effectivePPD = Math.round(b.pricePerDay * ratio * 100) / 100;
                        const effectiveSubtotal = Math.round(b.subtotal * ratio * 100) / 100;
                        return (
                        <div key={b.season.id} className="flex justify-between text-sm text-neutral-700">
                          <span>{b.season.emoji} {b.days} ditë × €{effectivePPD}</span>
                          <span>€{effectiveSubtotal}</span>
                        </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="flex justify-between text-sm text-neutral-700">
                      <span>
                        {days > 0 && seasonalData
                          ? `${dominantSeason.emoji} ${days} ${t("booking.days")} × €${effectiveDailyRate}`
                          : days > 0
                          ? `${days} ${t("booking.days")} × €${effectiveDailyRate}`
                          : t("booking.discountCode")}
                      </span>
                      <span>€{carSubtotal}</span>
                    </div>
                  )}
                  {days > 0 && hours > 0 && (
                    <div className="text-xs text-neutral-400">
                      {hours} {t("booking.hours")}
                    </div>
                  )}
                  {dominantSeason.multiplier !== 1 && days > 0 && (
                    <div className={`text-xs px-2 py-1 rounded-md border inline-flex items-center gap-1 ${dominantSeason.badgeColor}`}>
                      <Tag size={11} weight="bold" />
                      {dominantSeason.label}
                    </div>
                  )}
                  {locationFeeTotal > 0 && (
                    <div className="flex justify-between text-sm text-amber-700">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} weight="fill" />
                        Tarifë lokacioni
                        {pickupFee > 0 && dropoffFee > 0 ? ` (tërhiqje + kthim)` : ""}
                      </span>
                      <span>+€{locationFeeTotal}</span>
                    </div>
                  )}
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-sm text-neutral-700">
                      <span>{t("booking.extras")}</span>
                      <span>€{extrasTotal}</span>
                    </div>
                  )}
                  {insuranceTotal > 0 && (
                    <div className="flex justify-between text-sm text-neutral-700">
                      <span>{t("booking.insurance2")}</span>
                      <span>€{insuranceTotal}</span>
                    </div>
                  )}
                  {pricingRuleResult && pricingRuleResult.appliedDiscounts
                    .filter((disc) => disc.discountAmount > 0) // surcharges are folded into the rate above
                    .map((disc) => (
                    <div key={disc.rule.id} className="flex justify-between text-sm text-success">
                      <span>{disc.label}</span>
                      <span>-€{disc.discountAmount}</span>
                    </div>
                  ))}
                  {legacyDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>{t("booking.discount")}</span>
                      <span>-€{legacyDiscount}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-base font-semibold text-neutral-900 pt-3 border-t border-border">
                  <span>{t("booking.total")}</span>
                  <span>€{total}</span>
                </div>

                {days === 0 && (
                  <p className="text-xs text-neutral-400 mt-3 text-center">
                    {t("booking.selectDateNote")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
