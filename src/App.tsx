import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocaleProvider } from "./hooks/useLocale";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import FleetPage from "./pages/FleetPage";
import CarDetailPage from "./pages/CarDetailPage";
import BookingPage from "./pages/BookingPage";

// Lazy-loaded pages (admin + low-traffic)
const MyAccountPage = React.lazy(() => import("./pages/MyAccountPage"));
const AdminLayout = React.lazy(() => import("./admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./admin/pages/AdminDashboard"));
const AdminCars = React.lazy(() => import("./admin/pages/AdminCars"));
const AdminCustomers = React.lazy(() => import("./admin/pages/AdminCustomers"));
const AdminReservations = React.lazy(() => import("./admin/pages/AdminReservations"));
const AdminCalendar = React.lazy(() => import("./admin/pages/AdminCalendar"));
const AdminReports = React.lazy(() => import("./admin/pages/AdminReports"));
const AdminFinance = React.lazy(() => import("./admin/pages/AdminFinance"));
const AdminUsers = React.lazy(() => import("./admin/pages/AdminUsers"));
const AdminFleetManagement = React.lazy(() => import("./admin/pages/AdminFleetManagement"));
const AdminReviews = React.lazy(() => import("./admin/pages/AdminReviews"));
const AdminPricingRules = React.lazy(() => import("./admin/pages/AdminPricingRules"));
const AdminCarEdit = React.lazy(() => import("./admin/pages/AdminCarEdit"));
const AdminMedia = React.lazy(() => import("./admin/pages/AdminMedia"));
const AdminSettings = React.lazy(() => import("./admin/pages/AdminSettings"));
const AdminBlog = React.lazy(() => import("./admin/pages/AdminBlog"));
const ReviewsPage = React.lazy(() => import("./pages/ReviewsPage"));
const MakinaQeraTirana = React.lazy(() => import("./pages/seo/MakinaQeraTirana"));
const MakineAeroport = React.lazy(() => import("./pages/seo/MakineAeroport"));
const MakinaSUV = React.lazy(() => import("./pages/seo/MakinaSUV"));
const MakinaAutomatike = React.lazy(() => import("./pages/seo/MakinaAutomatike"));
const MakinaLuksoze = React.lazy(() => import("./pages/seo/MakinaLuksoze"));
const SitemapPage = React.lazy(() => import("./pages/SitemapPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const ThankYouPage = React.lazy(() => import("./pages/ThankYouPage"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const BlogPostPage = React.lazy(() => import("./pages/BlogPostPage"));

/* Route definition: [Albanian path, English path, Component] */
const PUBLIC_ROUTES: [string, string, React.ComponentType][] = [
  ["/",                          "/en",                       HomePage],
  ["/flota",                     "/en/fleet",                 FleetPage],
  ["/makina/:slug",              "/en/car/:slug",             CarDetailPage],
  ["/rezervo",                   "/en/book",                  BookingPage],
  ["/faleminderit",              "/en/thank-you",             ThankYouPage],
  ["/llogaria",                  "/en/my-account",            MyAccountPage],
  ["/vleresime",                 "/en/reviews",               ReviewsPage],
  ["/makina-me-qira-tirane",     "/en/car-rental-tirana",     MakinaQeraTirana],
  ["/makine-me-qira-aeroport",   "/en/airport-car-rental",    MakineAeroport],
  ["/makina-suv-me-qira",        "/en/suv-car-rental",        MakinaSUV],
  ["/makina-automatike-me-qira", "/en/automatic-car-rental",  MakinaAutomatike],
  ["/makina-luksoze-me-qira",    "/en/luxury-car-rental",     MakinaLuksoze],
  ["/sitemap",                   "/en/sitemap",               SitemapPage],
  ["/kontakt",                   "/en/contact",               ContactPage],
  ["/termat-e-sherbimit",        "/en/terms",                 TermsPage],
  ["/privatesie",                "/en/privacy",               PrivacyPage],
  ["/blog",                      "/en/blog",                  BlogPage],
  ["/blog/:slug",                "/en/blog/:slug",            BlogPostPage],
];

function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md text-sm font-medium"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <main id="main-content"><ErrorBoundary><Suspense fallback={<LazyFallback />}>{children}</Suspense></ErrorBoundary></main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <Routes>
          {/* Public Routes — Albanian (default) + English */}
          {PUBLIC_ROUTES.map(([sq, en, Component]) => (
            <React.Fragment key={sq}>
              <Route path={sq} element={<PublicLayout><Component /></PublicLayout>} />
              <Route path={en} element={<PublicLayout><Component /></PublicLayout>} />
            </React.Fragment>
          ))}

          {/* Admin Routes (no language prefix) */}
          <Route path="/admin" element={<Suspense fallback={<LazyFallback />}><AdminLayout /></Suspense>}>
            <Route index element={<AdminDashboard />} />
            <Route path="flota" element={<AdminCars />} />
            <Route path="klientet" element={<AdminCustomers />} />
            <Route path="rezervime" element={<AdminReservations />} />
            <Route path="kalendar" element={<AdminCalendar />} />
            <Route path="financa" element={<AdminFinance />} />
            <Route path="raporte" element={<AdminReports />} />
            <Route path="perdoruesit" element={<AdminUsers />} />
            <Route path="fleet" element={<AdminFleetManagement />} />
            <Route path="vleresimet" element={<AdminReviews />} />
            <Route path="ofertat" element={<AdminPricingRules />} />
            <Route path="flota/:id" element={<AdminCarEdit />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="cilesimet" element={<AdminSettings />} />
            <Route path="blog" element={<AdminBlog />} />
          </Route>

          {/* Fallback — Custom 404 */}
          <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
        </Routes>
      </LocaleProvider>
    </BrowserRouter>
  );
}
