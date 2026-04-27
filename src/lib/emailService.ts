import { fetchWithRefresh } from "../hooks/useApi";

/**
 * Returns reservations whose startDate is tomorrow (for 24h reminder banner).
 */
export function getTomorrowReservations<T extends { startDate: Date | string }>(
  reservations: T[]
): T[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  return reservations.filter((r) => {
    const d = new Date(r.startDate).toISOString().split("T")[0];
    return d === tomorrowStr;
  });
}

/**
 * Admin-triggered: sends a 24h pickup reminder for a single reservation via backend SMTP.
 */
export async function sendPickupReminder(reservationId: string): Promise<boolean> {
  try {
    const res = await fetchWithRefresh(`/api/email/pickup-reminder/${reservationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("[EmailService] Reminder failed:", err);
    return false;
  }
}
