import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Car,
  List,
  X,
  Phone,
  SignOut,
  CalendarBlank,
  ShieldCheck,
  CaretDown,
  SpinnerGap,
  Globe,
} from "@phosphor-icons/react";
import { useAuth, useLazyQuery } from "@animaapp/playground-react-sdk";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "sq";

  return (
    <div className="flex items-center gap-0.5 bg-secondary rounded-md border border-border overflow-hidden">
      <button
        onClick={() => i18n.changeLanguage("sq")}
        className={`px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          current === "sq"
            ? "bg-primary text-white"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        aria-label="Shqip"
      >
        🇦🇱 AL
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          current === "en"
            ? "bg-primary text-white"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}

function UserMenu() {
  const { user, isPending, isAnonymous, login, logout } = useAuth();
  const { query: queryAdminProfile } = useLazyQuery("UserAdminProfile");
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Check if logged-in user has an admin profile
  useEffect(() => {
    if (!user || isAnonymous) {
      setIsAdmin(false);
      return;
    }
    queryAdminProfile({ where: { isActive: true } })
      .then((profiles) => {
        setIsAdmin(profiles.length > 0);
      })
      .catch(() => setIsAdmin(false));
  }, [user, isAnonymous]);

  const { t } = useTranslation();

  if (isPending) {
    return (
      <div className="w-9 h-9 flex items-center justify-center">
        <SpinnerGap size={18} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isAnonymous) {
    return (
      <button
        onClick={() => login()}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-white shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        {t("header.loginGoogle")}
      </button>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-neutral-700 hover:bg-secondary transition-colors duration-200 cursor-pointer bg-transparent border-0"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center">
          <span className="text-[11px] font-semibold text-white">{initials}</span>
        </div>
        <span className="hidden sm:block max-w-[120px] truncate">
          {user?.name || user?.email}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-border shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {user?.name || t("header.user")}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => { navigate("/llogaria"); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-secondary hover:text-primary transition-colors duration-200 cursor-pointer bg-transparent border-0 text-left"
            >
              <CalendarBlank size={16} weight="regular" className="text-neutral-400" />
              {t("header.myReservations")}
            </button>

            {isAdmin && (
              <button
                onClick={() => { navigate("/admin"); setOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 hover:bg-secondary hover:text-primary transition-colors duration-200 cursor-pointer bg-transparent border-0 text-left"
              >
                <ShieldCheck size={16} weight="regular" className="text-neutral-400" />
                {t("header.adminPanel")}
              </button>
            )}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors duration-200 cursor-pointer bg-transparent border-0 text-left"
            >
              <SignOut size={16} weight="regular" />
              {t("header.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileUserMenu({ onClose }: { onClose: () => void }) {
  const { user, isAnonymous, login, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isAnonymous) {
    return (
      <button
        onClick={() => { login(); onClose(); }}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-white shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        {t("header.loginGoogle")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 px-4 py-2 rounded-md bg-secondary">
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{user?.name || t("header.user")}</p>
          <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={() => { navigate("/llogaria"); onClose(); }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-neutral-700 hover:bg-secondary transition-colors duration-200 cursor-pointer bg-transparent border-0 text-left w-full"
      >
        <CalendarBlank size={16} weight="regular" className="text-neutral-400" />
        {t("header.myReservations")}
      </button>
      <button
        onClick={() => { logout(); onClose(); }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-error hover:bg-red-50 transition-colors duration-200 cursor-pointer bg-transparent border-0 text-left w-full"
      >
        <SignOut size={16} weight="regular" />
        {t("header.logout")}
      </button>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navLinks = [
    { label: t("header.fleet"), href: "/flota" },
    { label: t("header.reviews"), href: "/vleresime" },
    { label: t("header.about"), href: "/#rreth-nesh" },
    { label: t("header.contact"), href: "/#kontakti" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return (
      location.pathname.startsWith(href.split("#")[0]) &&
      href.split("#")[0] !== "/"
    );
  };

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-border"
      style={{ height: "72px" }}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline"
          aria-label="Rent Car Tirana - Kryefaqja"
        >
          <div className="w-9 h-9 rounded-md bg-gradient-primary flex items-center justify-center">
            <Car size={20} weight="fill" className="text-white" />
          </div>
          <span className="font-semibold text-lg text-neutral-900 leading-tight">
            Rent Car <span className="text-primary">Tirana</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Navigimi kryesor"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 no-underline cursor-pointer ${
                isActive(link.href)
                  ? "text-primary bg-secondary"
                  : "text-neutral-700 hover:text-primary hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+355691234567"
            className="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary transition-colors duration-200 no-underline px-3 py-2"
          >
            <Phone size={16} weight="regular" />
            <span>{t("header.phone")}</span>
          </a>

          <LanguageSwitcher />
          <UserMenu />

          <Link
            to="/rezervo"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 no-underline"
          >
            {t("header.bookNow")}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-neutral-700 hover:bg-secondary transition-colors duration-200"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Mbyll menunë" : "Hap menunë"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X size={24} weight="regular" />
          ) : (
            <List size={24} weight="regular" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-border z-50 shadow-lg">
          <nav className="flex flex-col p-4 gap-1" aria-label="Navigimi mobil">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 no-underline ${
                  isActive(link.href)
                    ? "text-primary bg-secondary"
                    : "text-neutral-700 hover:text-primary hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-2 flex flex-col gap-2">
              <a
                href="tel:+355691234567"
                className="flex items-center gap-2 text-sm text-neutral-700 px-4 py-3 no-underline"
              >
                <Phone size={16} weight="regular" />
                <span>{t("header.phone")}</span>
              </a>
              <div className="px-1">
                <LanguageSwitcher />
              </div>
              <MobileUserMenu onClose={() => setMobileOpen(false)} />
              <Link
                to="/rezervo"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center px-5 py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground no-underline text-center"
              >
                {t("header.bookNow")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
