import React, { useState } from "react";
import LLink from "../components/LLink";
import {
  CalendarBlank,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  ArrowSquareRight,
  SpinnerGap,
  User,
  SignOut,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useAuth, useQuery, useLazyQuery } from "../hooks/useApi";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("sq-AL", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MyAccountPage() {
  const { t } = useTranslation();

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    Pending:   { label: t("account.status.Pending"),   color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock size={13} weight="fill" /> },
    Confirmed: { label: t("account.status.Confirmed"), color: "bg-blue-100 text-blue-700 border-blue-200",       icon: <CheckCircle size={13} weight="fill" /> },
    Active:    { label: t("account.status.Active"),    color: "bg-green-100 text-green-700 border-green-200",    icon: <ArrowSquareRight size={13} weight="fill" /> },
    Completed: { label: t("account.status.Completed"), color: "bg-neutral-100 text-neutral-600 border-neutral-200", icon: <CheckCircle size={13} weight="fill" /> },
    Cancelled: { label: t("account.status.Cancelled"), color: "bg-red-100 text-red-600 border-red-200",          icon: <XCircle size={13} weight="fill" /> },
  };

  const { user, isAnonymous, isPending: authPending, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const { query: queryAdminProfile } = useLazyQuery("UserAdminProfile");

  const { data: reservations, isPending: resLoading } = useQuery("Reservation", {
    orderBy: { createdAt: "desc" },
  });
  const { data: cars } = useQuery("Car");

  useEffect(() => {
    if (!user || isAnonymous) return;
    queryAdminProfile({ where: { isActive: true } })
      .then((p) => setIsAdmin(p.length > 0))
      .catch(() => {});
  }, [user, isAnonymous]);

  if (authPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isAnonymous) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-border p-10 max-w-sm w-full text-center shadow-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <User size={30} weight="duotone" className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">{t("account.title")}</h1>
          <p className="text-sm text-neutral-500 mb-6">{t("account.loginPrompt")}</p>
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t("account.loginBtn")}
          </button>
          <p className="mt-4 text-xs text-neutral-400">
            {t("account.noAccount")}{" "}
            <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-primary underline cursor-pointer bg-transparent border-0">
              {t("account.registerFree")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const getCarName = (carId: string) => {
    const car = cars?.find((c) => c.id === carId);
    return car ? `${car.brand} ${car.model}` : t("account.unknownCar");
  };

  const getCarImage = (carId: string) => {
    const car = cars?.find((c) => c.id === carId);
    return car?.image ?? "";
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const activeRes = reservations?.filter((r) => r.status === "Active" || r.status === "Confirmed") ?? [];
  const pastRes = reservations?.filter((r) => r.status === "Completed" || r.status === "Cancelled") ?? [];
  const pendingRes = reservations?.filter((r) => r.status === "Pending") ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-8 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{user?.name || t("account.title")}</h1>
            <p className="text-sm text-neutral-500">{user?.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} weight="fill" /> {t("account.administrator")}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {isAdmin && (
            <LLink
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5 transition-colors no-underline"
            >
              <ShieldCheck size={13} weight="fill" />
              {t("account.adminPanel")}
            </LLink>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 border border-border rounded-md hover:bg-secondary transition-colors cursor-pointer bg-white"
          >
            <SignOut size={13} weight="regular" />
            {t("account.logout")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t("account.stats.active"), count: activeRes.length, color: "text-blue-600 bg-blue-50" },
          { label: t("account.stats.pending"), count: pendingRes.length, color: "text-yellow-600 bg-yellow-50" },
          { label: t("account.stats.completed"), count: pastRes.filter(r => r.status === "Completed").length, color: "text-neutral-600 bg-neutral-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1`}>
              {s.count}
            </p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reservations */}
      {resLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerGap size={28} className="animate-spin text-primary" />
        </div>
      ) : !reservations || reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <CalendarBlank size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">{t("account.noReservations")}</p>
          <LLink
            to="/flota"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white text-sm font-medium rounded-lg no-underline hover:opacity-90 transition-opacity"
          >
            <Car size={16} weight="fill" />
            {t("account.viewFleet")}
          </LLink>
        </div>
      ) : (
        <div>
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <CalendarBlank size={18} weight="duotone" className="text-primary" />
            {t("account.reservationsTitle", { count: reservations.length })}
          </h2>
          <div className="flex flex-col gap-3">
            {reservations.map((res) => {
              const sc = STATUS_CONFIG[res.status] ?? STATUS_CONFIG["Pending"];
              const img = getCarImage(res.carId);
              return (
                <div
                  key={res.id}
                  className="bg-white rounded-xl border border-border p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={getCarName(res.carId)}
                      className="w-20 h-14 object-cover rounded-lg shrink-0 bg-neutral-100"
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                      <Car size={24} className="text-neutral-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-neutral-900 text-sm truncate">
                        {getCarName(res.carId)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">
                      {fmt(res.startDate)} → {fmt(res.endDate)} · {res.pickupLocation}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-800">
                        €{res.totalPrice ? Number(res.totalPrice).toFixed(2) : "—"}
                      </p>
                      <p className="text-xs text-neutral-400">{res.insurance}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
