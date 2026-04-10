import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Gear, Path, Star } from "@phosphor-icons/react";
import { useQuery } from "@animaapp/playground-react-sdk";
import CarCard from "../../components/CarCard";
import Footer from "../../components/Footer";
import { useSEO, buildFAQSchema, buildBreadcrumbSchema } from "../../hooks/useSEO";

const FAQ_ITEMS = [
  { question: "Pse të zgjedh makinë automatike?", answer: "Makinat automatike janë më të lehta për t'u drejtuar, sidomos në trafik qyteti. Nuk ka levë ndërrimi — ideal për drejtues të papraktikuar me manual ose ata që udhëtojnë shumë." },
  { question: "A kushtojnë më shumë makinat automatike me qira?", answer: "Automatiku zakonisht ka çmim pak më të lartë (+5-10%), por koforti dhe lehtësia e drejtimit e bëjnë vlerën të denjë. Çmimet fillojnë nga €35/ditë." },
  { question: "Cilat modele automatike keni disponueshëm?", answer: "Disponojmë Toyota Corolla Hybrid, BMW Seria 3, Mercedes C-Class, Volkswagen Passat dhe shumë të tjera me kuti automatike DSG/CVT." },
  { question: "A mund të rezervoj makinë automatike nga aeroporti?", answer: "Po! Ofrojmë tërhieje falas nga Aeroporti Nënë Tereza 24/7. Specifikoni 'Automatike' gjatë rezervimit tonline." },
];

export default function MakinaAutomatike() {
  const { data: allCars } = useQuery("Car", { where: { transmission: "Automatike" } });
  const cars = allCars ?? [];

  useSEO({
    title: "Makina Automatike me Qira Tiranë — nga €35/ditë",
    description: "Makina automatike me qira në Tiranë nga €35/ditë. Kuti DSG, CVT dhe hibride. Lehtë për t'u drejtuar në trafik, ideal për udhëtarë ndërkombëtarë. Rezervo online.",
    keywords: "makina automatike me qira tirane, automatic car rental tirana, makinë DSG qira shqiperi, hibrid me qira tirana",
    canonical: "/makina-automatike-me-qira",
    structuredData: [
      buildFAQSchema(FAQ_ITEMS),
      buildBreadcrumbSchema([
        { name: "Kryefaqja", url: "/" },
        { name: "Flota", url: "/flota" },
        { name: "Automatike me Qira", url: "/makina-automatike-me-qira" },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-primary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1400&q=80')] bg-cover bg-center" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-5 text-sm font-medium">
            <Gear size={16} weight="fill" /> Transmision Automatik
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Makina Automatike me Qira
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Drejtoni pa stres në Tiranë dhe Shqipëri. Transmision automatik DSG dhe CVT — komoditet maksimal në çdo situatë trafiku.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/flota?transmision=Automatike" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 transition-colors no-underline text-base">
              Shiko të gjitha automatike <ArrowRight size={18} />
            </Link>
            <Link to="/rezervo" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/40 text-white font-medium hover:bg-white/10 transition-colors no-underline text-base">
              Rezervo tani
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-10">Avantazhet e automatikut</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Path, title: "Lehtësi në trafik", desc: "Pa levë ndërrimi — shoferi fokusohet vetëm te rruga. Ideal në trafik të dendur." },
              { icon: Star, title: "Komoditet superior", desc: "Udhëtim pa lodhje. Kuti DSG/CVT siguron kalime të qetësudhëtimi." },
              { icon: Gear, title: "Teknologji moderne", desc: "Transmisionet e reja automatike janë edhe më ekonomike se ato manualet." },
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
              "Kuti automatike DSG / CVT / Torque Converter",
              "Ideal për drejtues ndërkombëtarë",
              "Klimë automatike duale",
              "Adaptur për rrugë qyteti dhe autostradë",
              "Bluetooth &amp; smartphone integration",
              "Sigurim i plotë bazik i përfshirë",
              "Marrje falas nga Aeroporti Nënë Tereza",
              "Disponueshëm 24/7 online",
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
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Automatike disponueshëm tani</h2>
            <p className="text-neutral-500 mb-8">Rezervo online — konfirmim i menjëhershëm</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
            {cars.length === 0 && (
              <p className="text-neutral-400 text-center py-10">Shiko <Link to="/flota?transmision=Automatike" className="text-primary">flotën tonë</Link> për të gjitha makinat automatike disponueshme.</p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-8 text-center">Pyetjet e shpeshta</h2>
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
        <h2 className="text-2xl font-bold mb-3">Drejtoni pa stres sot</h2>
        <p className="text-blue-100 mb-6">Rezervo makinën automatike tënde online tani</p>
        <Link to="/flota?transmision=Automatike" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 no-underline">
          Shiko Automatike <ArrowRight size={18} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
