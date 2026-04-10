// ─────────────────────────────────────────────────────────────
// EmailJS Configuration
// Regjistrohu falas në https://www.emailjs.com/
// 1. Krijo një Service (Gmail / Outlook)
// 2. Krijo 3 Template-s (konfirmim, kujtesë, faturë)
// 3. Plotëso kredencialet këtu
// ─────────────────────────────────────────────────────────────

export const EMAIL_CONFIG = {
  // EmailJS Public Key  (Account → API Keys)
  PUBLIC_KEY: "YOUR_EMAILJS_PUBLIC_KEY",

  // EmailJS Service ID  (Email Services → Service ID)
  SERVICE_ID: "YOUR_SERVICE_ID",

  // Template IDs  (Email Templates → Template ID)
  TEMPLATES: {
    BOOKING_CONFIRMATION: "template_booking_confirm",
    PICKUP_REMINDER: "template_pickup_reminder",
    INVOICE: "template_invoice",
    RESERVATION_CONFIRMED: "template_res_confirmed",
    RESERVATION_CANCELLED: "template_res_cancelled",
    CONTACT_FORM: "template_contact_form",
  },

  // Emri i biznesit për emailet
  COMPANY_NAME: "Rent Car Tirana",
  COMPANY_PHONE: "+355 69 756 2951",
  COMPANY_EMAIL: "info@rentcartiranaairport.com",
  COMPANY_WEBSITE: "https://rentcartiranaairport.com",
};
