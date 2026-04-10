/**
 * Generates a printable/downloadable HTML contract as a new window → Print to PDF.
 * No external libraries needed — pure browser API.
 */
export interface ContractData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  carName: string;
  carCategory: string;
  carTransmission: string;
  carImage: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  days: number;
  insurance: string;
  extras: string[];
  basePrice: number;
  extrasTotal: number;
  insuranceTotal: number;
  discount: number;
  total: number;
  signatureDataUrl: string;
  contractDate: string;
}

export function downloadContractPdf(data: ContractData): void {
  const extrasList = data.extras.length > 0
    ? data.extras.map(e => {
        const labels: Record<string, string> = {
          gps: "GPS Navigator (+€5/ditë)",
          "child-seat": "Karrige për fëmijë (+€8/ditë)",
          "extra-driver": "Shtesë shoferi (+€10/ditë)",
          wifi: "Wi-Fi Portativ (+€6/ditë)",
        };
        return labels[e] ?? e;
      }).join(", ")
    : "Asnjë";

  const insuranceLabels: Record<string, string> = {
    basic: "Sigurim bazë (përfshirë)",
    full: "Sigurim i plotë (+€15/ditë)",
    premium: "Sigurim premium (+€25/ditë)",
  };

  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8"/>
  <title>Kontratë Qiraje - ${data.clientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; line-height: 1.6; }
    .page { max-width: 794px; margin: 0 auto; padding: 48px 48px 60px; }

    /* HEADER */
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 28px; }
    .logo-block .company-name { font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
    .logo-block .company-subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .contract-meta { text-align: right; }
    .contract-meta .contract-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .contract-meta .contract-no { font-size: 11px; color: #6b7280; margin-top: 3px; }

    /* SECTION TITLES */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 14px; }

    /* GRID */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 24px; }
    .field label { font-size: 10px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .field span { font-size: 13px; color: #1a1a2e; font-weight: 500; }

    /* CAR BLOCK */
    .car-block { display: flex; gap: 16px; align-items: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .car-block img { width: 110px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
    .car-block .car-info .car-name { font-size: 16px; font-weight: 600; }
    .car-block .car-info .car-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }

    /* PRICE TABLE */
    .price-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .price-table tr td { padding: 7px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .price-table tr td:last-child { text-align: right; font-weight: 500; }
    .price-table .total-row td { border-top: 2px solid #1a1a2e; border-bottom: none; font-weight: 700; font-size: 15px; padding-top: 10px; }
    .discount-row td { color: #16a34a; }

    /* TERMS */
    .terms-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; font-size: 11px; color: #4b5563; line-height: 1.7; }
    .terms-box p { margin-bottom: 6px; }
    .terms-box p:last-child { margin-bottom: 0; }

    /* SIGNATURE AREA */
    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 8px; }
    .sig-box { border-top: 1.5px solid #1a1a2e; padding-top: 8px; }
    .sig-box .sig-label { font-size: 10px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .sig-box .sig-name { font-size: 12px; color: #1a1a2e; font-weight: 600; }
    .sig-img { max-width: 220px; max-height: 72px; margin: 8px 0; }

    /* FOOTER */
    .doc-footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; }

    /* BADGES */
    .badge { display: inline-block; font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 99px; border: 1px solid; }
    .badge-active { background: #dcfce7; color: #15803d; border-color: #86efac; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 32px 40px 48px; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-block">
      <div class="company-name">🚗 RentCar Albania</div>
      <div class="company-subtitle">Shërbim qiraje automjetesh · Tiranë, Shqipëri</div>
      <div class="company-subtitle" style="margin-top:4px;">Tel: +355 69 000 0000 · info@rentcar.al</div>
    </div>
    <div class="contract-meta">
      <div class="contract-title">KONTRATË QIRAJE</div>
      <div class="contract-no">Datë: ${data.contractDate}</div>
      <div class="contract-no" style="margin-top:6px;"><span class="badge badge-active">E NËNSHKRUAR</span></div>
    </div>
  </div>

  <!-- CLIENT INFO -->
  <div class="section">
    <div class="section-title">Të dhënat e klientit</div>
    <div class="grid-3">
      <div class="field"><label>Emri i plotë</label><span>${data.clientName}</span></div>
      <div class="field"><label>Email</label><span>${data.clientEmail}</span></div>
      <div class="field"><label>Telefon</label><span>${data.clientPhone}</span></div>
    </div>
  </div>

  <!-- CAR INFO -->
  <div class="section">
    <div class="section-title">Automjeti</div>
    <div class="car-block">
      <img src="${data.carImage}" alt="${data.carName}" />
      <div class="car-info">
        <div class="car-name">${data.carName}</div>
        <div class="car-meta">${data.carCategory} · ${data.carTransmission}</div>
      </div>
    </div>
  </div>

  <!-- RENTAL DETAILS -->
  <div class="section">
    <div class="section-title">Detaje rezervimi</div>
    <div class="grid-2">
      <div class="field"><label>Vendor tërhiqës</label><span>${data.pickupLocation}</span></div>
      <div class="field"><label>Vendi i kthimit</label><span>${data.dropoffLocation}</span></div>
      <div class="field"><label>Data &amp; Ora e nisjes</label><span>${data.startDate} · ${data.startTime}</span></div>
      <div class="field"><label>Data &amp; Ora e kthimit</label><span>${data.endDate} · ${data.endTime}</span></div>
      <div class="field"><label>Numri i ditëve</label><span>${data.days} ditë</span></div>
      <div class="field"><label>Shtesa</label><span>${extrasList}</span></div>
      <div class="field"><label>Sigurimi</label><span>${insuranceLabels[data.insurance] ?? data.insurance}</span></div>
    </div>
  </div>

  <!-- PRICE BREAKDOWN -->
  <div class="section">
    <div class="section-title">Çmimi</div>
    <table class="price-table">
      <tr><td>Qiraja bazë (${data.days} ditë)</td><td>€${data.basePrice}</td></tr>
      ${data.extrasTotal > 0 ? `<tr><td>Shtesa</td><td>€${data.extrasTotal}</td></tr>` : ""}
      ${data.insuranceTotal > 0 ? `<tr><td>Sigurimi</td><td>€${data.insuranceTotal}</td></tr>` : ""}
      ${data.discount > 0 ? `<tr class="discount-row"><td>Zbritje</td><td>-€${data.discount}</td></tr>` : ""}
      <tr class="total-row"><td>TOTALI</td><td>€${data.total}</td></tr>
    </table>
  </div>

  <!-- TERMS SUMMARY -->
  <div class="section">
    <div class="section-title">Kushtet kryesore të qirasë</div>
    <div class="terms-box">
      <p><strong>1. Dorëzimi dhe kthimi:</strong> Klienti merr përsipër të kthejë automjetin në gjendjen që e ka marrë, në vendin e dakordësuar dhe brenda orarit të caktuar.</p>
      <p><strong>2. Shoferi:</strong> Automjeti mund të përdoret vetëm nga shoferi i regjistruar në kontratë, me leje drejtimi të vlefshme dhe moshë mbi 21 vjeç.</p>
      <p><strong>3. Sigurimi:</strong> Dëmet jashtë mbulimit të sigurimit janë përgjegjësi e klientit. Dëmtimet raportohen menjëherë te kompania.</p>
      <p><strong>4. Karburanti:</strong> Automjeti dorëzohet me rezervuar të plotë dhe duhet kthyer me rezervuar të plotë.</p>
      <p><strong>5. Gjobat &amp; Trafiku:</strong> Klienti mban përgjegjësi për çdo gjobë trafiku gjatë periudhës së qirasë.</p>
      <p><strong>6. Anulimi:</strong> Anulimi 48+ orë para tërhieves është falas. Anulimi me vonesë tarifohet deri 50% e totalit.</p>
      <p><em>Duke nënshkruar, klienti konfirmon se ka lexuar, kuptuar dhe pranuar të gjitha kushtet e mësipërme.</em></p>
    </div>
  </div>

  <!-- SIGNATURE -->
  <div class="section">
    <div class="section-title">Nënshkrimet</div>
    <div class="signature-section">
      <div class="sig-box">
        <div class="sig-label">Nënshkrimi i klientit</div>
        <img class="sig-img" src="${data.signatureDataUrl}" alt="Nënshkrimi i klientit" />
        <div class="sig-name">${data.clientName}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">Datë: ${data.contractDate}</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Nënshkrimi i kompanisë</div>
        <div style="height:72px;display:flex;align-items:flex-end;">
          <div style="font-size:11px;color:#9ca3af;">Autorizuar nga RentCar Albania</div>
        </div>
        <div class="sig-name">RentCar Albania</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">Datë: ${data.contractDate}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    Ky dokument është gjeneruar automatikisht nga sistemi i rezervimeve të RentCar Albania.<br/>
    Kontratë e vlefshme ligjërisht sipas legjislacionit të Republikës së Shqipërisë · Gjykata kompetente: Tiranë
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Lejo pop-up windows për të shkarkuar PDF-in.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  // Slight delay to let images load before print dialog opens
  setTimeout(() => {
    win.print();
  }, 800);
}
