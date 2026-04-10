const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, logActivity } = require('../middleware/auth');

const fmt = (r) => ({
  id: r.id, carId: r.car_id, customerId: r.customer_id,
  pickupLocation: r.pickup_location, dropoffLocation: r.dropoff_location,
  startDate: r.start_date, startTime: r.start_time,
  endDate: r.end_date, endTime: r.end_time,
  notes: r.notes, source: r.source, status: r.status,
  totalPrice: r.total_price, insurance: r.insurance, extras: r.extras,
  discountCode: r.discount_code, paymentStatus: r.payment_status,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, carId, customerId, limit = 200, offset = 0 } = req.query;
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];
    if (status)     { sql += ' AND status = ?';      params.push(status); }
    if (carId)      { sql += ' AND car_id = ?';      params.push(carId); }
    if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(fmt));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rezervimi nuk u gjet.' });
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public endpoint — no authenticate middleware intentionally (web booking form)
router.post('/', async (req, res) => {
  try {
    const { carId, customerId, pickupLocation, dropoffLocation, startDate, startTime, endDate, endTime, notes, source, totalPrice, insurance, extras, discountCode } = req.body;
    if (!carId || !customerId || !pickupLocation || !dropoffLocation || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ error: 'Fusha të detyrueshme mungojnë.' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO reservations (id, car_id, customer_id, pickup_location, dropoff_location, start_date, start_time, end_date, end_time, notes, source, total_price, insurance, extras, discount_code, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, carId, customerId, pickupLocation, dropoffLocation, startDate, startTime || '10:00', endDate, endTime || '10:00', notes || null, source || 'Web', totalPrice, insurance || null, extras || '', discountCode || null, null]
    );
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Reservation', entityId: req.params.id, description: `Status ndryshoi në: ${status}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { carId, customerId, pickupLocation, dropoffLocation, startDate, startTime, endDate, endTime, notes, source, status, totalPrice, insurance, extras, discountCode, paymentStatus } = req.body;
    await pool.query(
      'UPDATE reservations SET car_id=?, customer_id=?, pickup_location=?, dropoff_location=?, start_date=?, start_time=?, end_date=?, end_time=?, notes=?, source=?, status=?, total_price=?, insurance=?, extras=?, discount_code=?, payment_status=? WHERE id=?',
      [carId, customerId, pickupLocation, dropoffLocation, startDate, startTime, endDate, endTime, notes, source, status, totalPrice, insurance, extras, discountCode, paymentStatus, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Reservation', entityId: req.params.id, description: `Rezervim u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Rezervimi u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
