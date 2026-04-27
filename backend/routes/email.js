const router = require('express').Router();
const pool = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const { pickupReminder } = require('../lib/emailTemplates');

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
        startDate: new Date(r.start_date).toLocaleDateString('sq-AL'),
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
