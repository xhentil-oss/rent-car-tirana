import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Car,
  List,
  X,
  Phone,
  SignOut,
  SignIn,
  CalendarBlank,
  ShieldCheck,
  CaretDown,
  SpinnerGap,
  Globe,
  UserPlus,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useApi";
import { useTranslation } from "react-i18next";
import { useLocale } from "../hooks/useLocale";
import LLink from "./LLink";

function LanguageSwitcher() {
  const { lang, switchLang } = useLocale();

  return (
    <div className="flex items-center gap-0.5 bg-secondary rounded-md border border-border overflow-hidden">
      <button
        onClick={() => switchLang("sq")}
        className={`px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          lang === "sq"
            ? "bg-primary text-white"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
        aria-label="Shqip"
      >
        🇦🇱 AL
      </button>
      <button
        onClick={() => switchLang("en")}
        className={`px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
          lang === "en"
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
  const { user, isPending, isAnonymous, login, register, logout } = useAuth();
  const { localePath } = useLocale();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isAdmin = !isAnonymous && user?.role && ['admin', 'manager', 'staff'].includes(user.role);

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

  const { t } = useTranslation();

  if (isPending) {
    return (
      <div className="w-9 h-9 flex items-center justify-center">
        <SpinnerGap size={18} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isAnonymous) {
    const handleLogin = () => {
      setLoginLoading(true);
      setLoginError("");
      login(loginEmail, loginPass)
        .then(() => setShowAuth(false))
        .catch((err: Error) => setLoginError(err.message || "Login dështoi"))
        .finally(() => setLoginLoading(false));
    };

    const handleRegister = () => {
      if (regPass !== regPass2) { setRegError("Fjalëkalimet nuk përputhen"); return; }
      if (regPass.length < 8) { setRegError("Fjalëkalimi duhet të ketë min 8 karaktere"); return; }
      setRegLoading(true);
      setRegError("");
      register(regName, regEmail, regPass, regPhone)
        .then(() => setShowAuth(false))
        .catch((err: Error) => setRegError(err.message || "Regjistrimi dështoi"))
        .finally(() => setRegLoading(false));
    };

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowAuth(!showAuth)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-white shadow-sm"
        >
          <SignIn size={16} weight="bold" />
          {t("header.login", "Hyr")}
        </button>

        {showAuth && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setAuthTab("login")}
                className={`flex-1 py-2.5 text-sm font-medium cursor-pointer border-0 transition-colors ${authTab === "login" ? "bg-white text-primary border-b-2 border-primary" : "bg-neutral-50 text-neutral-500 hover:text-neutral-700"}`}
              >
                <SignIn size={14} weight="bold" className="inline mr-1.5 -mt-0.5" />
                Hyr
              </button>
              <button
                onClick={() => setAuthTab("register")}
                className={`flex-1 py-2.5 text-sm font-medium cursor-pointer border-0 transition-colors ${authTab === "register" ? "bg-white text-primary border-b-2 border-primary" : "bg-neutral-50 text-neutral-500 hover:text-neutral-700"}`}
              >
                <UserPlus size={14} weight="bold" className="inline mr-1.5 -mt-0.5" />
                Regjistrohu
              </button>
            </div>

            <div className="p-4">
              {authTab === "login" ? (
                <>
                  {loginError && <p className="text-xs text-error mb-2">{loginError}</p>}
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2 outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    placeholder="Fjalëkalimi"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-3 outline-none focus:border-primary"
                  />
                  <button
                    disabled={loginLoading || !loginEmail || !loginPass}
                    onClick={handleLogin}
                    className="w-full py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer border-0"
                  >
                    {loginLoading ? "Duke hyrë..." : "Hyr"}
                  </button>
                  <p className="mt-3 text-xs text-center text-neutral-400">
                    Nuk ke llogari?{" "}
                    <button onClick={() => setAuthTab("register")} className="text-primary underline cursor-pointer bg-transparent border-0 text-xs">
                      Regjistrohu falas
                    </button>
                  </p>
                </>
              ) : (
                <>
                  {regError && <p className="text-xs text-error mb-2">{regError}</p>}
                  <input
                    type="text"
                    placeholder="Emri i plotë *"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2 outline-none focus:border-primary"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2 outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Telefoni (opsional)"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2 outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    placeholder="Fjalëkalimi * (min 8 karaktere)"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-2 outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmo fjalëkalimin *"
                    value={regPass2}
                    onChange={(e) => setRegPass2(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRegister(); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md mb-3 outline-none focus:border-primary"
                  />
                  <button
                    disabled={regLoading || !regName || !regEmail || !regPass || !regPass2}
                    onClick={handleRegister}
                    className="w-full py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer border-0"
                  >
                    {regLoading ? "Duke regjistruar..." : "Krijo llogarinë"}
                  </button>
                  <p className="mt-3 text-xs text-center text-neutral-400">
                    Ke llogari?{" "}
                    <button onClick={() => setAuthTab("login")} className="text-primary underline cursor-pointer bg-transparent border-0 text-xs">
                      Hyr këtu
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
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
              onClick={() => { navigate(localePath("/llogaria")); setOpen(false); }}
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
  const { localePath } = useLocale();

  if (isAnonymous) {
    return (
      <button
        onClick={() => { navigate("/admin"); onClose(); }}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer bg-white shadow-sm"
      >
        <SignIn size={16} weight="bold" />
        {t("header.login", "Hyr")}
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
        onClick={() => { navigate(localePath("/llogaria")); onClose(); }}
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { localePath } = useLocale();

  const navLinks = [
    { label: t("header.fleet"), href: "/flota" },
    { label: "Blog", href: "/blog" },
    { label: t("header.reviews"), href: "/vleresime" },
    { label: t("header.about"), href: "/", anchor: "rreth-nesh" },
    { label: t("header.contact"), href: "/", anchor: "kontakti" },
  ];

  const scrollToAnchor = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavClick = (link: typeof navLinks[number]) => {
    if (link.anchor) {
      const homePath = localePath("/");
      if (location.pathname === homePath || location.pathname === "/") {
        scrollToAnchor(link.anchor);
      } else {
        navigate(homePath);
        setTimeout(() => scrollToAnchor(link.anchor), 300);
      }
    }
  };

  const isActive = (href: string) => {
    const localHref = localePath(href);
    if (href === "/") return location.pathname === "/" || location.pathname === "/en";
    return location.pathname.startsWith(localHref);
  };

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-border"
      style={{ height: "72px" }}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <LLink
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
        </LLink>

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Navigimi kryesor"
        >
          {navLinks.map((link) =>
            link.anchor ? (
              <button
                key={link.anchor}
                onClick={() => handleNavClick(link)}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 no-underline cursor-pointer border-0 bg-transparent ${
                  "text-neutral-700 hover:text-primary hover:bg-secondary"
                }`}
              >
                {link.label}
              </button>
            ) : (
              <LLink
                key={link.href}
                to={link.href}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 no-underline cursor-pointer ${
                  isActive(link.href)
                    ? "text-primary bg-secondary"
                    : "text-neutral-700 hover:text-primary hover:bg-secondary"
                }`}
              >
                {link.label}
              </LLink>
            )
          )}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+355697562951"
            className="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary transition-colors duration-200 no-underline px-3 py-2"
          >
            <Phone size={16} weight="regular" />
            <span>{t("header.phone")}</span>
          </a>

          <LanguageSwitcher />
          <UserMenu />

          <LLink
            to="/rezervo"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity duration-200 no-underline"
          >
            {t("header.bookNow")}
          </LLink>
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
            {navLinks.map((link) =>
              link.anchor ? (
                <button
                  key={link.anchor}
                  onClick={() => { setMobileOpen(false); handleNavClick(link); }}
                  className={`px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 no-underline cursor-pointer border-0 bg-transparent text-left ${
                    "text-neutral-700 hover:text-primary hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </button>
              ) : (
                <LLink
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
                </LLink>
              )
            )}
            <div className="pt-3 border-t border-border mt-2 flex flex-col gap-2">
              <a
                href="tel:+355697562951"
                className="flex items-center gap-2 text-sm text-neutral-700 px-4 py-3 no-underline"
              >
                <Phone size={16} weight="regular" />
                <span>{t("header.phone")}</span>
              </a>
              <div className="px-1">
                <LanguageSwitcher />
              </div>
              <MobileUserMenu onClose={() => setMobileOpen(false)} />
              <LLink
                to="/rezervo"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center px-5 py-3 rounded-md text-sm font-medium bg-gradient-primary text-primary-foreground no-underline text-center"
              >
                {t("header.bookNow")}
              </LLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
