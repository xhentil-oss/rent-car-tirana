const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');
const { safePagination } = require('../lib/helpers');

const VALID_TYPES = ['seasonal', 'duration', 'early_bird', 'last_minute', 'promo_code', 'loyalty', 'length_of_stay', 'weekend'];
const VALID_DISCOUNT_TYPES = ['percentage', 'percent', 'fixed'];

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
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE is_active = 1 ORDER BY priority DESC, created_at DESC');
    // Hide promo codes and sensitive fields from public
    res.set('Cache-Control', 'public, max-age=60');
    res.json(rows.map(r => ({
      id: r.id, name: r.name, type: r.type, discountType: r.discount_type,
      discountValue: r.discount_value, startDate: r.start_date, endDate: r.end_date,
      minDays: r.min_days, maxDays: r.max_days,
      applicableTo: r.applicable_to, isActive: !!r.is_active, priority: r.priority,
      description: r.description,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// Admin GET — full data including promo codes
router.get('/admin', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { limit = 200, offset = 0 } = req.query;
    const [rows] = await pool.query('SELECT * FROM pricing_rules ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?',
      safePagination(limit, offset, 200));
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.post('/', authenticate, requireRole('admin', 'manager'), [
  body('name').notEmpty().isLength({ max: 200 }),
  body('type').optional().isIn(VALID_TYPES),
  body('discountType').optional().isIn(VALID_DISCOUNT_TYPES),
  body('discountValue').isFloat({ min: 0, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive, priority, description, maxUsages } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO pricing_rules (id, name, type, discount_type, discount_value, start_date, end_date, min_days, max_days, advance_booking_days, last_minute_hours, promo_code, applicable_to, is_active, priority, description, max_usages, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo || 'all', isActive ? 1 : 0, priority || 0, description, maxUsages || 0, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [id]);
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'PricingRule', entityId: id, description: `Rregull çmimi u krijua: ${name}`, ipAddress: req.ip });
    res.status(201).json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive, priority, description, maxUsages } = req.body;
    await pool.query(
      'UPDATE pricing_rules SET name=?, type=?, discount_type=?, discount_value=?, start_date=?, end_date=?, min_days=?, max_days=?, advance_booking_days=?, last_minute_hours=?, promo_code=?, applicable_to=?, is_active=?, priority=?, description=?, max_usages=? WHERE id=?',
      [name, type, discountType, discountValue, startDate, endDate, minDays, maxDays, advanceBookingDays, lastMinuteHours, promoCode, applicableTo, isActive ? 1 : 0, priority, description, maxUsages, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM pricing_rules WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'PricingRule', entityId: req.params.id, description: `Rregull çmimi u ndryshua: ${name}`, ipAddress: req.ip });
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// Called when a pricing rule is applied during booking — requires auth
router.post('/:id/use', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing_rules WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'PricingRule', entityId: req.params.id, description: `Rregull çmimi u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Rregulli u fshi.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
