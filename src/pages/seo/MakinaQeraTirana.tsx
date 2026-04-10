import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CheckCircle, ArrowRight, Clock, ShieldCheck, CurrencyDollar, Star } from "@phosphor-icons/react";
import { useQuery } from "@animaapp/playground-react-sdk";
import CarCard from "../../components/CarCard";
import Footer from "../../components/Footer";
import { useSEO, buildFAQSchema, buildLocalBusinessSchema } from "../../hooks/useSEO";

const FAQ_ITEMS = [
  { question: "Sa kushton marrja me qira e makinës në Tiranë?", answer: "Çmimet fillojnë nga €25 në ditë për makinat ekonomike deri €120 për makinat luksoze. Çmimi varet nga lloji i makinës dhe kohëzgjatja e rezervimit." },
  { question: "A mund të marr makinën nga Aeroporti i Tiranës?", answer: "Po! Ofrojmë shërbim tërhieje dhe kthimi direkt nga Aeroporti Ndërkombëtar Nënë Tereza, 24 orë në ditë." },
  { question: "Cilat dokumente duhen për të marrë makinën me qira?", answer: "Ju nevojiten patenta e shoferit (min 1 vit), karta e identitetit ose pasaporta, dhe karta e kreditit/debitit." },
  { question: "A ka sigurim të makinës me qira?", answer: "Po, çdo makinë vjen me sigurim bazik të përfshirë. Mund të zgjidhni sigurim të plotë ose premium gjatë rezervimit." },
];

export default function MakinaQeraTirana() {
  const { data: cars } = useQuery("Car", { limit: 6 });

  useSEO({
    title: "Makina me Qira Tiranë — Çmime nga €25/ditë",
    description: "Makina me qira në Tiranë me çmime transparente nga €25/ditë. Rezervo online 24/7, marrje nga Aeroporti Nënë Tereza ose qendra e Tiranës. Flota moderne 2020-2024.",
    keywords: "makina me qira tirane, rent a car tirana, macchine a noleggio tirana, makinë me qira çmim, makinë me qira online shqiperi",
    canonical: "/makina-me-qira-tirane",
    structuredData: [
      buildLocalBusinessSchema(),
      buildFAQSchema(FAQ_ITEMS),
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-primary to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://c.animaapp.com/mn8p6q9fyOONvV/img/ai_1.png')] bg-cover bg-center" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4 text-sm">
            <MapPin size={14} /> Tiranë, Shqipëri
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Makina me Qira në Tiranë
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Shërbimi nr.1 i makinave me qira në Tiranë. Rezervo online, merr makinën nga qendra ose aeroporti, çmime transparente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/rezervo" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 transition-colors no-underline text-base">
              Rezervo Tani — Falas <ArrowRight size={18} />
            </Link>
            <Link to="/flota" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/40 text-white font-medium hover:bg-white/10 transition-colors no-underline text-base">
              Shiko Flotën
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-neutral-900 mb-10">Pse të rezervoni me ne?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: CurrencyDollar, title: "Çmime nga €25/ditë", desc: "Ofrojmë çmimet me kompetitive në Tiranë, pa kosto të fshehura." },
              { icon: MapPin, title: "Tërhieje nga Aeroporti", desc: "Marrje dhe kthim direkt në Aeroportin Nënë Tereza pa tarifë shtesë." },
              { icon: Clock, title: "Rezervim 24/7 Online", desc: "Rezervo kur të duash, konfirmim i menjëhershëm me email." },
              { icon: ShieldCheck, title: "Sigurim i plotë", desc: "Çdo makinë vjen me sigurim të plotë bazë të përfshirë." },
              { icon: CheckCircle, title: "Flota moderne", desc: "Makina 2020-2024 me mirëmbajtje të rregullt dhe klimë." },
              { icon: Star, title: "+500 klientë të kënaqur", desc: "Vlerësim mesatar 4.8 yje nga klientët tanë." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-5 rounded-xl bg-secondary/40 border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">{f.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cars */}
      <section className="py-14 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Makinat disponueshme në Tiranë</h2>
          <p className="text-neutral-500 mb-8">Zgjidhni nga flota jonë e makinave të mirëmbajtura</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(cars ?? []).map((car) => <CarCard key={car.id} car={car} />)}
          </div>
          <div className="text-center mt-8">
            <Link to="/flota" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity no-underline">
              Shiko të gjitha makinat <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SEO */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-8 text-center">Pyetjet e shpeshta</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="bg-neutral-50 rounded-xl border border-border group">
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
        <h2 className="text-2xl font-bold mb-3">Gati për të rezervuar?</h2>
        <p className="text-blue-100 mb-6">Rezervo online tani dhe merr makinën kur të duash</p>
        <Link to="/rezervo" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 transition-colors no-underline">
          Rezervo Falas Tani <ArrowRight size={18} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
