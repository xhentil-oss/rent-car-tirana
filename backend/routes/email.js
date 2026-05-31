const router = require('express').Router();
const pool = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const { pickupReminder } = require('../lib/emailTemplates');

// Format a date-only string (YYYY-MM-DD) or Date as sq-AL without timezone shift.
function formatDateOnlyLocale(value) {
  if (!value) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      .toLocaleDateString('sq-AL');
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('sq-AL');
}

// POST /api/email/pickup-reminder/:id — admin sends 24h reminder for one reservation
router.post('/pickup-reminder/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.pickup_location, r.start_date, r.start_time,
              cu.name AS customer_name, cu.email AS customer_email,
              ca.brand, ca.model
       FROM reservations r
       JOIN customers cu ON cu.id = r.customer_id
       JOIN cars ca ON ca.id = r.car_id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rezervimi nuk u gjet.' });

    const r = rows[0];
    await sendMail(
      r.customer_email,
      'Kujtesë: Makina juaj nesër — Rent Car Tirana',
      pickupReminder({
        customerName: r.customer_name,
        carName: `${r.brand} ${r.model}`,
        pickupLocation: r.pickup_location,
        startDate: formatDateOnlyLocale(r.start_date),
        startTime: r.start_time,
        reservationId: r.id,
      })
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Email Reminder]', err);
    res.status(500).json({ error: 'Dërgimi dështoi.' });
  }
});

module.exports = router;
