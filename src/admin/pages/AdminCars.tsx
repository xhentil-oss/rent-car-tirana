import React, { useState, useRef, useCallback } from "react";
import { Plus, PencilSimple, Trash, Star, X, Check, ArrowSquareOut, Images, UploadSimple, Link as LinkIcon, MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import { useQuery, useMutation } from "../../hooks/useApi";
import { useNavigate } from "react-router-dom";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import StatusBadge from "../../components/StatusBadge";

// ActivityLog helper
function useActivityLog() {
  const { create } = useMutation("ActivityLog");
  return (action: string, entity: string, entityId: string, description: string) =>
    create({ action, entity, entityId, description, timestamp: new Date() }).catch(() => {});
}

type CarDraftForm = {
  brand: string;
  model: string;
  year: string;
  pricePerDay: string;
  category: string;
  status: string;
  transmission: string;
  fuel: string;
  seats: string;
  luggage: string;
  image: string;
  slug: string;
  featured: boolean;
  quantity: string;
};

type FormErrors = {
  brand?: string;
  model?: string;
  year?: string;
  pricePerDay?: string;
};

const emptyForm: CarDraftForm = {
  brand: "", model: "", year: "", pricePerDay: "", category: "Ekonomike",
  status: "Në dispozicion", transmission: "Automatike", fuel: "Benzinë",
  seats: "5", luggage: "2", image: "", slug: "", featured: false, quantity: "1",
};

// ─── Image Picker Modal ────────────────────────────────────────────────────
type ImagePickerProps = {
  current: string;
  cars: any[];
  onSelect: (url: string) => void;
  onClose: () => void;
};

function ImagePickerModal({ current, cars, onSelect, onClose }: ImagePickerProps) {
  const [tab, setTab] = useState<"library" | "upload" | "url">("library");
  const [search, setSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaItems = (cars ?? []).filter((c) => c.image).map((c) => ({
    id: c.id,
    url: c.image,
    label: `${c.brand} ${c.model} (${c.year})`,
  }));

  const filtered = mediaItems.filter(
    (m) =>
      m.label.toLowerCase().includes(search.toLowerCase()) ||
      m.url.toLowerCase().includes(search.toLowerCase())
  );

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreviewFile(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/60" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-base font-semibold text-neutral-900">Zgjidh imazhin</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-neutral-400 hover:bg-secondary transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 shrink-0">
          {([
            { key: "library", label: "Media Library", icon: <Images size={14} /> },
            { key: "upload", label: "Ngarko nga PC", icon: <UploadSimple size={14} /> },
            { key: "url", label: "URL Manual", icon: <LinkIcon size={14} /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors cursor-pointer border-b-2 ${
                tab === t.key
                  ? "text-primary border-primary bg-primary/5"
                  : "text-neutral-500 border-transparent hover:text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Library Tab ── */}
          {tab === "library" && (
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  placeholder="Kërko imazhe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-neutral-400 gap-2">
                  <Images size={40} />
                  <p className="text-sm">Nuk u gjetën imazhe.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onSelect(item.url); onClose(); }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all text-left ${
                        current === item.url ? "border-primary shadow-md" : "border-transparent hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-24 object-cover bg-neutral-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-car.svg"; }}
                      />
                      <div className="px-2 py-1 bg-white">
                        <p className="text-xs text-neutral-600 truncate">{item.label}</p>
                      </div>
                      {current === item.url && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check size={10} weight="bold" className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Upload Tab ── */}
          {tab === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 h-52 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragging ? "border-primary bg-primary/5" : "border-neutral-200 hover:border-primary/50 hover:bg-neutral-50"
                }`}
              >
                {previewFile ? (
                  <img src={previewFile} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90" />
                ) : (
                  <>
                    <UploadSimple size={32} className="text-neutral-300" />
                    <p className="text-sm text-neutral-400 text-center px-6">
                      Tërhiq imazhin këtu ose <span className="text-primary font-medium">kliko për të zgjedhur</span>
                    </p>
                    <p className="text-xs text-neutral-300">JPG, PNG, WebP · max 10 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {previewFile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPreviewFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="flex-1 py-2.5 rounded-lg border border-border text-sm text-neutral-600 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Anulo
                  </button>
                  <button
                    onClick={() => { if (previewFile) { onSelect(previewFile); onClose(); } }}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Përdor këtë imazh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── URL Tab ── */}
          {tab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1.5">URL e imazhit</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {urlInput && (
                <img
                  src={urlInput}
                  alt="preview"
                  className="w-full h-44 object-cover rounded-xl bg-neutral-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                />
              )}
              <button
                onClick={() => { if (urlInput.trim()) { onSelect(urlInput.trim()); onClose(); } }}
                disabled={!urlInput.trim()}
                className="w-full py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                Përdor këtë URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable image field with picker trigger ──────────────────────────────
function ImagePickerField({ value, cars, onChange }: { value: string; cars: any[]; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Imazhi kryesor</label>
      <div className="space-y-2">
        {value && (
          <img
            src={value}
            alt="preview"
            className="w-full h-32 object-cover rounded-lg bg-neutral-100"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-car.svg"; }}
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border-2 border-dashed border-neutral-200 text-sm text-neutral-600 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <Images size={16} />
          {value ? "Ndrysho imazhin" : "Zgjidh imazhin"}
        </button>
        {value && (
          <p className="text-xs text-neutral-400 font-mono truncate">{value}</p>
        )}
      </div>
      {open && (
        <ImagePickerModal
          current={value}
          cars={cars}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default function AdminCars() {
  const { data: cars, isPending, refetch } = useQuery("Car");
  const { create, update, remove, isPending: isMutating } = useMutation("Car");
  const log = useActivityLog();
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CarDraftForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const filtered = (cars ?? []).filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    return true;
  });

  const openAdd = () => { setEditingCarId(null); setForm(emptyForm); setFormErrors({}); setDrawerOpen(true); };
  const openEdit = (car: any) => {
    setEditingCarId(car.id);
    setForm({
      brand: car.brand, model: car.model, year: String(car.year),
      pricePerDay: String(car.pricePerDay), category: car.category,
      status: car.status, transmission: car.transmission, fuel: car.fuel,
      seats: String(car.seats), luggage: String(car.luggage),
      image: car.image, slug: car.slug, featured: car.featured, quantity: String(car.quantity ?? 1),
    });
    setFormErrors({});
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    // ── Validation ────────────────────────────────────────────
    const errors: FormErrors = {};
    if (!form.brand.trim()) errors.brand = "Marka është e detyrueshme";
    if (!form.model.trim()) errors.model = "Modeli është i detyrueshëm";
    const yearNum = Number(form.year);
    if (!form.year.trim() || isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 2) {
      errors.year = `Viti duhet të jetë midis 1990 dhe ${new Date().getFullYear() + 2}`;
    }
    const priceNum = Number(form.pricePerDay);
    if (!form.pricePerDay.trim() || isNaN(priceNum) || priceNum <= 0) {
      errors.pricePerDay = "Çmimi duhet të jetë një numër pozitiv";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const draft = {
      brand: form.brand, model: form.model, year: Number(form.year),
      pricePerDay: Number(form.pricePerDay), category: form.category,
      status: form.status, transmission: form.transmission, fuel: form.fuel,
      seats: Number(form.seats), luggage: Number(form.luggage),
      image: form.image || "/placeholder-car.svg",
      slug: form.slug || `${form.brand}-${form.model}`.toLowerCase().replace(/\s+/g, "-"),
      featured: form.featured,
      quantity: Number(form.quantity) || 1,
    };
    try {
      if (editingCarId) {
        await update(editingCarId, draft);
        await log("UPDATE", "Car", editingCarId, `Makinë e ndryshuar: ${form.brand} ${form.model} (${form.year})`);
      } else {
        const newCar = await create(draft);
        await log("CREATE", "Car", newCar.id, `Makinë e re shtuar: ${form.brand} ${form.model} (${form.year}) — €${form.pricePerDay}/ditë`);
      }
      await refetch();
      setDrawerOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    const car = (cars ?? []).find(c => c.id === id);
    try {
      await remove(id);
      await log("DELETE", "Car", id, `Makinë e fshirë: ${car ? `${car.brand} ${car.model}` : id}`);
      await refetch();
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
  };

  const handleFeature = async (car: any) => {
    try {
      await update(car.id, { featured: !car.featured });
      await log("UPDATE", "Car", car.id, `${car.brand} ${car.model} — i zgjedhur: ${!car.featured ? "Po" : "Jo"}`);
      await refetch();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">Menaxhimi i flotës</h1>
          <p className="text-neutral-500 text-sm mt-1">{(cars ?? []).length} makina në total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer">
          <Plus size={16} weight="regular" /> Shto makinë
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Filtro sipas statusit">
          <option value="">Të gjitha statuset</option>
          <option value="Në dispozicion">Në dispozicion</option>
          <option value="I rezervuar">I rezervuar</option>
          <option value="Në mirëmbajtje">Në mirëmbajtje</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" aria-label="Filtro sipas kategorisë">
          <option value="">Të gjitha kategoritë</option>
          {["Ekonomike","SUV","Luksoze","Familjare","Automatike"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                {["Makina","Kategoria","Sasia","Statusi","Çmimi/ditë","Veprimet"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableSkeleton rows={5} columns={5} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><EmptyState type={filterStatus || filterCategory ? "search" : "cars"} actionLabel={!filterStatus && !filterCategory ? "Shto makinë" : undefined} onAction={!filterStatus && !filterCategory ? openAdd : undefined} /></td></tr>
              ) : filtered.map((car) => (
                <tr key={car.id} className="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={car.image} alt={`${car.brand} ${car.model}`} loading="lazy" className="w-10 h-8 rounded object-cover" />
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{car.brand} {car.model}</p>
                        <p className="text-xs text-neutral-500">{car.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{car.category}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{car.quantity ?? 1}</td>
                  <td className="px-4 py-3"><StatusBadge status={car.status} /></td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">€{car.pricePerDay}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleFeature(car)} className={`p-1.5 rounded transition-colors duration-200 cursor-pointer ${car.featured ? "text-accent bg-accent/10" : "text-neutral-400 hover:text-accent hover:bg-accent/10"}`} aria-label={car.featured ? "Hiq nga të zgjedhurat" : "Shto te të zgjedhurat"}>
                        <Star size={16} weight={car.featured ? "fill" : "regular"} />
                      </button>
                      <button onClick={() => openEdit(car)} className="p-1.5 rounded text-neutral-400 hover:text-primary hover:bg-secondary transition-colors duration-200 cursor-pointer" aria-label={`Ndrysho ${car.brand} ${car.model}`}>
                        <PencilSimple size={16} weight="regular" />
                      </button>
                      <button onClick={() => navigate(`/admin/flota/${car.id}`)} className="p-1.5 rounded text-neutral-400 hover:text-primary hover:bg-secondary transition-colors duration-200 cursor-pointer" aria-label={`Detajet e plota të ${car.brand} ${car.model}`}>
                        <ArrowSquareOut size={16} weight="regular" />
                      </button>
                      <button onClick={() => setDeleteConfirm(car.id)} className="p-1.5 rounded text-neutral-400 hover:text-error hover:bg-error/10 transition-colors duration-200 cursor-pointer" aria-label={`Fshi ${car.brand} ${car.model}`}>
                        <Trash size={16} weight="regular" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-neutral-900/55 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Konfirmo fshirjen</h3>
            <p className="text-sm text-neutral-500 mb-6">Jeni të sigurt? Ky veprim nuk mund të kthehet.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-md text-sm font-medium border border-border text-neutral-700 bg-white hover:bg-secondary transition-colors duration-200 cursor-pointer">Anulo</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isMutating} className="flex-1 py-2.5 rounded-md text-sm font-medium bg-error text-error-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-50">Fshi</button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-neutral-900/55" onClick={() => setDrawerOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-neutral-900">{editingCarId ? "Ndrysho makinën" : "Shto makinë të re"}</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-md text-neutral-500 hover:bg-secondary transition-colors duration-200 cursor-pointer"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { id: "brand", label: "Marka", key: "brand" as keyof CarDraftForm },
                { id: "model", label: "Modeli", key: "model" as keyof CarDraftForm },
                { id: "year", label: "Viti", key: "year" as keyof CarDraftForm },
                { id: "price", label: "Çmimi/ditë (€)", key: "pricePerDay" as keyof CarDraftForm },
              ].map((field) => {
                const errKey = field.key as keyof FormErrors;
                const errMsg = formErrors[errKey];
                return (
                  <div key={field.id}>
                    <label htmlFor={`drawer-${field.id}`} className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {field.label} <span className="text-error">*</span>
                    </label>
                    <input
                      id={`drawer-${field.id}`}
                      type="text"
                      value={form[field.key] as string}
                      onChange={(e) => {
                        setForm(prev => ({...prev, [field.key]: e.target.value}));
                        if (formErrors[errKey]) setFormErrors(prev => ({...prev, [errKey]: undefined}));
                      }}
                      className={`w-full px-3 py-2.5 rounded-md border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 transition-colors ${
                        errMsg ? "border-error focus:ring-error/30 focus:border-error" : "border-border focus:ring-primary/40 focus:border-primary"
                      }`}
                    />
                    {errMsg && (
                      <p className="mt-1 text-xs text-error font-medium">{errMsg}</p>
                    )}
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="drawer-seats" className="block text-sm font-medium text-neutral-700 mb-1.5">Vendesh</label>
                  <input id="drawer-seats" type="number" min={2} max={9} value={form.seats} onChange={(e) => setForm(prev => ({...prev, seats: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="drawer-luggage" className="block text-sm font-medium text-neutral-700 mb-1.5">Bagazhi (valixhe)</label>
                  <input id="drawer-luggage" type="number" min={1} max={6} value={form.luggage} onChange={(e) => setForm(prev => ({...prev, luggage: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
                </div>
              </div>
              <div>
                <label htmlFor="drawer-quantity" className="block text-sm font-medium text-neutral-700 mb-1.5">Sasia (sa copë identike)</label>
                <input id="drawer-quantity" type="number" min={1} max={99} value={form.quantity} onChange={(e) => setForm(prev => ({...prev, quantity: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="drawer-transmission" className="block text-sm font-medium text-neutral-700 mb-1.5">Transmetimi</label>
                  <select id="drawer-transmission" value={form.transmission} onChange={(e) => setForm(prev => ({...prev, transmission: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="Automatike">Automatike</option>
                    <option value="Manuale">Manuale</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="drawer-fuel" className="block text-sm font-medium text-neutral-700 mb-1.5">Karburanti</label>
                  <select id="drawer-fuel" value={form.fuel} onChange={(e) => setForm(prev => ({...prev, fuel: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="Benzinë">Benzinë</option>
                    <option value="Naftë">Naftë</option>
                    <option value="Hibrid">Hibrid</option>
                    <option value="Elektrik">Elektrik</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="drawer-category" className="block text-sm font-medium text-neutral-700 mb-1.5">Kategoria</label>
                <select id="drawer-category" value={form.category} onChange={(e) => setForm(prev => ({...prev, category: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {["Ekonomike","SUV","Luksoze","Familjare","Automatike"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="drawer-status" className="block text-sm font-medium text-neutral-700 mb-1.5">Statusi</label>
                <select id="drawer-status" value={form.status} onChange={(e) => setForm(prev => ({...prev, status: e.target.value}))} className="w-full px-3 py-2.5 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="Në dispozicion">Në dispozicion</option>
                  <option value="I rezervuar">I rezervuar</option>
                  <option value="Në mirëmbajtje">Në mirëmbajtje</option>
                </select>
              </div>
              <ImagePickerField
                value={form.image}
                cars={cars ?? []}
                onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
              />
              <button onClick={handleSave} disabled={isMutating} className="w-full py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 cursor-pointer disabled:opacity-50 mt-4">
                {editingCarId ? "Ruaj ndryshimet" : "Shto makinën"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
