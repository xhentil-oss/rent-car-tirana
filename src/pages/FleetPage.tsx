import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import { X, FunnelSimple, SortAscending } from "@phosphor-icons/react";
import { useQuery } from "../hooks/useApi";
import { useTranslation } from "react-i18next";
import CarCard from "../components/CarCard";
import FAQAccordion from "../components/FAQAccordion";
import Footer from "../components/Footer";

const ITEMS_PER_PAGE = 9;

export default function FleetPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get("kategoria") ?? "");
  const [activeTransmission, setActiveTransmission] = useState<string>(searchParams.get("transmision") ?? "");
  const [activeFuel, setActiveFuel] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const cat = searchParams.get("kategoria") ?? "";
    const trans = searchParams.get("transmision") ?? "";
    setActiveCategory(cat);
    setActiveTransmission(trans);
    setPage(1);
  }, [searchParams.toString()]);

  const { data: allCars } = useQuery("Car");
  const cars = allCars ?? [];

  const priceMin = cars.length > 0 ? Math.floor(Math.min(...cars.map((c: any) => c.pricePerDay))) : 20;
  const priceMax = cars.length > 0 ? Math.ceil(Math.max(...cars.map((c: any) => c.pricePerDay))) : 500;
  const effectiveMaxPrice = maxPrice ?? priceMax;

  useEffect(() => {
    if (cars.length > 0 && maxPrice === null) setMaxPrice(priceMax);
  }, [cars.length]);

  const fleetTitle = activeCategory
    ? `Makina ${activeCategory} me Qira Tiranë`
    : `Flota Jonë — ${cars.length > 0 ? cars.length + " Makina" : "Makina me Qira"}`;

  const fleetDesc = activeCategory
    ? `Makina ${activeCategory} me qira në Tiranë. Rezervo online — çmime transparente, marrje nga aeroporti.`
    : `Zgjidhni nga ${cars.length > 0 ? cars.length + " modele" : "flota jonë"} e makinave me qira në Tiranë. Filtro sipas kategorisë, çmimit dhe transmetimit.`;

  useSEO({
    title: fleetTitle,
    description: fleetDesc,
    keywords: `flota makinave qira tirane, ${activeCategory ? activeCategory.toLowerCase() + " me qira," : ""} makina ekonomike, SUV, luksoze me qira shqiperi`,
    canonical: "/flota",
  });

  const categories = ["Ekonomike", "SUV", "Luksoze", "Familjare", "Automatike"];
  const transmissions = ["Automatike", "Manuale"];
  const fuels = ["Benzinë", "Diesel", "Hibrid", "Elektrik"];

  const faqItems = (t("fleet.faqItems", { returnObjects: true }) as { question: string; answer: string }[]);

  const filtered = useMemo(() => {
    const base = cars.filter((car) => {
      if (activeCategory && car.category !== activeCategory) return false;
      if (activeTransmission && car.transmission !== activeTransmission) return false;
      if (activeFuel && car.fuel !== activeFuel) return false;
      if (car.pricePerDay > effectiveMaxPrice) return false;
      return true;
    });
    if (sortBy === "price_asc") return [...base].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sortBy === "price_desc") return [...base].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sortBy === "name_asc") return [...base].sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
    return [...base].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [cars, activeCategory, activeTransmission, activeFuel, effectiveMaxPrice, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const clearFilters = () => {
    setActiveCategory("");
    setActiveTransmission("");
    setActiveFuel("");
    setMaxPrice(priceMax);
    setSortBy("default");
    setPage(1);
  };

  const hasFilters =
    activeCategory || activeTransmission || activeFuel || effectiveMaxPrice < priceMax || sortBy !== "default";

  const FilterChip = ({
    label,
    onRemove,
  }: {
    label: string;
    onRemove: () => void;
  }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
      {label}
      <button
        onClick={onRemove}
        aria-label={t("fleet.removeFilter", { label })}
        className="hover:text-error transition-colors duration-200"
      >
        <X size={12} weight="regular" />
      </button>
    </span>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-white border-b border-border py-8 px-6">
        <div className="max-w-[1440px] mx-auto">
          <h1 className="text-3xl font-medium text-neutral-900 mb-1">
            {t("fleet.title")}
          </h1>
          <p className="text-neutral-500">
            {t("fleet.subtitle", { count: cars.length })}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-border sticky top-[72px] z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <FunnelSimple size={16} weight="regular" />
              <span>{t("fleet.filterLabel")}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(activeCategory === cat ? "" : cat);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-neutral-700 border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {transmissions.map((tr) => (
                <button
                  key={tr}
                  onClick={() => {
                    setActiveTransmission(activeTransmission === tr ? "" : tr);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer ${
                    activeTransmission === tr
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-neutral-700 border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {fuels.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFuel(activeFuel === f ? "" : f);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer ${
                    activeFuel === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-neutral-700 border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="maxPrice"
                className="text-xs text-neutral-600 whitespace-nowrap"
              >
                {t("fleet.maxPrice", { price: effectiveMaxPrice })}
              </label>
              <input
                id="maxPrice"
                type="range"
                min={priceMin}
                max={priceMax}
                value={effectiveMaxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
                className="w-24 accent-primary"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <SortAscending size={16} weight="regular" className="text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="text-xs border border-border rounded-md px-2.5 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="default">{t("fleet.sort.default")}</option>
                <option value="price_asc">{t("fleet.sort.price_asc")}</option>
                <option value="price_desc">{t("fleet.sort.price_desc")}</option>
                <option value="name_asc">{t("fleet.sort.name_asc")}</option>
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-error border border-error hover:bg-error hover:text-error-foreground transition-colors duration-200 cursor-pointer"
              >
                <X size={12} weight="regular" />
                {t("fleet.clearFilters")}
              </button>
            )}
          </div>

          {hasFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeCategory && (
                <FilterChip label={activeCategory} onRemove={() => setActiveCategory("")} />
              )}
              {activeTransmission && (
                <FilterChip label={activeTransmission} onRemove={() => setActiveTransmission("")} />
              )}
              {activeFuel && (
                <FilterChip label={activeFuel} onRemove={() => setActiveFuel("")} />
              )}
              {effectiveMaxPrice < priceMax && (
                <FilterChip
                  label={`Max €${effectiveMaxPrice}/ditë`}
                  onRemove={() => setMaxPrice(priceMax)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 py-10">
        <p className="text-sm text-neutral-500 mb-6">
          {t("fleet.carsFound", { count: filtered.length })}
        </p>

        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((car, i) => (
              <div key={car.id} className={`animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
                <CarCard car={car} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">{t("fleet.noResults")}</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 cursor-pointer"
            >
              {t("fleet.clearFilters")}
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md text-sm font-medium border border-border text-neutral-700 bg-white hover:bg-secondary disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {t("fleet.prev")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-neutral-700 bg-white hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-md text-sm font-medium border border-border text-neutral-700 bg-white hover:bg-secondary disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {t("fleet.next")}
            </button>
          </div>
        )}
      </main>

      <FAQAccordion items={faqItems} title={t("fleet.faqTitle")} />
      <Footer />
    </div>
  );
}
