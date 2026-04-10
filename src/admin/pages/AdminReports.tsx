import React, { useMemo } from "react";
import { DownloadSimple, FileCsv, FilePdf } from "@phosphor-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { revenueData, bookingsBySource, topCars } from "../../data/mockData";
import { useQuery } from "../../hooks/useApi";

const PIE_COLORS = ["hsl(215, 90%, 32%)","hsl(45, 100%, 55%)","hsl(142, 60%, 42%)"];

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
    (reservations ?? []).forEach((r) => {
      const d = new Date(r.startDate);
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
    (reservations ?? []).forEach((r) => { map[r.source ?? "Web"] = (map[r.source ?? "Web"] ?? 0) + 1; });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([source, count]) => ({ source, count: Math.round((count / total) * 100) }));
  }, [reservations]);

  // Live top cars
  const liveTopCars = useMemo(() => {
    if (!reservations?.length) return topCars;
    const map: Record<string, { name: string; bookings: number; revenue: number }> = {};
    (reservations ?? []).forEach((r) => {
      const car = (cars ?? []).find((c) => c.id === r.carId);
      const name = car ? `${car.brand} ${car.model}` : r.carId;
      if (!map[r.carId]) map[r.carId] = { name, bookings: 0, revenue: 0 };
      map[r.carId].bookings += 1;
      map[r.carId].revenue += Number(r.totalPrice ?? 0);
    });
    return Object.values(map).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
  }, [reservations, cars]);

  const maxBookings = Math.max(...liveTopCars.map((c) => c.bookings), 1);

  const exportReservationsCSV = () => {
    const rows = (reservations ?? []).map((r) => {
      const customer = (customers ?? []).find((c) => c.id === r.customerId);
      const car = (cars ?? []).find((c) => c.id === r.carId);
      return {
        ID: r.id,
        Klienti: customer?.name ?? r.customerId,
        Makina: car ? `${car.brand} ${car.model}` : r.carId,
        "Data e nisjes": new Date(r.startDate).toLocaleDateString("sq-AL"),
        "Data e kthimit": new Date(r.endDate).toLocaleDateString("sq-AL"),
        Statusi: r.status,
        "Çmimi total": `€${r.totalPrice}`,
        Burimi: r.source,
      };
    });
    downloadCSV(rows, `rezervime_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportInvoicesCSV = () => {
    const rows = (invoices ?? []).map((inv) => ({
      "Nr. Faturës": inv.invoiceNo,
      "Rezervimi ID": inv.reservationId,
      "Shuma": `€${inv.amount}`,
      "Statusi": inv.status,
      "Afati": new Date(inv.dueDate).toLocaleDateString("sq-AL"),
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
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={liveRevenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 10%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215, 10%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 10%, 50%)" }} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(215, 10%, 80%)", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [`€${value}`, "Të ardhura"]} />
              <Bar dataKey="revenue" fill="hsl(215, 90%, 32%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Rezervimet mujore</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={liveRevenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 10%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215, 10%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 10%, 50%)" }} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(215, 10%, 80%)", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [value, "Rezervime"]} />
              <Line type="monotone" dataKey="bookings" stroke="hsl(45, 100%, 55%)" strokeWidth={2} dot={{ fill: "hsl(45, 100%, 55%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-base font-medium text-neutral-900 mb-4">Rezervimet sipas burimit</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={liveSourceData} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {liveSourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(215, 10%, 80%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {liveSourceData.map((item, i) => (
                <div key={item.source} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-sm text-neutral-700">{item.source}</span>
                  <span className="text-sm font-medium text-neutral-900 ml-auto">{item.count}%</span>
                </div>
              ))}
            </div>
          </div>
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
