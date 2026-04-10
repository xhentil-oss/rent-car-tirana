const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const fmt = (r) => ({
  id: r.id, name: r.name, type: r.type, discountType: r.discount_type,
  discountValue: r.discount_value, startDate: r.start_date, endDate: r.end_date,
  minDays: r.min_days, maxDays: r.max_days, advanceBookingDays: r.advance_booking_days,
  lastMinuteHours: r.last_minute_hours, promoCode: r.promo_code,
  applicableTo: r.applicable_to, isActive: !!r.is_active, priority: r.priority,
  description: r.description, usageCount: r.usage_count, maxUsages: r.max_usages,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY priority DESC, created_at DESC');
    res.json(rows.map(fmt));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive, priority, description, maxUsages } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO pricing_rules (id, name, type, discount_type, discount_value, start_date, end_date, min_days, max_days, advance_booking_days, last_minute_hours, promo_code, applicable_to, is_active, priority, description, max_usages, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo || 'all', isActive ? 1 : 0, priority || 0, description, maxUsages || 0, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive, priority, description, maxUsages } = req.body;
    await pool.query(
      'UPDATE pricing_rules SET name=?, type=?, discount_type=?, discount_value=?, start_date=?, end_date=?, min_days=?, max_days=?, advance_booking_days=?, last_minute_hours=?, promo_code=?, applicable_to=?, is_active=?, priority=?, description=?, max_usages=? WHERE id=?',
      [name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive ? 1 : 0, priority, description, maxUsages, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Called when a pricing rule is applied during booking — public but validated
router.post('/:id/use', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, max_usages, usage_count, is_active FROM pricing_rules WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rregulli nuk u gjet.' });
    const rule = rows[0];
    if (!rule.is_active) return res.status(400).json({ error: 'Rregulli nuk eshte aktiv.' });
    if (rule.max_usages > 0 && rule.usage_count >= rule.max_usages) {
      return res.status(400).json({ error: 'Kufiri i perdorimeve eshte arritur.' });
    }
    await pool.query('UPDATE pricing_rules SET usage_count = usage_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'usage_count +1' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Rregulli u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
