import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Gear, FloppyDisk, Envelope, Buildings, Globe, Phone, MapPin, InstagramLogo, FacebookLogo, TiktokLogo, Key, CheckCircle, SpinnerGap, WarningCircle, House, Car, Image, UploadSimple, Link as LinkIcon, X as XIcon, FolderOpen } from "@phosphor-icons/react";

const API_BASE = "/api";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("rct_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

interface SettingField {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "password" | "textarea";
  placeholder?: string;
}

const SECTIONS: { id: string; title: string; icon: React.ElementType; description: string; fields: SettingField[] }[] = [
  {
    id: "company",
    title: "Të Dhënat e Kompanisë",
    icon: Buildings,
    description: "Informacione bazë të biznesit që shfaqen në faqe, kontratë, dhe emaile.",
    fields: [
      { key: "company_name", label: "Emri i kompanisë", placeholder: "Rent Car Tirana" },
      { key: "company_email", label: "Email kontakti", type: "email", placeholder: "info@rentcartiranaairport.com" },
      { key: "company_phone", label: "Numri telefonit", placeholder: "+355 69 756 2951" },
      { key: "company_address", label: "Adresa", placeholder: "Rruga e Durrësit, Tiranë, Shqipëri" },
      { key: "company_website", label: "Website", placeholder: "https://rentcartiranaairport.com" },
      { key: "company_vat", label: "NIPT / VAT", placeholder: "L12345678A" },
    ],
  },
  {
    id: "smtp",
    title: "Email SMTP",
    icon: Envelope,
    description: "Konfigurimi i email për dërgimin e konfirmimeve, faturave, dhe njoftimeve.",
    fields: [
      { key: "smtp_host", label: "SMTP Host", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
      { key: "smtp_user", label: "Email / Username", type: "email", placeholder: "noreply@rentcartiranaairport.com" },
      { key: "smtp_password", label: "Fjalëkalimi / App Password", type: "password", placeholder: "••••••••" },
      { key: "smtp_from_name", label: "Emri dërguesit", placeholder: "Rent Car Tirana" },
      { key: "smtp_from_email", label: "Email dërguesit", type: "email", placeholder: "noreply@rentcartiranaairport.com" },
    ],
  },
  {
    id: "emailjs",
    title: "EmailJS (Frontend)",
    icon: Key,
    description: "Kredencialet e EmailJS për dërgimin e emaileve direkt nga browser-i.",
    fields: [
      { key: "emailjs_public_key", label: "Public Key", placeholder: "YOUR_EMAILJS_PUBLIC_KEY" },
      { key: "emailjs_service_id", label: "Service ID", placeholder: "service_xxxxxx" },
      { key: "emailjs_template_booking", label: "Template: Konfirmim Rezervimi", placeholder: "template_booking_confirm" },
      { key: "emailjs_template_reminder", label: "Template: Kujtesë", placeholder: "template_pickup_reminder" },
      { key: "emailjs_template_invoice", label: "Template: Faturë", placeholder: "template_invoice" },
      { key: "emailjs_template_contact", label: "Template: Formë Kontakti", placeholder: "template_contact_form" },
    ],
  },
  {
    id: "social",
    title: "Rrjetet Sociale",
    icon: Globe,
    description: "Linqet e rrjeteve sociale të shfaqura në faqe.",
    fields: [
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/rentcartirana" },
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/rentcartirana" },
      { key: "social_tiktok", label: "TikTok URL", placeholder: "https://tiktok.com/@rentcartirana" },
      { key: "social_whatsapp", label: "WhatsApp numri", placeholder: "+355697562951" },
    ],
  },
  {
    id: "booking",
    title: "Cilësimet e Rezervimit",
    icon: Gear,
    description: "Rregullime për procesin e rezervimit online.",
    fields: [
      { key: "booking_min_days", label: "Ditë minimale", type: "number", placeholder: "1" },
      { key: "booking_max_days", label: "Ditë maksimale", type: "number", placeholder: "90" },
      { key: "booking_advance_hours", label: "Orë paraprake minimale", type: "number", placeholder: "24" },
      { key: "booking_pickup_locations", label: "Vendndodhjet e tërheqjes (me presje)", type: "textarea", placeholder: "Aeroport Nënë Tereza, Tiranë Qendër, Durrës..." },
      { key: "booking_cancellation_hours", label: "Orë pa tarifë anulimi", type: "number", placeholder: "48" },
      { key: "booking_deposit_percent", label: "Depozitë % ", type: "number", placeholder: "0" },
    ],
  },
  {
    id: "banners",
    title: "Banerat e Faqes",
    icon: Image,
    description: "Vendosni URL-të e imazheve kryesore (hero) për faqet e ndryshme.",
    fields: [
      { key: "banner_hero", label: "Hero i Faqes Kryesore", placeholder: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1200&q=80" },
      { key: "banner_about", label: "Seksioni 'Rreth Nesh'", placeholder: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80" },
    ],
  },
  {
    id: "homepage",
    title: "Faqja Kryesore",
    icon: House,
    description: "Zgjidhni cilat makina do të shfaqen në faqen kryesore.",
    fields: [],
  },
];

export default function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("company");
  const [cars, setCars] = useState<{ id: string; brand: string; model: string; image?: string }[]>([]);
  const [mediaPickerFor, setMediaPickerFor] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<"gallery" | "upload" | "url">("gallery");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        // Flatten grouped settings into flat key-value
        const flat: Record<string, string> = {};
        if (data.raw) {
          for (const row of data.raw) {
            flat[row.setting_key] = row.setting_value || "";
          }
        }
        setSettings(flat);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch cars for homepage selector
    fetch(`${API_BASE}/cars`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.cars || [];
        setCars(list.map((c: any) => ({ id: c.id, brand: c.brand, model: c.model, image: c.image })));
      })
      .catch(() => {});
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const selectedCarIds = (settings["homepage_featured_cars"] || "").split(",").filter(Boolean);

  const toggleCar = (carId: string | number) => {
    const id = String(carId);
    const current = new Set(selectedCarIds);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    handleChange("homepage_featured_cars", Array.from(current).join(","));
  };

  const openMediaPicker = (fieldKey: string) => {
    setMediaPickerFor(fieldKey);
    setMediaTab("gallery");
    setUploadPreview(null);
  };

  const selectMedia = (url: string) => {
    if (mediaPickerFor) {
      handleChange(mediaPickerFor, url);
    }
    setMediaPickerFor(null);
    setUploadPreview(null);
  };

  const handleFileUpload = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // All available images from car gallery
  const galleryImages = cars
    .filter((c) => c.image && !c.image.includes("placeholder"))
    .map((c) => ({ url: c.image!, label: `${c.brand} ${c.model}` }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gabim gjatë ruajtjes.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerGap size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <Gear size={28} weight="duotone" className="text-primary" />
            Cilësimet
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Konfiguro email, të dhënat e kompanisë, dhe cilësimet e faqes.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-0"
        >
          {saving ? (
            <SpinnerGap size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={16} weight="fill" />
          ) : (
            <FloppyDisk size={16} weight="bold" />
          )}
          {saving ? "Duke ruajtur..." : saved ? "U ruajt!" : "Ruaj ndryshimet"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <WarningCircle size={18} weight="fill" />
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer border-0 text-left ${
                  activeTab === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-600 hover:bg-neutral-100 bg-transparent"
                }`}
              >
                <Icon size={18} weight={activeTab === section.id ? "fill" : "regular"} />
                {section.title}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white rounded-xl border border-border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              {React.createElement(activeSection.icon, { size: 20, weight: "duotone", className: "text-primary" })}
              {activeSection.title}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">{activeSection.description}</p>
          </div>

          {activeSection.id === "homepage" ? (
            <div>
              <p className="text-sm text-neutral-600 mb-3">
                Zgjidhni makinat që doni të shfaqen në faqen kryesore ({selectedCarIds.length} të zgjedhura):
              </p>
              {cars.length === 0 ? (
                <p className="text-sm text-neutral-400 italic">Nuk u gjetën makina.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cars.map((car) => {
                    const isSelected = selectedCarIds.includes(String(car.id));
                    return (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => toggleCar(car.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-white hover:border-neutral-300"
                        }`}
                      >
                        {car.image ? (
                          <img src={car.image} alt="" className="w-14 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-14 h-10 rounded bg-neutral-100 flex items-center justify-center">
                            <Car size={18} className="text-neutral-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-xs text-neutral-400">ID: {car.id}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary bg-primary" : "border-neutral-300"
                        }`}>
                          {isSelected && <CheckCircle size={14} weight="fill" className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" || field.key.startsWith("banner_") ? "md:col-span-2" : ""}>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  {field.label}
                </label>
                {field.key.startsWith("banner_") ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="flex-1 px-3 py-2.5 text-sm border border-border rounded-md outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => openMediaPicker(field.key)}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer border border-border"
                      >
                        <FolderOpen size={15} weight="bold" />
                        Zgjidh
                      </button>
                    </div>
                    {settings[field.key] && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border relative group" style={{ maxHeight: 180 }}>
                        <img src={settings[field.key]} alt={field.label} className="w-full h-full object-cover" style={{ maxHeight: 180 }} />
                        <button
                          type="button"
                          onClick={() => handleChange(field.key, "")}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <XIcon size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-md outline-none focus:border-primary transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={settings[field.key] || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-md outline-none focus:border-primary transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* ── MEDIA PICKER MODAL ─────────────────────────────── */}
      {mediaPickerFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setMediaPickerFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-neutral-900">Zgjidh Imazhin</h3>
              <button onClick={() => setMediaPickerFor(null)} className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 transition-colors cursor-pointer">
                <XIcon size={18} weight="bold" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 pb-2">
              {([
                { id: "gallery" as const, label: "Galeria", icon: Image },
                { id: "upload" as const, label: "Ngarko", icon: UploadSimple },
                { id: "url" as const, label: "URL", icon: LinkIcon },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setMediaTab(t.id); setUploadPreview(null); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    mediaTab === t.id ? "bg-primary/10 text-primary" : "text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {mediaTab === "gallery" && (
                galleryImages.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic text-center py-8">Nuk ka imazhe në galeri.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectMedia(img.url)}
                        className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer aspect-[4/3]"
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <CheckCircle size={24} weight="fill" className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">{img.label}</span>
                      </button>
                    ))}
                  </div>
                )
              )}

              {mediaTab === "upload" && (
                <div className="space-y-4">
                  <label
                    className="flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary/50 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)} />
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <UploadSimple size={32} className="text-neutral-300 mb-2" />
                        <p className="text-sm text-neutral-400">Kliko ose tërhiq imazhin këtu</p>
                        <p className="text-xs text-neutral-300 mt-1">JPG, PNG, WebP</p>
                      </>
                    )}
                  </label>
                  {uploadPreview && (
                    <button
                      onClick={() => selectMedia(uploadPreview)}
                      className="w-full py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Përdor këtë imazh
                    </button>
                  )}
                </div>
              )}

              {mediaTab === "url" && (
                <div className="space-y-4">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={uploadPreview || ""}
                    onChange={(e) => setUploadPreview(e.target.value || null)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-md outline-none focus:border-primary transition-colors"
                  />
                  {uploadPreview && (
                    <>
                      <div className="rounded-lg overflow-hidden border border-border" style={{ maxHeight: 200 }}>
                        <img src={uploadPreview} alt="preview" className="w-full object-cover" style={{ maxHeight: 200 }} />
                      </div>
                      <button
                        onClick={() => selectMedia(uploadPreview)}
                        className="w-full py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Përdor këtë URL
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
