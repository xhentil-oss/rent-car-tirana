import { useState } from "react";
import { useQuery, useMutation } from "../../hooks/useApi";
import { PencilSimple, Trash, Plus, Eye, EyeSlash, MagnifyingGlass, Article } from "@phosphor-icons/react";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[ëé]/g, "e").replace(/[çç]/g, "c").replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface BlogPost {
  id: string;
  titleSq: string;
  titleEn: string;
  slug: string;
  excerptSq: string;
  excerptEn: string;
  contentSq: string;
  contentEn: string;
  coverImage: string;
  tags: string;
  status: string;
  publishedAt: string;
  metaTitleSq: string;
  metaTitleEn: string;
  metaDescSq: string;
  metaDescEn: string;
}

const emptyPost: Omit<BlogPost, "id" | "publishedAt"> = {
  titleSq: "", titleEn: "", slug: "", excerptSq: "", excerptEn: "",
  contentSq: "", contentEn: "", coverImage: "", tags: "",
  status: "draft", metaTitleSq: "", metaTitleEn: "", metaDescSq: "", metaDescEn: "",
};

export default function AdminBlog() {
  const { data, loading, refetch } = useQuery("BlogPostAdmin");
  const posts: BlogPost[] = data ?? [];
  const createPost = useMutation("BlogPost", "POST");
  const updatePost = useMutation("BlogPost", "PUT");
  const deletePost = useMutation("BlogPost", "DELETE");

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"sq" | "en">("sq");

  const filtered = posts.filter(p =>
    p.titleSq.toLowerCase().includes(search.toLowerCase()) ||
    (p.titleEn || "").toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyPost);
    setTab("sq");
    setShowEditor(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      titleSq: post.titleSq, titleEn: post.titleEn || "", slug: post.slug,
      excerptSq: post.excerptSq || "", excerptEn: post.excerptEn || "",
      contentSq: post.contentSq, contentEn: post.contentEn || "",
      coverImage: post.coverImage || "", tags: post.tags || "",
      status: post.status, metaTitleSq: post.metaTitleSq || "", metaTitleEn: post.metaTitleEn || "",
      metaDescSq: post.metaDescSq || "", metaDescEn: post.metaDescEn || "",
    });
    setTab("sq");
    setShowEditor(true);
  };

  const handleSave = async (status?: string) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: status || form.status,
        slug: form.slug || slugify(form.titleSq),
      };
      if (editing) {
        await updatePost.trigger(payload, editing.id);
      } else {
        await createPost.trigger(payload);
      }
      await refetch();
      setShowEditor(false);
    } catch { /* error handled by hook */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Jeni i sigurtë që doni të fshini këtë postim?")) return;
    await deletePost.trigger(undefined, id);
    await refetch();
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-800">
            {editing ? "Ndrysho Postimin" : "Postim i Ri"}
          </h1>
          <button onClick={() => setShowEditor(false)} className="text-sm text-neutral-500 hover:text-neutral-700 cursor-pointer">
            ← Kthehu te lista
          </button>
        </div>

        {/* Language tabs */}
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 w-fit">
          <button onClick={() => setTab("sq")} className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${tab === "sq" ? "bg-white shadow-sm text-primary" : "text-neutral-600 hover:text-neutral-800"}`}>
            🇦🇱 Shqip
          </button>
          <button onClick={() => setTab("en")} className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${tab === "en" ? "bg-white shadow-sm text-primary" : "text-neutral-600 hover:text-neutral-800"}`}>
            🇬🇧 English
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-4">
            {tab === "sq" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Titulli (SQ) *</label>
                  <input value={form.titleSq} onChange={e => { set("titleSq", e.target.value); if (!editing) set("slug", slugify(e.target.value)); }} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Titulli i postimit në shqip" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Përshkrimi i shkurtër (SQ)</label>
                  <textarea value={form.excerptSq} onChange={e => set("excerptSq", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y" placeholder="1-2 fjali përshkruese..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Përmbajtja (SQ) * — HTML</label>
                  <textarea value={form.contentSq} onChange={e => set("contentSq", e.target.value)} rows={16} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono" placeholder="<h2>Titulli...</h2><p>Teksti...</p>" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Title (EN)</label>
                  <input value={form.titleEn} onChange={e => set("titleEn", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Post title in English" />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Excerpt (EN)</label>
                  <textarea value={form.excerptEn} onChange={e => set("excerptEn", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y" placeholder="1-2 sentences..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Content (EN) — HTML</label>
                  <textarea value={form.contentEn} onChange={e => set("contentEn", e.target.value)} rows={16} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y font-mono" placeholder="<h2>Title...</h2><p>Text...</p>" />
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-neutral-800">Cilësimet</h3>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Slug (URL)</label>
                <input value={form.slug} onChange={e => set("slug", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="titulli-postimit" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Imazhi i kopertinës (URL)</label>
                <input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="https://..." />
                {form.coverImage && <img src={form.coverImage} alt="" className="mt-2 rounded-lg h-24 w-full object-cover" />}
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Tags (me presje)</label>
                <input value={form.tags} onChange={e => set("tags", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="tiranë, aeroport, suv" />
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-neutral-800">SEO</h3>
              {tab === "sq" ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Meta Title (SQ)</label>
                    <input value={form.metaTitleSq} onChange={e => set("metaTitleSq", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Meta Description (SQ)</label>
                    <textarea value={form.metaDescSq} onChange={e => set("metaDescSq", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Meta Title (EN)</label>
                    <input value={form.metaTitleEn} onChange={e => set("metaTitleEn", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">Meta Description (EN)</label>
                    <textarea value={form.metaDescEn} onChange={e => set("metaDescEn", e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y" />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSave("published")}
                disabled={saving || !form.titleSq || !form.contentSq}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {saving ? "Duke ruajtur..." : "Publiko"}
              </button>
              <button
                onClick={() => handleSave("draft")}
                disabled={saving || !form.titleSq || !form.contentSq}
                className="w-full py-2.5 rounded-lg text-sm font-medium border border-border text-neutral-700 hover:bg-secondary disabled:opacity-50 cursor-pointer transition-colors"
              >
                {saving ? "Duke ruajtur..." : "Ruaj si draft"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Blog</h1>
          <p className="text-sm text-neutral-500">Menaxho postimet e blogut</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer">
          <Plus size={16} /> Postim i Ri
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kërko postime..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <span className="text-xs text-neutral-500">{filtered.length} postime</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <Article size={40} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{search ? "Asnjë postim nuk u gjet." : "Nuk ka postime ende."}</p>
          <button onClick={openNew} className="mt-3 text-sm text-primary font-medium hover:underline cursor-pointer">
            Krijo postimin e parë
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              {post.coverImage ? (
                <img src={post.coverImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <Article size={24} className="text-neutral-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-neutral-800 truncate">{post.titleSq}</h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    post.status === "published" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {post.status === "published" ? "Publikuar" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate">/blog/{post.slug}</p>
                {post.publishedAt && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(post.publishedAt).toLocaleDateString("sq-AL", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-secondary text-neutral-500 hover:text-primary transition-colors cursor-pointer" title="Ndrysho">
                  <PencilSimple size={16} />
                </button>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="p-2 rounded-lg hover:bg-secondary text-neutral-500 hover:text-primary transition-colors" title="Shiko">
                  {post.status === "published" ? <Eye size={16} /> : <EyeSlash size={16} />}
                </a>
                <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-error transition-colors cursor-pointer" title="Fshi">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
