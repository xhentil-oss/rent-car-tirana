import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Mountains, Users, Briefcase } from "@phosphor-icons/react";
import { useQuery } from "../../hooks/useApi";
import CarCard from "../../components/CarCard";
import Footer from "../../components/Footer";
import { useSEO, buildFAQSchema, buildBreadcrumbSchema } from "../../hooks/useSEO";

const FAQ_ITEMS = [
  { question: "Cilat SUV janë disponueshme me qira në Tiranë?", answer: "Ofrojmë një sërë SUV-sh moderne: Toyota RAV4, BMW X5, Hyundai Tucson, Kia Sportage dhe të tjera. Të gjitha me klimë dhe GPS." },
  { question: "Sa kushton qiraja e një SUV në ditë?", answer: "SUV-t fillojnë nga €45/ditë dhe mund të arrijnë €120/ditë për modele luksoze. Çmimet varen nga modeli dhe sezoni." },
  { question: "A mund të shkoj me SUV jashtë Shqipërisë?", answer: "Po, me autorizimin e duhur mund të udhëtoni me SUV-n tonë në vendet fqinje si Kosova, Maqedonia dhe Greqia. Kontaktoni për detaje." },
  { question: "A janë SUV-t me 4x4?", answer: "Disa modele tona SUV janë me trakcion 4x4 të plotë, ideal për terrene malore dhe rrugë të ashpra. Specifikoni nevojën gjatë rezervimit." },
];

export default function MakinaSUV() {
  const { data: allCars } = useQuery("Car", { where: { category: "SUV" } });
  const cars = allCars ?? [];

  useSEO({
    title: "SUV me Qira Tiranë — 4x4 dhe Crossover nga €45/ditë",
    description: "SUV dhe crossover me qira në Tiranë nga €45/ditë. Modele moderne me klimë, GPS, sigurim i përfshirë. Ideal për mal, bregdet dhe udhëtime familjare. Rezervo online.",
    keywords: "SUV me qira tirane, 4x4 me qira shqiperi, crossover rent tirana, BMW X5 RAV4 Tucson me qira",
    canonical: "/makina-suv-me-qira",
    structuredData: [
      buildFAQSchema(FAQ_ITEMS),
      buildBreadcrumbSchema([
        { name: "Kryefaqja", url: "/" },
        { name: "Flota", url: "/flota" },
        { name: "SUV me Qira", url: "/makina-suv-me-qira" },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-neutral-900 via-primary/80 to-primary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[url('https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1400&q=80')] bg-cover bg-center" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-5 text-sm font-medium">
            <Mountains size={16} weight="fill" /> SUV &amp; 4x4 — Tiranë
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            SUV me Qira në Tiranë
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Zbulo terrenet e Shqipërisë me SUV-t tanë modernë. Nga qyteti te malet dhe bregdeti — fuqi dhe komoditet në çdo rrugë.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/flota?kategoria=SUV" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 transition-colors no-underline text-base">
              Shiko SUV-t disponueshëm <ArrowRight size={18} />
            </Link>
            <Link to="/rezervo" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/40 text-white font-medium hover:bg-white/10 transition-colors no-underline text-base">
              Rezervo tani
            </Link>
          </div>
        </div>
      </section>

      {/* Why SUV */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-3">Pse të zgjidhni SUV?</h2>
          <p className="text-center text-neutral-500 mb-10">Ideal për familje, grupe dhe udhëtime aventuroze</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Mountains, title: "Terrene të vështira", desc: "Trakcion 4x4, distancë e lartë nga toka — ideal për male dhe rrugë pa asfallt." },
              { icon: Users, title: "Hapësirë për familjen", desc: "5-7 vende, hapësirë bagazhi e madhe. Komfort i plotë për të gjithë udhëtarët." },
              { icon: Briefcase, title: "Kapacitet bagazhi", desc: "Deri 500L hapësirë bagazhi. Mjafton për valixhet e të gjithë familjes." },
            ].map((f) => (
              <div key={f.title} className="text-center p-6 rounded-xl bg-secondary/40 border border-border">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <f.icon size={28} weight="fill" className="text-primary" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature list */}
      <section className="py-10 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Klimë automatike duale A/C",
              "GPS Navigator i integruar",
              "Sigurim i plotë i përfshirë",
              "Kamera parkimi 360°",
              "Bluetooth & Apple CarPlay",
              "Ngrohje ndenjëse parë &amp; prapa",
              "Sensor parkimi para &amp; prapa",
              "Airbag 6-8 të shumtë",
              "ABS + ESP + traction control",
              "Marrje nga Aeroporti falas",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border">
                <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />
                <span className="text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: f }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cars */}
      {cars.length > 0 && (
        <section className="py-14 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">SUV disponueshëm tani</h2>
            <p className="text-neutral-500 mb-8">Rezervo online — konfirmim i menjëhershëm</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-8 text-center">Pyetjet e shpeshta — SUV me Qira</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="bg-white rounded-xl border border-border group">
                <summary className="px-5 py-4 text-sm font-semibold text-neutral-900 cursor-pointer list-none flex items-center justify-between">
                  {item.question}
                  <ArrowRight size={16} className="text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6 bg-gradient-primary text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Gati për aventurën tjetër?</h2>
        <p className="text-blue-100 mb-6">Rezervo SUV-n tënd online — disponueshëm 24/7</p>
        <Link to="/flota?kategoria=SUV" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 no-underline">
          Shiko SUV-t <ArrowRight size={18} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
