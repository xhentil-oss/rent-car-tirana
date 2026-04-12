import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocaleProvider } from "./hooks/useLocale";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import FleetPage from "./pages/FleetPage";
import CarDetailPage from "./pages/CarDetailPage";
import BookingPage from "./pages/BookingPage";
import MyAccountPage from "./pages/MyAccountPage";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminCars from "./admin/pages/AdminCars";
import AdminCustomers from "./admin/pages/AdminCustomers";
import AdminReservations from "./admin/pages/AdminReservations";
import AdminCalendar from "./admin/pages/AdminCalendar";
import AdminReports from "./admin/pages/AdminReports";
import AdminFinance from "./admin/pages/AdminFinance";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminFleetManagement from "./admin/pages/AdminFleetManagement";
import AdminReviews from "./admin/pages/AdminReviews";
import AdminPricingRules from "./admin/pages/AdminPricingRules";
import AdminCarEdit from "./admin/pages/AdminCarEdit";
import AdminMedia from "./admin/pages/AdminMedia";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminBlog from "./admin/pages/AdminBlog";
import ReviewsPage from "./pages/ReviewsPage";
import MakinaQeraTirana from "./pages/seo/MakinaQeraTirana";
import MakineAeroport from "./pages/seo/MakineAeroport";
import MakinaSUV from "./pages/seo/MakinaSUV";
import MakinaAutomatike from "./pages/seo/MakinaAutomatike";
import MakinaLuksoze from "./pages/seo/MakinaLuksoze";
import SitemapPage from "./pages/SitemapPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import NotFoundPage from "./pages/NotFoundPage";
import ThankYouPage from "./pages/ThankYouPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";

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

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md text-sm font-medium"
      >
        Përmbajtja kryesore
      </a>
      <Header />
      <main id="main-content"><ErrorBoundary>{children}</ErrorBoundary></main>
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
          <Route path="/admin" element={<AdminLayout />}>
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
