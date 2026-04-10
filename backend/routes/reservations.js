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

// Public: minimal availability data (only active bookings, only carId + dates)
router.get('/availability', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT car_id, start_date, end_date, status FROM reservations WHERE status IN ('Pending','Confirmed','Active')"
    );
    res.json(rows.map(r => ({ carId: r.car_id, startDate: r.start_date, endDate: r.end_date, status: r.status })));
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    // Convert ISO datetime strings to YYYY-MM-DD for MySQL DATE columns
    const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);
    const id = uuidv4();
    await pool.query(
      'INSERT INTO reservations (id, car_id, customer_id, pickup_location, dropoff_location, start_date, start_time, end_date, end_time, notes, source, total_price, insurance, extras, discount_code, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, carId, customerId, pickupLocation, dropoffLocation, fmtDate(startDate), startTime || '10:00', fmtDate(endDate), endTime || '10:00', notes || null, source || 'Web', totalPrice, insurance || null, extras || '', discountCode || null, null]
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
    const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : undefined;
    const fields = {
      car_id: req.body.carId,
      customer_id: req.body.customerId,
      pickup_location: req.body.pickupLocation,
      dropoff_location: req.body.dropoffLocation,
      start_date: req.body.startDate ? fmtDate(req.body.startDate) : undefined,
      start_time: req.body.startTime,
      end_date: req.body.endDate ? fmtDate(req.body.endDate) : undefined,
      end_time: req.body.endTime,
      notes: req.body.notes,
      source: req.body.source,
      status: req.body.status,
      total_price: req.body.totalPrice,
      insurance: req.body.insurance,
      extras: req.body.extras,
      discount_code: req.body.discountCode,
      payment_status: req.body.paymentStatus,
    };
    // Only update fields that were actually sent
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (!entries.length) return res.status(400).json({ error: 'Asnjë fushë për të ndryshuar.' });
    const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = entries.map(([, v]) => v);
    values.push(req.params.id);
    await pool.query(`UPDATE reservations SET ${setClauses} WHERE id = ?`, values);
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
