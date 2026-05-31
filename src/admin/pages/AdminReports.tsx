import React, { lazy, Suspense, useMemo } from "react";
import { FileCsv, FilePdf } from "@phosphor-icons/react";
import { revenueData, bookingsBySource, topCars } from "../../data/mockData";
import { useQuery } from "../../hooks/useApi";
import { formatLocalDate } from "../../lib/dateHelpers";

// recharts is ~117KB gzipped. Code-split so reports header + CSV buttons render
// instantly while charts stream in.
const RevenueChart = lazy(() => import("../components/ReportsCharts").then((m) => ({ default: m.RevenueChart })));
const BookingsChart = lazy(() => import("../components/ReportsCharts").then((m) => ({ default: m.BookingsChart })));
const SourcePieChart = lazy(() => import("../components/ReportsCharts").then((m) => ({ default: m.SourcePieChart })));

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-neutral-50 rounded-lg animate-pulse" style={{ height }} />
  );
}

function downloadCSV(data: object[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map((row) => keys.map((k) => JSON.stringify((row as any)[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printReport() {
  window.print();
}

export default function AdminReports() {
  const { data: reservations } = useQuery("Reservation");
  const { data: customers } = useQuery("Customer");
  const { data: cars } = useQuery("Car");
  const { data: invoices } = useQuery("Invoice");

  // Live revenue grouped by month
  const liveRevenueData = useMemo(() => {
    if (!reservations?.length) return revenueData;
    const map: Record<string, { revenue: number; bookings: number }> = {};
    (reservations ?? []).forEach((r: any) => {
      // Parse YYYY-MM-DD as local date to avoid timezone shift.
      const match = String(r.startDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
      const d = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(r.startDate);
      const key = d.toLocaleDateString("sq-AL", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { revenue: 0, bookings: 0 };
      map[key].revenue += Number(r.totalPrice ?? 0);
      map[key].bookings += 1;
    });
    const result = Object.entries(map).map(([month, v]) => ({ month, ...v }));
    return result.length ? result : revenueData;
  }, [reservations]);

  // Live source breakdown
  const liveSourceData = useMemo(() => {
    if (!reservations?.length) return bookingsBySource;
    const map: Record<string, number> = {};
    (reservations ?? []).forEach((r: any) => { map[r.source ?? "Web"] = (map[r.source ?? "Web"] ?? 0) + 1; });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([source, count]) => ({ source, count: Math.round((count / total) * 100) }));
  }, [reservations]);

  // O(n) lookup map instead of O(n²) cars.find() per reservation row.
  const carMap = useMemo(
    () => new Map<string, any>((cars ?? []).map((c: any) => [c.id, c])),
    [cars],
  );
  const customerMap = useMemo(
    () => new Map<string, any>((customers ?? []).map((c: any) => [c.id, c])),
    [customers],
  );

  // Live top cars
  const liveTopCars = useMemo(() => {
    if (!reservations?.length) return topCars;
    const map: Record<string, { name: string; bookings: number; revenue: number }> = {};
    (reservations ?? []).forEach((r: any) => {
      const car = carMap.get(r.carId);
      const name = car ? `${car.brand} ${car.model}` : r.carId;
      if (!map[r.carId]) map[r.carId] = { name, bookings: 0, revenue: 0 };
      map[r.carId].bookings += 1;
      map[r.carId].revenue += Number(r.totalPrice ?? 0);
    });
    return Object.values(map).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
  }, [reservations, carMap]);

  const maxBookings = Math.max(...liveTopCars.map((c) => c.bookings), 1);

  const exportReservationsCSV = () => {
    const rows = (reservations ?? []).map((r: any) => {
      const customer = customerMap.get(r.customerId);
      const car = carMap.get(r.carId);
      return {
        ID: r.id,
        Klienti: customer?.name ?? r.customerId,
        Makina: car ? `${car.brand} ${car.model}` : r.carId,
        "Data e nisjes": formatLocalDate(r.startDate),
        "Data e kthimit": formatLocalDate(r.endDate),
        Statusi: r.status,
        "Çmimi total": `€${r.totalPrice}`,
        Burimi: r.source,
      };
    });
    downloadCSV(rows, `rezervime_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportInvoicesCSV = () => {
    const rows = (invoices ?? []).map((inv: any) => ({
      "Nr. Faturës": inv.invoiceNo,
      "Rezervimi ID": inv.reservationId,
      "Shuma": `€${inv.amount}`,
      "Statusi": inv.status,
      "Afati": formatLocalDate(inv.dueDate),
    }));
    downloadCSV(rows, `faturat_${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="space-y-6 print:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">Raportet</h1>
          <p className="text-neutral-500 text-sm mt-1">Analiza e performancës dhe të ardhurave</p>
        </div>
        <div className="flex gap-2 flex-wrap print:hidden">
          <button onClick={exportReservationsCSV} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-border text-neutral-700 bg-white hover:bg-secondary transition-colors cursor-pointer">
            <FileCsv size={16} weight="regular" />Rezervimet CSV
          </button>
          <button onClick={exportInvoicesCSV} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-border text-neutral-700 bg-white hover:bg-secondary transition-colors cursor-pointer">
            <FileCsv size={16} weight="regular" />Faturat CSV
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
            <FilePdf size={16} weight="regular" />Printo / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Të ardhurat mujore (€)</h2>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={liveRevenueData} />
          </Suspense>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Rezervimet mujore</h2>
          <Suspense fallback={<ChartSkeleton />}>
            <BookingsChart data={liveRevenueData} />
          </Suspense>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Rezervimet sipas burimit</h2>
          <Suspense fallback={<ChartSkeleton height={200} />}>
            <SourcePieChart data={liveSourceData} />
          </Suspense>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Makinat më të rezervuara</h2>
          <div className="space-y-3">
            {liveTopCars.map((car, i) => (
              <div key={car.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-800">{car.name}</span>
                    <span className="text-xs text-neutral-500">{car.bookings} rez.</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${(car.bookings / maxBookings) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-medium text-neutral-800 w-20 text-right">€{car.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
