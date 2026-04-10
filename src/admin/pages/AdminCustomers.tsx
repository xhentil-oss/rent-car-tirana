import React, { useState } from "react";
import {
  MagnifyingGlass, X, ChatCircle, FileText, Phone, Envelope,
  Warning, Star, Buildings, Plus, PaperPlaneRight, Shield, ShieldSlash,
  Upload, Clock, Crown, Certificate,
} from "@phosphor-icons/react";
import { useQuery, useMutation } from "../../hooks/useApi";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";

function useActivityLog() {
  const { create } = useMutation("ActivityLog");
  return (action: string, entity: string, entityId: string, description: string) =>
    create({ action, entity, entityId, description, timestamp: new Date() }).catch(() => {});
}

const SCORING_TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

const tierColor: Record<string, string> = {
  Diamond: "bg-blue-100 text-blue-700 border border-blue-200",
  Platinum: "bg-purple-100 text-purple-700 border border-purple-200",
  Gold: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Silver: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  Bronze: "bg-orange-100 text-orange-700 border border-orange-200",
};

const typeColor: Record<string, string> = {
  VIP: "bg-gradient-accent text-accent-foreground",
  "Korporatë": "bg-primary text-primary-foreground",
  Standard: "bg-neutral-200 text-neutral-700",
};

type Tab = "overview" | "reservations" | "documents" | "communications" | "chat";

export default function AdminCustomers() {
  const { data: customers, isPending } = useQuery("Customer");
  const { data: reservations } = useQuery("Reservation");
  const { data: documents } = useQuery("CustomerDocument");
  const { data: communications } = useQuery("CommunicationLog");
  const { data: chatMessages } = useQuery("ChatMessage");
  const { update: updateCustomer, create: createCustomer, isPending: isMutating } = useMutation("Customer");
  const log = useActivityLog();
  const { create: createDoc } = useMutation("CustomerDocument");
  const { create: createComm } = useMutation("CommunicationLog");
  const { create: createChat } = useMutation("ChatMessage");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState("");

  // Comm log
  const [commForm, setCommForm] = useState({ type: "Email", subject: "", content: "" });
  const [showCommForm, setShowCommForm] = useState(false);

  // Add customer form
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", type: "Standard", scoringTier: "Bronze", corporateContractId: "" });

  const filtered = (customers ?? []).filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    if (filterType && c.type !== filterType) return false;
    return true;
  });

  const selectedCustomer = selectedCustomerId ? (customers ?? []).find(c => c.id === selectedCustomerId) ?? null : null;

  const customerReservations = selectedCustomer
    ? (reservations ?? []).filter(r => r.customerId === selectedCustomer.id)
    : [];

  const customerDocs = selectedCustomer
    ? (documents ?? []).filter(d => d.customerId === selectedCustomer.id)
    : [];

  const customerComms = selectedCustomer
    ? (communications ?? []).filter(c => c.customerId === selectedCustomer.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const conversationId = selectedCustomer ? `customer-${selectedCustomer.id}` : "";
  const customerChats = selectedCustomer
    ? (chatMessages ?? []).filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const totalSpent = customerReservations
    .filter(r => r.status !== "Cancelled")
    .reduce((s, r) => s + r.totalPrice, 0);

  const handleToggleBlacklist = async (customer: any) => {
    const newVal = !customer.isBlacklisted;
    try {
      await updateCustomer(customer.id, { isBlacklisted: newVal });
      await log("UPDATE", "Customer", customer.id, `${customer.name} — blacklist: ${newVal ? "Bllokuar" : "Zhbllokuar"}`);
    } catch (e) { console.error(e); }
  };

  const handleTierChange = async (customer: any, tier: string) => {
    try {
      await updateCustomer(customer.id, { scoringTier: tier });
      await log("UPDATE", "Customer", customer.id, `${customer.name} — Loyalty Tier ndryshoi → ${tier}`);
    } catch (e) { console.error(e); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedCustomer) return;
    try {
      await createChat({ conversationId, text: chatInput.trim(), isFromAdmin: true });
      setChatInput("");
    } catch (e) { console.error(e); }
  };

  const handleAddComm = async () => {
    if (!commForm.subject.trim() || !commForm.content.trim() || !selectedCustomer) return;
    try {
      await createComm({
        customerId: selectedCustomer.id,
        type: commForm.type,
        subject: commForm.subject,
        content: commForm.content,
        timestamp: new Date(),
      });
      setCommForm({ type: "Email", subject: "", content: "" });
      setShowCommForm(false);
    } catch (e) { console.error(e); }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) return;
    try {
      const created = await createCustomer({
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim(),
        type: newCustomer.type,
        scoringTier: newCustomer.scoringTier,
        isBlacklisted: false,
        corporateContractId: newCustomer.corporateContractId.trim(),
      });
      await log("CREATE", "Customer", created.id, `Klient i ri shtuar: ${newCustomer.name.trim()} (${newCustomer.type})`);
      setNewCustomer({ name: "", email: "", phone: "", type: "Standard", scoringTier: "Bronze", corporateContractId: "" });
      setShowAddCustomer(false);
    } catch (e) { console.error(e); }
  };

  const openCustomer = (id: string) => { setSelectedCustomerId(id); setActiveTab("overview"); };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Profili", icon: Star },
    { id: "reservations", label: "Rezervimet", icon: Clock },
    { id: "documents", label: "Dokumenta", icon: FileText },
    { id: "communications", label: "Komunikimet", icon: Phone },
    { id: "chat", label: "Chat", icon: ChatCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">Klientët</h1>
          <p className="text-neutral-500 text-sm mt-1">{(customers ?? []).length} klientë të regjistruar</p>
        </div>
        <button onClick={() => setShowAddCustomer(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer">
          <Plus size={16} weight="regular" />Shto klient
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kërko klient..." className="pl-9 pr-4 py-2 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 w-64" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
          <option value="">Të gjitha tipet</option>
          <option value="Standard">Standard</option>
          <option value="VIP">VIP</option>
          <option value="Korporatë">Korporatë</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                {["Emri","Telefoni","Email","Tipi","Tier","Statusi","Veprimet"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableSkeleton rows={5} columns={7} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState type={search || filterType ? "search" : "customers"} title={search || filterType ? "Nuk u gjetën klientë" : undefined} description={search || filterType ? "Provoni kritere të tjera kërkimi" : undefined} /></td></tr>
              ) : filtered.map((customer) => (
                <tr key={customer.id} className={`border-b border-border last:border-0 hover:bg-neutral-50 transition-colors duration-150 ${customer.isBlacklisted ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">{customer.name.charAt(0)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-800">{customer.name}</span>
                        {customer.isBlacklisted && <span className="ml-2 text-xs bg-error/10 text-error px-1.5 py-0.5 rounded font-medium">Blacklist</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{customer.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeColor[customer.type] ?? "bg-neutral-200 text-neutral-700"}`}>{customer.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {customer.scoringTier && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColor[customer.scoringTier] ?? tierColor["Bronze"]}`}>
                        <Crown size={10} />{customer.scoringTier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {customer.isBlacklisted
                      ? <span className="text-xs font-medium text-error flex items-center gap-1"><ShieldSlash size={12} />Bllokuar</span>
                      : <span className="text-xs font-medium text-success flex items-center gap-1"><Shield size={12} />Aktiv</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openCustomer(customer.id)} className="text-xs font-medium text-primary hover:underline cursor-pointer">Shiko</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Detajet e ${selectedCustomer.name}`}>
          <div className="absolute inset-0 bg-neutral-900/55" onClick={() => setSelectedCustomerId(null)} />
          <div className="relative bg-white w-full max-w-2xl h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">{selectedCustomer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-900">{selectedCustomer.name}</h2>
                      {selectedCustomer.isBlacklisted && <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full font-medium border border-error/20">⛔ Blacklisted</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[selectedCustomer.type] ?? "bg-neutral-200 text-neutral-700"}`}>{selectedCustomer.type}</span>
                      {selectedCustomer.scoringTier && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierColor[selectedCustomer.scoringTier] ?? tierColor["Bronze"]}`}>
                          <Crown size={10} />{selectedCustomer.scoringTier}
                        </span>
                      )}
                      {selectedCustomer.corporateContractId && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          <Buildings size={10} />Korporatë
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerId(null)} className="p-2 rounded-md text-neutral-500 hover:bg-secondary transition-colors cursor-pointer"><X size={20} /></button>
              </div>

              {/* Scoring Tier Selector */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Loyalty Tier:</span>
                <div className="flex gap-1">
                  {SCORING_TIERS.map((tier) => (
                    <button key={tier} onClick={() => handleTierChange(selectedCustomer, tier)} disabled={isMutating} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${selectedCustomer.scoringTier === tier ? tierColor[tier] : "bg-white text-neutral-500 border-border hover:border-neutral-400"}`}>{tier}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6 shrink-0 overflow-x-auto">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === id ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{customerReservations.length}</p>
                      <p className="text-xs text-neutral-500 mt-1">Rezervime</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-success">€{totalSpent}</p>
                      <p className="text-xs text-neutral-500 mt-1">Total shpenzuar</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-neutral-800">{customerComms.length}</p>
                      <p className="text-xs text-neutral-500 mt-1">Komunikimet</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {[
                      { label: "Telefoni", value: selectedCustomer.phone, icon: Phone },
                      { label: "Email", value: selectedCustomer.email, icon: Envelope },
                      ...(selectedCustomer.corporateContractId ? [{ label: "Kontrata korporatë", value: selectedCustomer.corporateContractId, icon: Buildings }] : []),
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-border">
                        <div className="flex items-center gap-2 text-sm text-neutral-500"><Icon size={15} />{label}</div>
                        <span className="text-sm font-medium text-neutral-800">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Corporate Contract */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">ID Kontratës Korporatë</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={selectedCustomer.corporateContractId}
                        onBlur={(e) => { if (e.target.value !== selectedCustomer.corporateContractId) updateCustomer(selectedCustomer.id, { corporateContractId: e.target.value }); }}
                        placeholder="p.sh. CORP-2024-001"
                        className="flex-1 px-3 py-2 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Blacklist toggle */}
                  <div className={`rounded-lg p-4 border ${selectedCustomer.isBlacklisted ? "bg-error/5 border-error/20" : "bg-neutral-50 border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Blacklist Management</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{selectedCustomer.isBlacklisted ? "Ky klient është i bllokuar nga shërbimi" : "Klienti mund të bëjë rezervime"}</p>
                      </div>
                      <button onClick={() => handleToggleBlacklist(selectedCustomer)} disabled={isMutating} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 ${selectedCustomer.isBlacklisted ? "bg-success text-success-foreground hover:bg-success/90" : "bg-error text-error-foreground hover:bg-error/90"}`}>
                        {selectedCustomer.isBlacklisted ? <><Shield size={15} />Zhblloko</> : <><ShieldSlash size={15} />Blloko</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── RESERVATIONS ── */}
              {activeTab === "reservations" && (
                <div className="space-y-3">
                  {customerReservations.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-8">Nuk ka rezervime</p>
                  ) : customerReservations.map((res) => (
                    <div key={res.id} className="p-4 bg-neutral-50 rounded-lg border border-border">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-800">{res.carId}</span>
                        <span className="text-sm font-semibold text-primary">€{res.totalPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-neutral-500">{new Date(res.startDate).toLocaleDateString("sq-AL")} → {new Date(res.endDate).toLocaleDateString("sq-AL")}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${res.status === "Active" ? "bg-success text-success-foreground" : res.status === "Confirmed" ? "bg-info text-info-foreground" : res.status === "Pending" ? "bg-warning text-warning-foreground" : "bg-neutral-200 text-neutral-700"}`}>{res.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">Dokumenta të ngarkuara</h3>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer hover:underline">
                      <Upload size={14} />Ngarko dokument
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selectedCustomer) return;
                        try {
                          await createDoc({ customerId: selectedCustomer.id, documentType: "ID", fileUrl: URL.createObjectURL(file), expiryDate: undefined });
                        } catch (err) { console.error(err); }
                      }} />
                    </label>
                  </div>
                  {customerDocs.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-50 rounded-lg border border-dashed border-border">
                      <FileText size={32} className="text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Nuk ka dokumente të ngarkuara</p>
                      <p className="text-xs text-neutral-300 mt-1">Ngarko ID, Pasaportë ose Patentë</p>
                    </div>
                  ) : customerDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center"><FileText size={18} className="text-primary" /></div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{doc.documentType}</p>
                          {doc.expiryDate && <p className="text-xs text-neutral-400">Skadon: {new Date(doc.expiryDate).toLocaleDateString("sq-AL")}</p>}
                        </div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Shiko</a>
                    </div>
                  ))}
                </div>
              )}

              {/* ── COMMUNICATIONS ── */}
              {activeTab === "communications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">Historia e komunikimit</h3>
                    <button onClick={() => setShowCommForm(!showCommForm)} className="flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer hover:underline"><Plus size={14} />Shto kontakt</button>
                  </div>

                  {showCommForm && (
                    <div className="p-4 bg-secondary/50 rounded-lg border border-primary/20 space-y-3">
                      <div className="flex gap-2">
                        {["Email","SMS","Call"].map((t) => (
                          <button key={t} onClick={() => setCommForm(prev => ({...prev, type: t}))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${commForm.type === t ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-neutral-600 hover:border-primary"}`}>{t}</button>
                        ))}
                      </div>
                      <input type="text" placeholder="Subjekti" value={commForm.subject} onChange={(e) => setCommForm(prev => ({...prev, subject: e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      <textarea placeholder="Permbajtja..." value={commForm.content} onChange={(e) => setCommForm(prev => ({...prev, content: e.target.value}))} rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowCommForm(false)} className="flex-1 py-2 rounded-lg text-sm border border-border text-neutral-600 hover:bg-neutral-50 cursor-pointer">Anulo</button>
                        <button onClick={handleAddComm} disabled={isMutating} className="flex-1 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 cursor-pointer disabled:opacity-50">Ruaj</button>
                      </div>
                    </div>
                  )}

                  {customerComms.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-8">Nuk ka komunikime të regjistruara</p>
                  ) : customerComms.map((comm) => (
                    <div key={comm.id} className="p-4 bg-neutral-50 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${comm.type === "Email" ? "bg-blue-100 text-blue-700" : comm.type === "SMS" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{comm.type}</span>
                          <span className="text-sm font-medium text-neutral-800">{comm.subject}</span>
                        </div>
                        <span className="text-xs text-neutral-400">{new Date(comm.timestamp).toLocaleDateString("sq-AL")}</span>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">{comm.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── CHAT ── */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-full" style={{ minHeight: "400px" }}>
                  <div className="flex-1 space-y-3 overflow-y-auto pb-4">
                    {customerChats.length === 0 ? (
                      <div className="text-center py-10">
                        <ChatCircle size={36} className="text-neutral-200 mx-auto mb-2" />
                        <p className="text-sm text-neutral-400">Nuk ka mesazhe akoma</p>
                        <p className="text-xs text-neutral-300 mt-1">Filloni bisedën me klientin</p>
                      </div>
                    ) : customerChats.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.isFromAdmin ? "bg-primary text-white rounded-br-sm" : "bg-neutral-100 text-neutral-800 rounded-bl-sm"}`}>
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.isFromAdmin ? "text-white/60" : "text-neutral-400"}`}>{new Date(msg.createdAt).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-border shrink-0 mt-auto">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                      placeholder="Shkruaj mesazh..."
                      className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={handleSendChat} disabled={!chatInput.trim() || isMutating} className="px-4 py-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
                      <PaperPlaneRight size={16} weight="fill" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Drawer */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/55" onClick={() => setShowAddCustomer(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-neutral-900">Shto klient të ri</h2>
              <button onClick={() => setShowAddCustomer(false)} className="p-2 rounded-md text-neutral-500 hover:bg-secondary cursor-pointer"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Emri i plotë *", key: "name" as const, type: "text", placeholder: "Artan Hoxha" },
                { label: "Email *", key: "email" as const, type: "email", placeholder: "email@example.com" },
                { label: "Telefoni", key: "phone" as const, type: "tel", placeholder: "+355 69 ..." },
                { label: "ID Kontratës Korporatë", key: "corporateContractId" as const, type: "text", placeholder: "CORP-2024-001 (opsionale)" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
                  <input type={type} value={newCustomer[key]} onChange={(e) => setNewCustomer(prev => ({...prev, [key]: e.target.value}))} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipi</label>
                <div className="flex gap-2">
                  {["Standard","VIP","Korporatë"].map((t) => (
                    <button key={t} type="button" onClick={() => setNewCustomer(prev => ({...prev, type: t}))} className={`flex-1 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${newCustomer.type === t ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border text-neutral-600 hover:border-primary"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Loyalty Tier</label>
                <div className="flex flex-wrap gap-2">
                  {SCORING_TIERS.map((tier) => (
                    <button key={tier} type="button" onClick={() => setNewCustomer(prev => ({...prev, scoringTier: tier}))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${newCustomer.scoringTier === tier ? tierColor[tier] : "bg-white border-border text-neutral-500 hover:border-neutral-400"}`}>{tier}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddCustomer} disabled={!newCustomer.name.trim() || !newCustomer.email.trim() || isMutating} className="w-full py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 mt-2">
                Shto klientin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
