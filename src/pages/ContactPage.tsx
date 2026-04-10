import React, { useState } from "react";
import LLink from "../components/LLink";
import {
  MapPin,
  Phone,
  EnvelopeSimple,
  Clock,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
  WhatsappLogo,
  Car,
  FacebookLogo,
  InstagramLogo,
} from "@phosphor-icons/react";
import emailjs from "@emailjs/browser";
import { EMAIL_CONFIG } from "../lib/emailConfig";
import { useSEO, buildLocalBusinessSchema, buildBreadcrumbSchema } from "../hooks/useSEO";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const SUBJECTS = [
  "Rezervim / Pyetje mbi çmimin",
  "Anulim rezervimi",
  "Informacion mbi flotën",
  "Ankesë / Problem",
  "Bashkëpunim biznesi",
  "Tjetër",
];

export default function ContactPage() {
  useSEO({
    title: "Na Kontaktoni — Rent Car Tirana",
    description: "Kontaktoni Rent Car Tirana për rezervime, pyetje, ose ndihmë. Telefon +355 69 756 2951, email, ose formulari online. Disponueshëm 24/7.",
    keywords: "kontakt rent car tirana, telefon makina me qira, email rent a car albania, na kontaktoni",
    canonical: "/kontakt",
    structuredData: [
      buildLocalBusinessSchema(),
      buildBreadcrumbSchema([
        { name: "Kryefaqja", url: "/" },
        { name: "Kontakt", url: "/kontakt" },
      ]),
    ],
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const validate = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Emri është i detyrueshëm";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Email-i nuk është i vlefshëm";
    if (!form.subject) errs.subject = "Zgjidh temën";
    if (!form.message.trim() || form.message.trim().length < 10)
      errs.message = "Mesazhi duhet të ketë të paktën 10 karaktere";
    return errs;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });
    if (!isValid) return;

    setSending(true);
    setError(null);

    const isConfigured =
      EMAIL_CONFIG.PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY" &&
      EMAIL_CONFIG.SERVICE_ID !== "YOUR_SERVICE_ID";

    if (!isConfigured) {
      // Simulate success in dev mode
      await new Promise((r) => setTimeout(r, 1200));
      setSent(true);
      setSending(false);
      return;
    }

    try {
      emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
      await emailjs.send(EMAIL_CONFIG.SERVICE_ID, "template_contact_form", {
        from_name: form.name,
        from_email: form.email,
        from_phone: form.phone || "N/A",
        subject: form.subject,
        message: form.message,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_email: EMAIL_CONFIG.COMPANY_EMAIL,
        to_email: EMAIL_CONFIG.COMPANY_EMAIL,
      });
      setSent(true);
    } catch {
      setError("Dërgimi dështoi. Ju lutem provoni sërish ose na kontaktoni direkt.");
    } finally {
      setSending(false);
    }
  };

  const fieldClass = (field: keyof FormState) =>
    `w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 ${
      touched[field] && errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-neutral-200 focus:border-primary"
    }`;

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
            <EnvelopeSimple size={14} weight="fill" />
            NA KONTAKTONI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Si mund t&#39;ju ndihmojmë?
          </h1>
          <p className="text-neutral-300 text-lg max-w-xl mx-auto">
            Jemi këtu për çdo pyetje rreth rezervimeve, çmimeve apo floiës sonë. Përgjigjemi brenda 2 orësh.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── LEFT: Info cards ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm">
              <h2 className="text-base font-bold text-neutral-800 mb-5">Informacioni ynë</h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} weight="fill" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">Adresa</p>
                    <p className="text-sm text-neutral-700">Bulevardi Zogu I, Nr. 1, Tiranë 1001</p>
                    <a
                      href="https://maps.google.com/?q=Bulevardi+Zogu+I+1+Tirana+Albania"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-0.5 inline-block no-underline"
                    >
                      Hap në Google Maps →
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone size={18} weight="fill" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">Telefon</p>
                    <a href="tel:+355697562951" className="text-sm text-neutral-700 hover:text-primary transition-colors no-underline">
                      +355 69 756 2951
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <EnvelopeSimple size={18} weight="fill" className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">Email</p>
                <a href="mailto:info@rentcartiranaairport.com" className="text-sm text-neutral-700 hover:text-primary transition-colors no-underline">
                info@rentcartiranaairport.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <WhatsappLogo size={18} weight="fill" className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-0.5">WhatsApp</p>
                    <a
                      href="https://wa.me/355697562951"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline no-underline"
                    >
                      Dërgona mesazh
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} weight="fill" className="text-primary" />
                <h2 className="text-base font-bold text-neutral-800">Orari i punës</h2>
              </div>
              <ul className="space-y-2.5">
                {[
                  { day: "E Hënë – E Premte", time: "08:00 – 20:00" },
                  { day: "E Shtunë", time: "09:00 – 18:00" },
                  { day: "E Diel", time: "10:00 – 16:00" },
                ].map((row) => (
                  <li key={row.day} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">{row.day}</span>
                    <span className="font-semibold text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded-md text-xs">{row.time}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-700 font-medium">Jemi hapur tani</span>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm">
              <h2 className="text-base font-bold text-neutral-800 mb-4">Na ndiqni</h2>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors no-underline"
                >
                  <FacebookLogo size={18} weight="fill" />
                  Facebook
                </a>
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-50 text-pink-600 text-sm font-medium hover:bg-pink-100 transition-colors no-underline"
                >
                  <InstagramLogo size={18} weight="fill" />
                  Instagram
                </a>
              </div>
            </div>

            {/* Quick CTA */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white">
              <Car size={28} weight="fill" className="mb-3 opacity-80" />
              <h3 className="font-bold text-lg mb-1">Rezervo tani</h3>
              <p className="text-sm opacity-85 mb-4">
                Gati të nisësh? Shiko flotën tonë dhe rezervo menjëherë.
              </p>
              <LLink
                to="/flota"
                className="inline-flex items-center gap-2 bg-white text-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors no-underline"
              >
                Shiko flotën →
              </LLink>
            </div>
          </div>

          {/* ── RIGHT: Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              {/* Form header */}
              <div className="px-8 py-6 border-b border-neutral-100">
                <h2 className="text-xl font-bold text-neutral-800">Dërgoni mesazh</h2>
                <p className="text-sm text-neutral-500 mt-1">Plotësoni formularin dhe do t&#39;ju kontaktojmë sa më shpejt.</p>
              </div>

              {sent ? (
                <div className="px-8 py-16 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-6">
                    <CheckCircle size={40} weight="fill" className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-800 mb-2">Mesazhi u dërgua!</h3>
                  <p className="text-neutral-500 text-sm max-w-sm mb-8">
                    Faleminderit <strong>{form.name}</strong>! Do t&#39;ju kontaktojmë në <strong>{form.email}</strong> brenda 2 orësh.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); setTouched({}); }}
                      className="px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Dërgo sërisht
                    </button>
                    <LLink
                      to="/"
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors no-underline"
                    >
                      Shko në kryefaqe
                    </LLink>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="px-8 py-8 space-y-5">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                        Emri dhe Mbiemri <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        onBlur={() => handleBlur("name")}
                        placeholder="p.sh. Artan Kelmendi"
                        className={fieldClass("name")}
                      />
                      {touched.name && errors.name && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <WarningCircle size={12} /> {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur("email")}
                        placeholder="email@juaj.com"
                        className={fieldClass("email")}
                      />
                      {touched.email && errors.email && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <WarningCircle size={12} /> {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone + Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                        Telefon <span className="text-neutral-400 font-normal">(opsional)</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+355 6X XXX XXXX"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                        Tema <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        onBlur={() => handleBlur("subject")}
                        className={fieldClass("subject")}
                      >
                        <option value="">Zgjidh temën…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {touched.subject && errors.subject && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <WarningCircle size={12} /> {errors.subject}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Mesazhi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      onBlur={() => handleBlur("message")}
                      placeholder="Shkruani mesazhin tuaj këtu…"
                      className={fieldClass("message") + " resize-none"}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {touched.message && errors.message ? (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <WarningCircle size={12} /> {errors.message}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className={`text-xs ${form.message.length > 0 && form.message.length < 10 ? "text-red-400" : "text-neutral-400"}`}>
                        {form.message.length} karaktere
                      </span>
                    </div>
                  </div>

                  {/* Error banner */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                      <WarningCircle size={18} className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Privacy note */}
                  <p className="text-xs text-neutral-400">
                    Duke dërguar këtë formular, pranoni{" "}
                    <a href="#" className="underline hover:text-neutral-600">politikën e privatësisë</a>{" "}
                    tonë. Nuk ndajmë të dhënat tuaja me palë të treta.
                  </p>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Duke dërguar…
                      </>
                    ) : (
                      <>
                        <PaperPlaneTilt size={18} weight="fill" />
                        Dërgo mesazhin
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map embed placeholder */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-neutral-100 shadow-sm h-56 bg-neutral-200 relative">
              <iframe
                title="Vendndodhja jonë"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.4607963735!2d19.8195!3d41.3275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE5JzM5LjAiTiAxOcKwNDknMTAuMiJF!5e0!3m2!1sen!2sal!4v1620000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
