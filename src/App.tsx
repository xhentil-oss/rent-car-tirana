import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
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
      <main id="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/flota"
          element={
            <PublicLayout>
              <FleetPage />
            </PublicLayout>
          }
        />
        <Route
          path="/makina/:slug"
          element={
            <PublicLayout>
              <CarDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/rezervo"
          element={
            <PublicLayout>
              <BookingPage />
            </PublicLayout>
          }
        />
        <Route
          path="/faleminderit"
          element={
            <PublicLayout>
              <ThankYouPage />
            </PublicLayout>
          }
        />
        <Route
          path="/llogaria"
          element={
            <PublicLayout>
              <MyAccountPage />
            </PublicLayout>
          }
        />
        <Route
          path="/vleresime"
          element={
            <PublicLayout>
              <ReviewsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/makina-me-qira-tirane"
          element={
            <PublicLayout>
              <MakinaQeraTirana />
            </PublicLayout>
          }
        />
        <Route
          path="/makine-me-qira-aeroport"
          element={
            <PublicLayout>
              <MakineAeroport />
            </PublicLayout>
          }
        />
        <Route
          path="/makina-suv-me-qira"
          element={
            <PublicLayout>
              <MakinaSUV />
            </PublicLayout>
          }
        />
        <Route
          path="/makina-automatike-me-qira"
          element={
            <PublicLayout>
              <MakinaAutomatike />
            </PublicLayout>
          }
        />
        <Route
          path="/makina-luksoze-me-qira"
          element={
            <PublicLayout>
              <MakinaLuksoze />
            </PublicLayout>
          }
        />
        <Route
          path="/sitemap"
          element={
            <PublicLayout>
              <SitemapPage />
            </PublicLayout>
          }
        />
        <Route
          path="/kontakt"
          element={
            <PublicLayout>
              <ContactPage />
            </PublicLayout>
          }
        />
        <Route
          path="/termat-e-sherbimit"
          element={
            <PublicLayout>
              <TermsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/privatesie"
          element={
            <PublicLayout>
              <PrivacyPage />
            </PublicLayout>
          }
        />

        {/* Admin Routes */}
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
        </Route>

        {/* Fallback — Custom 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
