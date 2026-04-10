import emailjs from "@emailjs/browser";
import { EMAIL_CONFIG } from "./emailConfig";

let initialized = false;

function ensureInit() {
  if (!initialized && EMAIL_CONFIG.PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY") {
    emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
    initialized = true;
  }
}

export type BookingEmailData = {
  customerName: string;
  customerEmail: string;
  carName: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  insurance: string;
  reservationId: string;
};

export type ReminderEmailData = {
  customerName: string;
  customerEmail: string;
  carName: string;
  pickupLocation: string;
  startDate: string;
  startTime: string;
  reservationId: string;
};

export type ReservationStatusEmailData = {
  customerName: string;
  customerEmail: string;
  carName: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  totalPrice: number;
  reservationId: string;
};

export type InvoiceEmailData = {
  customerName: string;
  customerEmail: string;
  carName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  reservationId: string;
  invoiceNo: string;
};

function isConfigured(): boolean {
  return (
    EMAIL_CONFIG.PUBLIC_KEY !== "YOUR_EMAILJS_PUBLIC_KEY" &&
    EMAIL_CONFIG.SERVICE_ID !== "YOUR_SERVICE_ID"
  );
}

export async function sendBookingConfirmation(
  data: BookingEmailData
): Promise<boolean> {
  ensureInit();
  if (!isConfigured()) {
    console.info("[EmailService] EmailJS not configured — skipping confirmation email.");
    return false;
  }
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATES.BOOKING_CONFIRMATION,
      {
        to_name: data.customerName,
        to_email: data.customerEmail,
        car_name: data.carName,
        pickup_location: data.pickupLocation,
        dropoff_location: data.dropoffLocation,
        start_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        total_price: `€${data.totalPrice}`,
        insurance: data.insurance,
        reservation_id: data.reservationId,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_phone: EMAIL_CONFIG.COMPANY_PHONE,
        company_email: EMAIL_CONFIG.COMPANY_EMAIL,
      }
    );
    return true;
  } catch (err) {
    console.error("[EmailService] Confirmation email failed:", err);
    return false;
  }
}

export async function sendPickupReminder(
  data: ReminderEmailData
): Promise<boolean> {
  ensureInit();
  if (!isConfigured()) {
    console.info("[EmailService] EmailJS not configured — skipping reminder email.");
    return false;
  }
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATES.PICKUP_REMINDER,
      {
        to_name: data.customerName,
        to_email: data.customerEmail,
        car_name: data.carName,
        pickup_location: data.pickupLocation,
        start_date: data.startDate,
        start_time: data.startTime,
        reservation_id: data.reservationId,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_phone: EMAIL_CONFIG.COMPANY_PHONE,
      }
    );
    return true;
  } catch (err) {
    console.error("[EmailService] Reminder email failed:", err);
    return false;
  }
}

export async function sendReservationConfirmed(
  data: ReservationStatusEmailData
): Promise<boolean> {
  ensureInit();
  if (!isConfigured()) {
    console.info("[EmailService] EmailJS not configured — skipping confirmed email.");
    return false;
  }
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATES.RESERVATION_CONFIRMED,
      {
        to_name: data.customerName,
        to_email: data.customerEmail,
        car_name: data.carName,
        start_date: data.startDate,
        end_date: data.endDate,
        pickup_location: data.pickupLocation,
        total_price: `€${data.totalPrice}`,
        reservation_id: data.reservationId,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_phone: EMAIL_CONFIG.COMPANY_PHONE,
        company_email: EMAIL_CONFIG.COMPANY_EMAIL,
        company_website: EMAIL_CONFIG.COMPANY_WEBSITE,
      }
    );
    return true;
  } catch (err) {
    console.error("[EmailService] Confirmed email failed:", err);
    return false;
  }
}

export async function sendReservationCancelled(
  data: ReservationStatusEmailData
): Promise<boolean> {
  ensureInit();
  if (!isConfigured()) {
    console.info("[EmailService] EmailJS not configured — skipping cancelled email.");
    return false;
  }
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATES.RESERVATION_CANCELLED,
      {
        to_name: data.customerName,
        to_email: data.customerEmail,
        car_name: data.carName,
        start_date: data.startDate,
        end_date: data.endDate,
        pickup_location: data.pickupLocation,
        total_price: `€${data.totalPrice}`,
        reservation_id: data.reservationId,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_phone: EMAIL_CONFIG.COMPANY_PHONE,
        company_email: EMAIL_CONFIG.COMPANY_EMAIL,
        company_website: EMAIL_CONFIG.COMPANY_WEBSITE,
      }
    );
    return true;
  } catch (err) {
    console.error("[EmailService] Cancelled email failed:", err);
    return false;
  }
}

export async function sendInvoiceEmail(
  data: InvoiceEmailData
): Promise<boolean> {
  ensureInit();
  if (!isConfigured()) {
    console.info("[EmailService] EmailJS not configured — skipping invoice email.");
    return false;
  }
  try {
    await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATES.INVOICE,
      {
        to_name: data.customerName,
        to_email: data.customerEmail,
        car_name: data.carName,
        start_date: data.startDate,
        end_date: data.endDate,
        total_price: `€${data.totalPrice}`,
        reservation_id: data.reservationId,
        invoice_no: data.invoiceNo,
        company_name: EMAIL_CONFIG.COMPANY_NAME,
        company_phone: EMAIL_CONFIG.COMPANY_PHONE,
        company_email: EMAIL_CONFIG.COMPANY_EMAIL,
        company_website: EMAIL_CONFIG.COMPANY_WEBSITE,
      }
    );
    return true;
  } catch (err) {
    console.error("[EmailService] Invoice email failed:", err);
    return false;
  }
}

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
