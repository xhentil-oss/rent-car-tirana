import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSEO } from "../hooks/useSEO";
import { useQuery } from "../hooks/useApi";
import { useLocale } from "../hooks/useLocale";
import { CalendarBlank, ArrowRight, Tag } from "@phosphor-icons/react";
import LLink from "../components/LLink";
import Footer from "../components/Footer";

const ITEMS_PER_PAGE = 9;

export default function BlogPage() {
  const { t, i18n } = useTranslation();
  const { lang } = useLocale();
  const isEn = lang === "en";
  const [page, setPage] = useState(1);

  useSEO({
    title: isEn ? "Blog — Car Rental Tips & Tirana Travel Guide" : "Blog — Këshilla për Makina me Qira & Udhëzuesi i Tiranës",
    description: isEn
      ? "Read our latest articles about car rental tips, Tirana travel guides, and driving in Albania."
      : "Lexoni artikujt tanë më të fundit për këshilla mbi makinat me qira, udhëzues udhëtimi në Tiranë, dhe drejtim në Shqipëri.",
    keywords: isEn
      ? "car rental blog, tirana travel guide, driving in albania, rent a car tips"
      : "blog makina me qira, udhëzues udhëtimi tiranë, drejtim në shqipëri, këshilla qira makinash",
    canonical: "/blog",
  });

  const { data: posts, loading } = useQuery("BlogPost");
  const allPosts = posts ?? [];

  const totalPages = Math.ceil(allPosts.length / ITEMS_PER_PAGE);
  const paginated = allPosts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="bg-gradient-primary py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {isEn ? "Our Blog" : "Blogu Ynë"}
          </h1>
          <p className="text-blue-100 text-lg">
            {isEn
              ? "Tips, guides, and everything about car rental in Tirana & Albania"
              : "Këshilla, udhëzues, dhe gjithçka rreth makinave me qira në Tiranë & Shqipëri"}
          </p>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="h-48 bg-neutral-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-full" />
                  <div className="h-3 bg-neutral-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">
              {isEn ? "No blog posts yet. Check back soon!" : "Nuk ka postime ende. Kthehuni shpejt!"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-6">
              {isEn ? `${allPosts.length} articles` : `${allPosts.length} artikuj`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((post: any) => {
                const title = isEn && post.titleEn ? post.titleEn : post.titleSq;
                const excerpt = isEn && post.excerptEn ? post.excerptEn : post.excerptSq;
                const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(isEn ? "en-GB" : "sq-AL", { day: "numeric", month: "long", year: "numeric" }) : "";
                const tags = post.tags ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

                return (
                  <LLink
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 no-underline"
                  >
                    {post.coverImage ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/20">Blog</span>
                      </div>
                    )}
                    <div className="p-5">
                      {tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          {tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                              <Tag size={10} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                      </h2>
                      {excerpt && (
                        <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {date && (
                          <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <CalendarBlank size={12} /> {date}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                          {isEn ? "Read more" : "Lexo më shumë"} <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </LLink>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-white text-neutral-700 disabled:opacity-40 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {t("fleet.prev")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      p === page ? "bg-primary text-white" : "bg-white border border-border text-neutral-700 hover:bg-secondary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-md border border-border bg-white text-neutral-700 disabled:opacity-40 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {t("fleet.next")}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
