import React, { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  Car,
  Users,
  CalendarBlank,
  ChartBar,
  List,
  MagnifyingGlass,
  SignOut,
  Gauge,
  CurrencyDollar,
  UserGear,
  ShieldCheck,
  Wrench,
  SpinnerGap,
  Star,
  Tag,
  Images,
} from "@phosphor-icons/react";
import { useAuth } from "@animaapp/playground-react-sdk";
import NotificationPanel from "../components/NotificationPanel";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge, group: "main" },
  { label: "Flota", href: "/admin/flota", icon: Car, group: "main" },
  { label: "Klientët", href: "/admin/klientet", icon: Users, group: "main" },
  { label: "Rezervimet", href: "/admin/rezervime", icon: CalendarBlank, group: "main" },
  { label: "Kalendari", href: "/admin/kalendar", icon: CalendarBlank, group: "main" },
  { label: "Financat", href: "/admin/financa", icon: CurrencyDollar, group: "main" },
  { label: "Raportet", href: "/admin/raporte", icon: ChartBar, group: "main" },
  { label: "Fleet Mgmt", href: "/admin/fleet", icon: Wrench, group: "main" },
  { label: "Ofertat & Çmimet", href: "/admin/ofertat", icon: Tag, group: "main" },
  { label: "Media", href: "/admin/media", icon: Images, group: "main" },
  { label: "Vlerësimet", href: "/admin/vleresimet", icon: Star, group: "system" },
  { label: "Përdoruesit", href: "/admin/perdoruesit", icon: UserGear, group: "system" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, isPending, isAnonymous, login, logout } = useAuth();

  // Still loading auth state
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <SpinnerGap size={32} className="animate-spin text-primary" />
          <p className="text-sm">Duke verifikuar hyrjen...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (isAnonymous) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="bg-white rounded-xl border border-border p-10 max-w-sm w-full text-center shadow-md">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} weight="duotone" className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Kërkohet hyrja</h1>
          <p className="text-sm text-neutral-500 mb-6">Ju duhet të kyçeni për të aksesuar panelin e administrimit.</p>
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-neutral-300 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Kyçu me Google
          </button>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 h-full bg-admin-sidebar flex flex-col transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Admin navigimi"
      >
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-neutral-800 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-md bg-gradient-primary flex items-center justify-center shrink-0">
            <Car size={16} weight="fill" className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-white text-sm">
              Rent Car Admin
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Main nav */}
          {navItems.filter(i => i.group === "main").map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors duration-200 no-underline mb-1 !text-white ${
                collapsed ? "justify-center" : ""
              } ${
                isActive(href)
                  ? "bg-admin-sidebar-active"
                  : "hover:bg-admin-sidebar-hover"
              }`}
              title={collapsed ? label : undefined}
              aria-label={label}
            >
              <Icon size={20} weight="regular" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </Link>
          ))}

          {/* Divider + System group */}
          <div className={`mx-4 my-3 border-t border-neutral-700 ${collapsed ? "mx-2" : ""}`} />
          {!collapsed && (
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Sistemi
            </p>
          )}
          {navItems.filter(i => i.group === "system").map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-md transition-colors duration-200 no-underline mb-1 !text-white ${
                collapsed ? "justify-center" : ""
              } ${
                isActive(href)
                  ? "bg-admin-sidebar-active"
                  : "hover:bg-admin-sidebar-hover"
              }`}
              title={collapsed ? label : undefined}
              aria-label={label}
            >
              <Icon size={20} weight="regular" />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 w-full px-2 py-2 rounded-md text-white hover:bg-admin-sidebar-hover hover:text-white transition-colors duration-200 cursor-pointer ${collapsed ? "justify-center" : ""}`}
            aria-label={collapsed ? "Zgjero menunë" : "Mbledh menunë"}
          >
            <List size={20} weight="regular" />
            {!collapsed && <span className="text-sm">Mbledh</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/55 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md text-neutral-600 hover:bg-secondary transition-colors duration-200 cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Hap menunë"
            >
              <List size={20} weight="regular" />
            </button>
            <div className="relative hidden md:block">
              <MagnifyingGlass
                size={16}
                weight="regular"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="search"
                placeholder="Kërko..."
                className="pl-9 pr-4 py-2 rounded-md border border-border text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-neutral-400 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center" title={user?.email ?? ""}>
              <span className="text-xs font-medium text-white">
                {user?.name ? user.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="hidden md:flex items-center gap-1.5 text-sm text-neutral-600 hover:text-primary transition-colors duration-200 cursor-pointer bg-transparent border-0"
            >
              <SignOut size={16} weight="regular" />
              Dil
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
