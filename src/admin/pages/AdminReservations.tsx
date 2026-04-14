import React, { useState, useMemo } from "react";
import { Check, X, Eye, Plus, MagnifyingGlass, Calendar, Car, User, MapPin, CurrencyEur, Note, UserPlus, Phone, Envelope, Tag, PencilSimple, Trash, CheckSquare, Square } from "@phosphor-icons/react";
import { useQuery, useMutation, useLazyQuery } from "../../hooks/useApi";
import { calculateSeasonalTotal, getDominantSeason } from "../../lib/seasonalPricing";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import { sendPickupReminder, sendInvoiceEmail, sendReservationConfirmed, sendReservationCancelled, getTomorrowReservations } from "../../lib/emailService";
import { Bell, EnvelopeSimple } from "@phosphor-icons/react";

function useActivityLog() {
  const { create } = useMutation("ActivityLog");
  return (action: string, entity: string, entityId: string, description: string) =>
    create({ action, entity, entityId, description, timestamp: new Date() }).catch(() => {});
}

interface NewReservationForm {
  customerId: string;
  carId: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  notes: string;
  source: "Web" | "Telefon" | "Walk-in";
}

interface NewCustomerForm {
  name: string;
  phone: string;
  email: string;
  type: "Standard" | "VIP" | "Korporatë";
}

const initialNewCustomerState: NewCustomerForm = { name: "", phone: "", email: "", type: "Standard" };
const initialFormState: NewReservationForm = {
  customerId: "", carId: "", pickupLocation: "Tiranë Qendër",
  dropoffLocation: "Tiranë Qendër", startDate: "", startTime: "09:00",
  endDate: "", endTime: "09:00", notes: "", source: "Telefon",
};

const locations = ["Tiranë Qendër","Aeroporti Nënë Tereza","Durrës","Vlorë","Sarandë","Shkodër"];
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return [`${hour}:00`, `${hour}:30`];
}).flat();

export default function AdminReservations() {
  const { data: reservations, isPending: resLoading, refetch: refetchReservations } = useQuery("Reservation", { orderBy: { createdAt: "desc" } });
  const { data: customers, refetch: refetchCustomers } = useQuery("Customer");
  const { data: cars } = useQuery("Car");
  const { create: createReservation, update: updateReservation, remove: removeReservation, isPending: isMutating } = useMutation("Reservation");
  const { create: createCustomer } = useMutation("Customer");
  const log = useActivityLog();

  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<NewReservationForm>(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewReservationForm, string>>>({});
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerForm>(initialNewCustomerState);
  const [newCustomerErrors, setNewCustomerErrors] = useState<Partial<Record<keyof NewCustomerForm, string>>>({});
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({});
  const [sendingReminder, setSendingReminder] = useState(false);
  const [emailSending, setEmailSending] = useState<Record<string, boolean>>({});
  const [emailFeedback, setEmailFeedback] = useState<Record<string, "confirmed" | "cancelled" | null>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editResId, setEditResId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; pickupLocation: string; dropoffLocation: string; startDate: string; endDate: string; startTime: string; endTime: string; notes: string; totalPrice: string }>({ status: "", pickupLocation: "", dropoffLocation: "", startDate: "", endDate: "", startTime: "09:00", endTime: "09:00", notes: "", totalPrice: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectedRes = (reservations ?? []).find(r => r.id === selectedResId) ?? null;

  const filtered = (reservations ?? []).filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const customer = (customers ?? []).find(c => c.id === r.customerId);
      const car = (cars ?? []).find(c => c.id === r.carId);
      return (
        (customer?.name ?? "").toLowerCase().includes(query) ||
        (car ? `${car.brand} ${car.model}` : "").toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const availableCars = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return (cars ?? []).filter(c => c.status !== "Në mirëmbajtje");
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const bookedCarIds = (reservations ?? [])
      .filter((r) => {
        if (r.status === "Cancelled" || r.status === "Completed") return false;
        const resStart = new Date(r.startDate);
        const resEnd = new Date(r.endDate);
        return start <= resEnd && end >= resStart;
      })
      .map((r) => r.carId);
    return (cars ?? []).filter((c) => !bookedCarIds.includes(c.id) && c.status !== "Në mirëmbajtje");
  }, [formData.startDate, formData.endDate, reservations, cars]);

  const selectedCar = useMemo(() => (cars ?? []).find((c) => c.id === formData.carId), [formData.carId, cars]);

  const calculatedPrice = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !selectedCar) return null;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) return null;
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const seasonal = calculateSeasonalTotal(selectedCar.pricePerDay, start, end);
    const dominantSeason = getDominantSeason(start, end);
    return {
      days,
      pricePerDay: selectedCar.pricePerDay,
      total: seasonal.total,
      breakdown: seasonal.breakdown,
      dominantSeason,
    };
  }, [formData.startDate, formData.endDate, selectedCar]);

  const validateNewCustomer = (): boolean => {
    const errors: Partial<Record<keyof NewCustomerForm, string>> = {};
    if (!newCustomerData.name.trim()) errors.name = "Emri është i detyrueshëm";
    if (!newCustomerData.phone.trim()) errors.phone = "Telefoni është i detyrueshëm";
    if (!newCustomerData.email.trim()) { errors.email = "Email-i është i detyrueshëm"; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email)) { errors.email = "Email-i nuk është valid"; }
    setNewCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewCustomer = async () => {
    if (!validateNewCustomer()) return;
    try {
      const newCustomer = await createCustomer({
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim(),
        email: newCustomerData.email.trim(),
        type: newCustomerData.type,
      });
      setFormData((prev) => ({ ...prev, customerId: newCustomer.id }));
      setNewCustomerData(initialNewCustomerState);
      setNewCustomerErrors({});
      setShowNewCustomerForm(false);
      await refetchCustomers();
    } catch (e) { console.error(e); }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewReservationForm, string>> = {};
    if (!formData.customerId) errors.customerId = "Zgjidhni klientin";
    if (!formData.carId) errors.carId = "Zgjidhni makinën";
    if (!formData.startDate) errors.startDate = "Zgjidhni datën e nisjes";
    if (!formData.endDate) errors.endDate = "Zgjidhni datën e kthimit";
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = "Data e kthimit duhet të jetë pas nisjes";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateReservation = async () => {
    if (!validateForm() || !calculatedPrice) return;
    try {
      const newRes = await createReservation({
        carId: formData.carId,
        customerId: formData.customerId,
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        status: "Confirmed",
        totalPrice: calculatedPrice.total,
        insurance: "basic",
        extras: "",
        source: formData.source,
        notes: formData.notes,
      });
      const customerName = getCustomerName(formData.customerId);
      const carName = getCarName(formData.carId);
      await log("CREATE", "Reservation", newRes.id, `Rezervim i ri: ${customerName} — ${carName} (${formData.startDate} → ${formData.endDate}) €${calculatedPrice.total}`);
      setFormData(initialFormState);
      setFormErrors({});
      setShowNewForm(false);
      await refetchReservations();
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setShowNewForm(false);
    setShowNewCustomerForm(false);
    setNewCustomerData(initialNewCustomerState);
    setNewCustomerErrors({});
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateReservation(id, { status });
      const res = (reservations ?? []).find(r => r.id === id);
      const customerName = res ? getCustomerName(res.customerId) : id;
      await log("UPDATE", "Reservation", id, `Statusi ndryshoi → ${status}: ${customerName}`);
      await refetchReservations();

      if (res) {
        const customer = (customers ?? []).find(c => c.id === res.customerId);
        const car = (cars ?? []).find(c => c.id === res.carId);

        if (customer && car) {
          const emailData = {
            customerName: customer.name || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim(),
            customerEmail: customer.email,
            carName: `${car.brand} ${car.model}`,
            startDate: new Date(res.startDate).toLocaleDateString("sq-AL"),
            endDate: new Date(res.endDate).toLocaleDateString("sq-AL"),
            pickupLocation: res.pickupLocation,
            totalPrice: res.totalPrice,
            reservationId: res.id,
          };

          setEmailSending(prev => ({ ...prev, [id]: true }));

          if (status === "Confirmed") {
            await sendReservationConfirmed(emailData);
            setEmailFeedback(prev => ({ ...prev, [id]: "confirmed" }));
          } else if (status === "Cancelled") {
            await sendReservationCancelled(emailData);
            setEmailFeedback(prev => ({ ...prev, [id]: "cancelled" }));
          } else if (status === "Completed") {
            await sendInvoiceEmail({
              customerName: emailData.customerName,
              customerEmail: emailData.customerEmail,
              carName: emailData.carName,
              startDate: emailData.startDate,
              endDate: emailData.endDate,
              totalPrice: emailData.totalPrice,
              reservationId: emailData.reservationId,
              invoiceNo: `INV-${res.id.slice(0, 8).toUpperCase()}`,
            });
          }

          setEmailSending(prev => ({ ...prev, [id]: false }));
          setTimeout(() => setEmailFeedback(prev => ({ ...prev, [id]: null })), 4000);
        }
      }
    } catch (e) { console.error(e); }
  };

  const tomorrowReservations = getTomorrowReservations(reservations ?? []);

  const handleSendReminderForAll = async () => {
    setSendingReminder(true);
    const newSent: Record<string, boolean> = { ...reminderSent };
    for (const res of tomorrowReservations) {
      if (newSent[res.id]) continue;
      const customer = (customers ?? []).find(c => c.id === res.customerId);
      const car = (cars ?? []).find(c => c.id === res.carId);
      if (customer && car) {
        await sendPickupReminder({
          customerName: customer.name,
          customerEmail: customer.email,
          carName: `${car.brand} ${car.model}`,
          pickupLocation: res.pickupLocation,
          startDate: new Date(res.startDate).toLocaleDateString("sq-AL"),
          startTime: res.startTime,
          reservationId: res.id,
        });
        newSent[res.id] = true;
      }
    }
    setReminderSent(newSent);
    setSendingReminder(false);
  };

  const getCustomerName = (customerId: string) => {
    const c = (customers ?? []).find(c => c.id === customerId);
    const name = c?.name?.trim() || `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim();
    return name || customerId;
  };

  const getCarName = (carId: string) => {
    const c = (cars ?? []).find(c => c.id === carId);
    return c ? `${c.brand} ${c.model}` : carId;
  };

  const allFilteredIds = filtered.map((r) => r.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    for (const id of selectedIds) {
      await updateReservation(id, { status });
      const res = (reservations ?? []).find((r) => r.id === id);
      const customerName = res ? getCustomerName(res.customerId) : id;
      await log("UPDATE", "Reservation", id, `Bulk: Statusi → ${status}: ${customerName}`);
    }
    setSelectedIds(new Set());
    await refetchReservations();
  };

  const openEdit = (resId: string) => {
    const res = (reservations ?? []).find((r) => r.id === resId);
    if (!res) return;
    setEditResId(resId);
    setEditForm({
      status: res.status,
      pickupLocation: res.pickupLocation || "Tiranë Qendër",
      dropoffLocation: res.dropoffLocation || "Tiranë Qendër",
      startDate: res.startDate ? new Date(res.startDate).toISOString().split("T")[0] : "",
      endDate: res.endDate ? new Date(res.endDate).toISOString().split("T")[0] : "",
      startTime: res.startTime || "09:00",
      endTime: res.endTime || "09:00",
      notes: res.notes || "",
      totalPrice: String(res.totalPrice ?? ""),
    });
  };

  const handleSaveEdit = async () => {
    if (!editResId) return;
    await updateReservation(editResId, {
      status: editForm.status,
      pickupLocation: editForm.pickupLocation,
      dropoffLocation: editForm.dropoffLocation,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      notes: editForm.notes,
      totalPrice: parseFloat(editForm.totalPrice) || 0,
    });
    await log("UPDATE", "Reservation", editResId, `Përditësohet rezervimi: ${getCustomerName((reservations ?? []).find((r) => r.id === editResId)?.customerId ?? "")}`);
    setEditResId(null);
    await refetchReservations();
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      const res = (reservations ?? []).find((r) => r.id === id);
      const customerName = res ? getCustomerName(res.customerId) : id;
      await removeReservation(id);
      await log("DELETE", "Reservation", id, `Rezervim u fshi: ${customerName}`);
      setDeleteConfirmId(null);
      if (selectedResId === id) setSelectedResId(null);
      await refetchReservations();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-900">Rezervimet</h1>
        <p className="text-neutral-500 text-sm mt-1">{(reservations ?? []).length} rezervime totale</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          {["","Pending","Confirmed","Active","Completed","Cancelled"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-white text-neutral-700 border-border hover:border-primary hover:text-primary"}`}>
              {s === "" ? "Të gjitha" : s === "Pending" ? "Në pritje" : s === "Confirmed" ? "Konfirmuar" : s === "Active" ? "Aktive" : s === "Completed" ? "Përfunduar" : "Anuluar"}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input type="text" placeholder="Kërko rezervim..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-64" />
          </div>
          <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
            <Plus size={18} weight="bold" /> Rezervim i ri
          </button>
        </div>
      </div>

      {/* 24h reminder banner */}
      {tomorrowReservations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {tomorrowReservations.length} rezervim{tomorrowReservations.length > 1 ? "e" : ""} me pickup nesër
              </p>
              <p className="text-xs text-amber-600">Dërgo kujtesë automatike 24h para pickup</p>
            </div>
          </div>
          <button
            onClick={handleSendReminderForAll}
            disabled={sendingReminder || tomorrowReservations.every(r => reminderSent[r.id])}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <EnvelopeSimple size={16} />
            {sendingReminder
              ? "Duke dërguar..."
              : tomorrowReservations.every(r => reminderSent[r.id])
              ? "✓ Dërguar"
              : "Dërgo kujtesë"}
          </button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between gap-4 animate-fade-in">
          <p className="text-sm font-medium text-neutral-800">
            <span className="text-primary font-bold">{selectedIds.size}</span> rezervim{selectedIds.size > 1 ? "e" : ""} të zgjedhura
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkUpdateStatus("Confirmed")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors cursor-pointer">
              <Check size={13} weight="bold" /> Konfirmo
            </button>
            <button onClick={() => bulkUpdateStatus("Active")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
              <Car size={13} weight="bold" /> Aktivo
            </button>
            <button onClick={() => bulkUpdateStatus("Completed")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
              <Check size={13} weight="bold" /> Përfundo
            </button>
            <button onClick={() => bulkUpdateStatus("Cancelled")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors cursor-pointer">
              <X size={13} weight="bold" /> Anulo
            </button>
            <button
              onClick={async () => {
                for (const id of selectedIds) await handleDeleteReservation(id);
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors cursor-pointer"
            >
              <Trash size={13} weight="bold" /> Fshi
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer">
              Hiq zgjedhjen
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="w-10 px-3 py-3">
                  <button onClick={toggleSelectAll} className="p-0.5 cursor-pointer text-neutral-400 hover:text-primary transition-colors" aria-label="Zgjidh të gjitha">
                    {allSelected ? <CheckSquare size={18} weight="fill" className="text-primary" /> : <Square size={18} />}
                  </button>
                </th>
                {["Klienti","Makina","Datat","Totali","Statusi","Pagesa","Veprimet"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resLoading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState type={searchQuery || filterStatus ? "search" : "reservations"} actionLabel={!searchQuery && !filterStatus ? "Shto rezervim" : undefined} onAction={!searchQuery && !filterStatus ? () => setShowNewForm(true) : undefined} /></td></tr>
              ) : filtered.map((res) => (
                <tr key={res.id} className={`border-b border-border last:border-0 hover:bg-neutral-50 transition-colors duration-150 ${selectedIds.has(res.id) ? "bg-primary/5" : ""}`}>
                  <td className="w-10 px-3 py-3">
                    <button onClick={() => toggleSelect(res.id)} className="p-0.5 cursor-pointer text-neutral-400 hover:text-primary transition-colors" aria-label="Zgjidh">
                      {selectedIds.has(res.id) ? <CheckSquare size={18} weight="fill" className="text-primary" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">{getCustomerName(res.customerId)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{getCarName(res.carId)}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {new Date(res.startDate).toLocaleDateString("sq-AL")} → {new Date(res.endDate).toLocaleDateString("sq-AL")}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">€{res.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={res.status} /></td>
                  <td className="px-4 py-3">
                    {res.status === "Completed" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        Paguar
                      </span>
                    ) : res.status === "Cancelled" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-400 border border-neutral-200">
                        Anuluar
                      </span>
                    ) : res.status === "Active" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Në proces
                      </span>
                    ) : res.status === "Confirmed" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Konfirmuar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Në pritje
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedResId(res.id)} className="p-1.5 rounded text-neutral-400 hover:text-primary hover:bg-secondary transition-colors duration-200 cursor-pointer" aria-label="Shiko detajet">
                        <Eye size={16} weight="regular" />
                      </button>
                      <button onClick={() => openEdit(res.id)} className="p-1.5 rounded text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors duration-200 cursor-pointer" aria-label="Modifiko">
                        <PencilSimple size={16} weight="regular" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(res.id)} className="p-1.5 rounded text-neutral-400 hover:text-error hover:bg-error/10 transition-colors duration-200 cursor-pointer" aria-label="Fshi">
                        <Trash size={16} weight="regular" />
                      </button>
                      {emailFeedback[res.id] === "confirmed" && (
                        <span className="flex items-center gap-1 text-xs text-success font-medium px-2 py-1 bg-success/10 rounded-full">
                          <Check size={12} weight="bold" /> Email dërguar
                        </span>
                      )}
                      {emailFeedback[res.id] === "cancelled" && (
                        <span className="flex items-center gap-1 text-xs text-error font-medium px-2 py-1 bg-error/10 rounded-full">
                          <X size={12} weight="bold" /> Email dërguar
                        </span>
                      )}
                      {res.status === "Pending" && !emailFeedback[res.id] && (
                        <>
                          <button
                            onClick={() => updateStatus(res.id, "Confirmed")}
                            disabled={emailSending[res.id]}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-success bg-success/10 hover:bg-success/20 border border-success/20 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                            aria-label="Konfirmo"
                          >
                            <Check size={13} weight="bold" />
                            {emailSending[res.id] ? "..." : "Konfirmo"}
                          </button>
                          <button
                            onClick={() => updateStatus(res.id, "Cancelled")}
                            disabled={emailSending[res.id]}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-error bg-error/10 hover:bg-error/20 border border-error/20 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                            aria-label="Anulo"
                          >
                            <X size={13} weight="bold" />
                            {emailSending[res.id] ? "..." : "Refuzo"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reservation Drawer */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/55" onClick={resetForm} />
          <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-medium text-neutral-900">Rezervim i ri manual</h2>
                <p className="text-sm text-neutral-500">Shto rezervim nga telefoni ose walk-in</p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-md text-neutral-500 hover:bg-secondary transition-colors duration-200 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Note size={16} className="text-neutral-400" />Burimi i rezervimit</label>
                <div className="flex gap-2">
                  {(["Telefon","Walk-in","Web"] as const).map((source) => (
                    <button key={source} type="button" onClick={() => setFormData((prev) => ({ ...prev, source }))} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${formData.source === source ? "bg-primary text-primary-foreground border-primary" : "bg-white text-neutral-700 border-border hover:border-primary"}`}>{source}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700"><User size={16} className="text-neutral-400" />Klienti *</label>
                  {!showNewCustomerForm && (
                    <button type="button" onClick={() => setShowNewCustomerForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
                      <UserPlus size={14} weight="bold" />Klient i ri
                    </button>
                  )}
                </div>
                {showNewCustomerForm ? (
                  <div className="p-4 bg-secondary/50 rounded-lg border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-neutral-800 flex items-center gap-2"><UserPlus size={16} className="text-primary" />Shto klient të ri</h4>
                      <button type="button" onClick={() => { setShowNewCustomerForm(false); setNewCustomerData(initialNewCustomerState); setNewCustomerErrors({}); }} className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"><X size={16} /></button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600 mb-1 block">Emri i plotë *</label>
                      <input type="text" value={newCustomerData.name} onChange={(e) => setNewCustomerData((prev) => ({ ...prev, name: e.target.value }))} placeholder="p.sh. Artan Hoxha" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${newCustomerErrors.name ? "border-error" : "border-border"}`} />
                      {newCustomerErrors.name && <p className="text-xs text-error mt-1">{newCustomerErrors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1"><Phone size={12} />Telefoni *</label>
                        <input type="tel" value={newCustomerData.phone} onChange={(e) => setNewCustomerData((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+355 69 756 2951" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${newCustomerErrors.phone ? "border-error" : "border-border"}`} />
                        {newCustomerErrors.phone && <p className="text-xs text-error mt-1">{newCustomerErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1"><Envelope size={12} />Email *</label>
                        <input type="email" value={newCustomerData.email} onChange={(e) => setNewCustomerData((prev) => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${newCustomerErrors.email ? "border-error" : "border-border"}`} />
                        {newCustomerErrors.email && <p className="text-xs text-error mt-1">{newCustomerErrors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600 mb-1 block">Tipi i klientit</label>
                      <div className="flex gap-2">
                        {(["Standard","VIP","Korporatë"] as const).map((type) => (
                          <button key={type} type="button" onClick={() => setNewCustomerData((prev) => ({ ...prev, type }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${newCustomerData.type === type ? "bg-primary text-primary-foreground border-primary" : "bg-white text-neutral-600 border-border hover:border-primary"}`}>{type}</button>
                        ))}
                      </div>
                    </div>
                    <button type="button" onClick={handleCreateNewCustomer} disabled={isMutating} className="w-full py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                      <Check size={16} weight="bold" />Ruaj klientin
                    </button>
                  </div>
                ) : (
                  <>
                    <select value={formData.customerId} onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${formErrors.customerId ? "border-error" : "border-border"}`}>
                      <option value="">Zgjidhni klientin</option>
                      {(customers ?? []).map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name} - {customer.phone}</option>
                      ))}
                    </select>
                    {formErrors.customerId && <p className="text-xs text-error mt-1">{formErrors.customerId}</p>}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Calendar size={16} className="text-neutral-400" />Data e nisjes *</label>
                  <input type="date" value={formData.startDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${formErrors.startDate ? "border-error" : "border-border"}`} />
                  {formErrors.startDate && <p className="text-xs text-error mt-1">{formErrors.startDate}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Ora e nisjes</label>
                  <select value={formData.startTime} onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Calendar size={16} className="text-neutral-400" />Data e kthimit *</label>
                  <input type="date" value={formData.endDate} min={formData.startDate || new Date().toISOString().split("T")[0]} onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${formErrors.endDate ? "border-error" : "border-border"}`} />
                  {formErrors.endDate && <p className="text-xs text-error mt-1">{formErrors.endDate}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Ora e kthimit</label>
                  <select value={formData.endTime} onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Car size={16} className="text-neutral-400" />Makina * {formData.startDate && formData.endDate && <span className="text-neutral-400 font-normal">({availableCars.length} të disponueshme)</span>}</label>
                <select value={formData.carId} onChange={(e) => setFormData((prev) => ({ ...prev, carId: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${formErrors.carId ? "border-error" : "border-border"}`}>
                  <option value="">Zgjidhni makinën</option>
                  {availableCars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model} - €{car.pricePerDay}/ditë</option>)}
                </select>
                {formErrors.carId && <p className="text-xs text-error mt-1">{formErrors.carId}</p>}
                {selectedCar && (
                  <div className="mt-3 p-3 bg-secondary rounded-lg flex items-center gap-3">
                    <img src={selectedCar.image} alt={`${selectedCar.brand} ${selectedCar.model}`} className="w-16 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-800">{selectedCar.brand} {selectedCar.model}</p>
                      <p className="text-xs text-neutral-500">{selectedCar.transmission} • {selectedCar.fuel} • {selectedCar.seats} vende</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">€{selectedCar.pricePerDay}</p>
                      <p className="text-xs text-neutral-400">për ditë</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><MapPin size={16} className="text-neutral-400" />Merre nga</label>
                  <select value={formData.pickupLocation} onChange={(e) => setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><MapPin size={16} className="text-neutral-400" />Ktheje në</label>
                  <select value={formData.dropoffLocation} onChange={(e) => setFormData((prev) => ({ ...prev, dropoffLocation: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Note size={16} className="text-neutral-400" />Shënime (opsionale)</label>
                <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Shënime të brendshme..." rows={3} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>

              {calculatedPrice && (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CurrencyEur size={18} className="text-primary" />
                      <h3 className="font-medium text-neutral-800">Çmimi</h3>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${calculatedPrice.dominantSeason.badgeColor}`}>
                      <Tag size={11} weight="bold" />
                      {calculatedPrice.dominantSeason.emoji} {calculatedPrice.dominantSeason.label}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {calculatedPrice.breakdown.length > 1 ? (
                      calculatedPrice.breakdown.map((b) => (
                        <div key={b.season.id} className="flex justify-between text-sm">
                          <span className="text-neutral-600">{b.season.emoji} {b.days} ditë × €{b.pricePerDay}</span>
                          <span className="text-neutral-800">€{b.subtotal}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">
                          {calculatedPrice.dominantSeason.emoji} {calculatedPrice.days} ditë × €{calculatedPrice.breakdown[0]?.pricePerDay ?? calculatedPrice.pricePerDay}
                        </span>
                        <span className="text-neutral-800">€{calculatedPrice.total}</span>
                      </div>
                    )}
                    {calculatedPrice.dominantSeason.multiplier !== 1 && (
                      <p className="text-xs text-neutral-500 pl-0.5">
                        {calculatedPrice.dominantSeason.multiplier > 1
                          ? `Çmim i bazë €${calculatedPrice.pricePerDay}/ditë + ${Math.round((calculatedPrice.dominantSeason.multiplier - 1) * 100)}% sezonale`
                          : `Çmim i bazë €${calculatedPrice.pricePerDay}/ditë − ${Math.round((1 - calculatedPrice.dominantSeason.multiplier) * 100)}% zbritje sezonale`}
                      </p>
                    )}
                    <div className="border-t border-primary/20 pt-2 flex justify-between">
                      <span className="font-medium text-neutral-800">Total</span>
                      <span className="text-lg font-semibold text-primary">€{calculatedPrice.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border text-neutral-700 hover:bg-secondary transition-colors cursor-pointer">Anulo</button>
              <button onClick={handleCreateReservation} disabled={!calculatedPrice || isMutating} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Krijo rezervimin</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/55" onClick={() => setSelectedResId(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-neutral-900">Detajet e rezervimit</h2>
              <button onClick={() => setSelectedResId(null)} className="p-2 rounded-md text-neutral-500 hover:bg-secondary transition-colors duration-200 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "ID", value: selectedRes.id },
                { label: "Klienti", value: getCustomerName(selectedRes.customerId) },
                { label: "Makina", value: getCarName(selectedRes.carId) },
                { label: "Tërhiqni nga", value: selectedRes.pickupLocation },
                { label: "Ktheni në", value: selectedRes.dropoffLocation },
                { label: "Data e nisjes", value: new Date(selectedRes.startDate).toLocaleDateString("sq-AL") },
                { label: "Data e kthimit", value: new Date(selectedRes.endDate).toLocaleDateString("sq-AL") },
                { label: "Çmimi total", value: `€${selectedRes.totalPrice}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-neutral-500">{label}</span>
                  <span className="text-sm font-medium text-neutral-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-sm text-neutral-500">Statusi</span>
                <StatusBadge status={selectedRes.status} />
              </div>
              {selectedRes.notes && (
                <div className="pt-2">
                  <p className="text-xs text-neutral-500 mb-1">Shënime</p>
                  <p className="text-sm text-neutral-700">{selectedRes.notes}</p>
                </div>
              )}
            </div>
            {selectedRes.status === "Pending" && (
              <div className="space-y-3 mt-6">
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <EnvelopeSimple size={13} className="text-neutral-400" />
                  Klienti do të marrë email automatik pas konfirmimit ose refuzimit
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { updateStatus(selectedRes.id, "Confirmed"); setSelectedResId(null); }}
                    disabled={emailSending[selectedRes.id]}
                    className="flex-1 py-2.5 rounded-md text-sm font-medium bg-success text-success-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check size={16} weight="bold" />
                    {emailSending[selectedRes.id] ? "Duke dërguar..." : "Konfirmo + Dërgo Email"}
                  </button>
                  <button
                    onClick={() => { updateStatus(selectedRes.id, "Cancelled"); setSelectedResId(null); }}
                    disabled={emailSending[selectedRes.id]}
                    className="flex-1 py-2.5 rounded-md text-sm font-medium bg-error text-error-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X size={16} weight="bold" />
                    {emailSending[selectedRes.id] ? "Duke dërguar..." : "Refuzo + Dërgo Email"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Reservation Drawer */}
      {editResId && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/55" onClick={() => setEditResId(null)} />
          <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-medium text-neutral-900">Modifiko rezervimin</h2>
                <p className="text-sm text-neutral-500">ID: {editResId.slice(0, 8)}...</p>
              </div>
              <button onClick={() => setEditResId(null)} className="p-2 rounded-md text-neutral-500 hover:bg-secondary transition-colors duration-200 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">Statusi</label>
                <select value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {["Pending", "Confirmed", "Active", "Completed", "Cancelled"].map((s) => (
                    <option key={s} value={s}>{s === "Pending" ? "Në pritje" : s === "Confirmed" ? "Konfirmuar" : s === "Active" ? "Aktive" : s === "Completed" ? "Përfunduar" : "Anuluar"}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Calendar size={16} className="text-neutral-400" />Data e nisjes</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Ora e nisjes</label>
                  <select value={editForm.startTime} onChange={(e) => setEditForm((prev) => ({ ...prev, startTime: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Calendar size={16} className="text-neutral-400" />Data e kthimit</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Ora e kthimit</label>
                  <select value={editForm.endTime} onChange={(e) => setEditForm((prev) => ({ ...prev, endTime: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><MapPin size={16} className="text-neutral-400" />Merre nga</label>
                  <select value={editForm.pickupLocation} onChange={(e) => setEditForm((prev) => ({ ...prev, pickupLocation: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><MapPin size={16} className="text-neutral-400" />Ktheje në</label>
                  <select value={editForm.dropoffLocation} onChange={(e) => setEditForm((prev) => ({ ...prev, dropoffLocation: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><CurrencyEur size={16} className="text-neutral-400" />Çmimi total (€)</label>
                <input type="number" min="0" step="0.01" value={editForm.totalPrice} onChange={(e) => setEditForm((prev) => ({ ...prev, totalPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2"><Note size={16} className="text-neutral-400" />Shënime</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex gap-3">
              <button onClick={() => setEditResId(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border text-neutral-700 hover:bg-secondary transition-colors cursor-pointer">Anulo</button>
              <button onClick={handleSaveEdit} disabled={isMutating} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Ruaj ndryshimet</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/60" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <Trash size={20} className="text-error" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Fshi rezervimin</h3>
                <p className="text-xs text-neutral-500">Ky veprim është i pakthyeshëm</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-5">
              A jeni të sigurt që dëshironi të fshini rezervimin e{" "}
              <span className="font-semibold">{getCustomerName((reservations ?? []).find(r => r.id === deleteConfirmId)?.customerId ?? "")}</span>?
              Të gjitha të dhënat do të fshihen përgjithmonë.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border text-neutral-700 hover:bg-secondary transition-colors cursor-pointer">
                Anulo
              </button>
              <button
                onClick={() => handleDeleteReservation(deleteConfirmId)}
                disabled={isMutating}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-error text-error-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Po, fshi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
