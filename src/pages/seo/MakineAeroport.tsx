import React from "react";
import LLink from "../../components/LLink";
import { AirplaneTilt, MapPin, Clock, CheckCircle, ArrowRight, Phone } from "@phosphor-icons/react";
import Footer from "../../components/Footer";
import { useSEO, buildFAQSchema, buildBreadcrumbSchema } from "../../hooks/useSEO";

const AIRPORT_FAQ = [
  { question: "A ofron shërbim 24 orë nga Aeroporti i Tiranës?", answer: "Po, ofrojmë tërhieje dhe kthim 24/7 nga Aeroporti Ndërkombëtar Nënë Tereza. Stafi ynë ju pret tek dalja e terminalit." },
  { question: "Sa kushton tërhieja nga aeroporti?", answer: "Tërhieja nga Aeroporti Nënë Tereza është plotësisht FALAS. Nuk ka tarifa shtesë për pickup aeroport." },
  { question: "Si e gjej stafin tuaj në aeroport?", answer: "Stafi ynë pret tek dalja e Terminalit Ndërkombëtar (P1) duke mbajtur tabelën me emrin tuaj." },
  { question: "A mund të kthehem makinën jashtë orarit të punës?", answer: "Po, ofrojmë kthim fleksibël edhe jashtë orarit standard. Koordinojmë çdo orë me ekipin tonë 24/7." },
];

const STEPS = [
  { n: "1", title: "Rezervo online", desc: "Plotëso formularin me numrin e fluturimit dhe orën e mbërritjes." },
  { n: "2", title: "Konfirmo rezervimin", desc: "Merr konfirmim me email — asnjë pagesë paradhënie e detyrueshme." },
  { n: "3", title: "Mbërrij në aeroport", desc: "Stafi ynë ju pret tek dalja e terminalit me emrin tuaj." },
  { n: "4", title: "Niso udhëtimin", desc: "Nënshkruani kontratën dhe merrni çelësat. Gëzoni udhëtimin!" },
];

export default function MakineAeroport() {
  useSEO({
    title: "Makinë me Qira nga Aeroporti Nënë Tereza — 24/7 Falas",
    description: "Makinë me qira direkt nga Aeroporti Ndërkombëtar Nënë Tereza. Stafi pret tek terminal me emrin tuaj. Shërbim 24/7 pa tarifë shtesë. Rezervo online tani.",
    keywords: "makinë me qira aeroport tirana, rent a car tirana airport, makine aeroport nene tereza, car rental tirana international airport albania",
    canonical: "/makine-me-qira-aeroport",
    structuredData: [
      buildFAQSchema(AIRPORT_FAQ),
      buildBreadcrumbSchema([
        { name: "Kryefaqja", url: "/" },
        { name: "Makinë nga Aeroporti", url: "/makine-me-qira-aeroport" },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-neutral-900 to-primary text-white overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-5 text-sm">
            <AirplaneTilt size={16} /> Aeroporti Nënë Tereza
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Makinë me Qira nga Aeroporti
          </h1>
          <p className="text-lg text-neutral-200 mb-8 max-w-2xl mx-auto">
            Shërbim tërhieje dhe kthimi 24/7 direkt në Aeroportin Ndërkombëtar Nënë Tereza. Pa pritje, pa stres.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <LLink to="/rezervo?pickup=Aeroporti" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 no-underline">
              Rezervo nga Aeroporti <ArrowRight size={18} />
            </LLink>
            <a href="tel:+355691234567" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white/30 text-white hover:bg-white/10 no-underline">
              <Phone size={16} /> Na telefononi
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-10">Avantazhet e shërbimit aeroport</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Stafi pret direkt tek dalja e terminalit",
              "Disponueshmëri 24 orë, 7 ditë në javë",
              "Asnjë tarifë shtesë për tërhieje nga aeroporti",
              "Kthim i mundshëm edhe jashtë orarit",
              "Fleet me GPS dhe klimë automatike",
              "Sigurim i plotë i përfshirë",
              "Fleksibilitet me numrin e fluturimit",
              "Konfirmim i menjëhershëm me email",
            ].map((b) => (
              <div key={b} className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <CheckCircle size={18} weight="fill" className="text-success shrink-0" />
                <span className="text-sm text-neutral-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-10">Si funksionon</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">{s.n}</div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{s.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="py-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto bg-primary/5 rounded-2xl border border-primary/20 p-8">
          <div className="flex items-start gap-4">
            <MapPin size={24} weight="fill" className="text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">Aeroporti Ndërkombëtar Nënë Tereza</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Rinas, Tiranë 1504, Shqipëri. Pika e takimit: Dalja e Terminalit Ndërkombëtar (P1).
                Stafi ynë mban tabelën me emrin tuaj.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Clock size={14} className="text-neutral-400" />
                <span className="text-xs text-neutral-500">I disponueshëm: 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6 bg-gradient-primary text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Fluturoni drejt Tiranës?</h2>
        <p className="text-blue-100 mb-6">Rezervoni makinën suaj tani dhe ne do ju presim me çelësat gati</p>
        <LLink to="/rezervo?pickup=Aeroporti" className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-primary font-semibold hover:bg-blue-50 no-underline">
          Rezervo tani <ArrowRight size={18} />
        </LLink>
      </section>

      <Footer />
    </div>
  );
}
