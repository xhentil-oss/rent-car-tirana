import React, { useState, useEffect } from "react";
import { Gear, FloppyDisk, Envelope, Buildings, Globe, Phone, MapPin, InstagramLogo, FacebookLogo, TiktokLogo, Key, CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";

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
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("company");

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
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

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
    } catch (err: any) {
      setError(err.message);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
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
        </div>
      </div>
    </div>
  );
}
