import React, { useState } from "react";
import { Star, Check, X, Eye, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery, useMutation } from "../../hooks/useApi";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AdminReviews() {
  const { data: reviews, isPending, refetch } = useQuery("ReviewAdmin", { orderBy: { createdAt: "desc" } });
  const { update, remove, isPending: isMutating } = useMutation("Review");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof reviews extends (infer T)[] ? T : never | null>(null);

  const allReviews = reviews ?? [];
  const filtered = allReviews.filter((r) => {
    if (filter === "pending" && r.approved) return false;
    if (filter === "approved" && !r.approved) return false;
    if (search) return (r.authorName ?? "").toLowerCase().includes(search.toLowerCase()) || (r.text ?? "").toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const total = allReviews.length;
  const pending = allReviews.filter((r) => !r.approved).length;
  const approved = allReviews.filter((r) => r.approved).length;
  const avg = total > 0 ? (allReviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-neutral-900">Vlerësimet</h1>
        <p className="text-neutral-500 text-sm mt-1">Menaxho vlerësimet e klientëve</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gjithsej", value: total, color: "text-neutral-900" },
          { label: "Në pritje", value: pending, color: "text-warning" },
          { label: "Aprovuar", value: approved, color: "text-success" },
          { label: "Mesatarja", value: `⭐ ${avg}`, color: "text-accent" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-lg border border-border p-4">
            <p className="text-xs text-neutral-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-semibold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          {(["all","pending","approved"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${filter === f ? "bg-primary text-white border-primary" : "bg-white text-neutral-700 border-border hover:border-primary hover:text-primary"}`}>
              {f === "all" ? "Të gjitha" : f === "pending" ? "Në pritje" : "Aprovuara"}
            </button>
          ))}
        </div>
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kërko vlerësim..." className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              {["Autori", "Vlerësimi", "Komenti", "Data", "Statusi", "Veprimet"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={6} className="text-center py-12 text-neutral-400">Duke ngarkuar...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState type="search" /></td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-medium text-neutral-800">{r.authorName ?? "Anonim"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={14} weight={r.rating >= s ? "fill" : "regular"} className={r.rating >= s ? "text-accent" : "text-neutral-200"} />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">{r.text}</td>
                <td className="px-4 py-3 text-xs text-neutral-400">{new Date(r.createdAt).toLocaleDateString("sq-AL")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.approved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {r.approved ? "Aprovuar" : "Në pritje"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelected(r as any)} className="p-1.5 rounded text-neutral-400 hover:text-primary hover:bg-secondary cursor-pointer border-0 bg-transparent"><Eye size={15} /></button>
                    {!r.approved && (
                      <button onClick={() => update(r.id, { approved: true }).then(() => refetch())} disabled={isMutating} className="p-1.5 rounded text-neutral-400 hover:text-success hover:bg-success/10 cursor-pointer border-0 bg-transparent" title="Aprovo"><Check size={15} /></button>
                    )}
                    <button onClick={() => remove(r.id).then(() => refetch())} disabled={isMutating} className="p-1.5 rounded text-neutral-400 hover:text-error hover:bg-error/10 cursor-pointer border-0 bg-transparent" title="Fshi"><Trash size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Detaje vlerësimi</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded text-neutral-400 hover:bg-neutral-100 cursor-pointer border-0 bg-transparent"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">{((selected as any).authorName ?? "A")[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{(selected as any).authorName}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={12} weight={(selected as any).rating >= s ? "fill" : "regular"} className={(selected as any).rating >= s ? "text-accent" : "text-neutral-200"} />)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-lg">{(selected as any).text}</p>
              {!(selected as any).approved && (
                <button onClick={() => { update((selected as any).id, { approved: true }).then(() => refetch()); setSelected(null); }} className="w-full py-2.5 rounded-lg text-sm font-medium bg-success text-white hover:opacity-90 cursor-pointer border-0">
                  Aprovo vlerësimin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
