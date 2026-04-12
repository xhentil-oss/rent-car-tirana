const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity, ADMIN_ROLES } = require('../middleware/auth');

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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, carId, customerId, limit = 200, offset = 0 } = req.query;
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];

    // Security: only admin roles see all reservations; everyone else sees only their own
    if (!ADMIN_ROLES.includes(req.user.role)) {
      const [custRows] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
      if (!custRows.length) return res.json([]);
      sql += ' AND customer_id = ?'; params.push(custRows[0].id);
    } else if (customerId) {
      sql += ' AND customer_id = ?'; params.push(customerId);
    }

    if (status)     { sql += ' AND status = ?';      params.push(status); }
    if (carId)      { sql += ' AND car_id = ?';      params.push(carId); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Math.min(Math.max(1, Number(limit) || 200), 500), Math.max(0, Number(offset) || 0));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Rezervimi nuk u gjet.' });
    // Non-admin can only see their own reservation
    if (!ADMIN_ROLES.includes(req.user.role)) {
      const [custRows] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
      const custId = custRows.length ? custRows[0].id : null;
      if (rows[0].customer_id !== custId) return res.status(403).json({ error: 'Nuk keni leje.' });
    }
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// Public endpoint — no authenticate middleware intentionally (web booking form)
router.post('/', async (req, res) => {
  try {
    const { carId, customerId, pickupLocation, dropoffLocation, startDate, startTime, endDate, endTime, notes, source, insurance, extras, discountCode, website } = req.body;
    // Honeypot bot protection — real users never fill hidden 'website' field
    if (website) return res.status(400).json({ error: 'Gabim.' });
    if (!carId || !customerId || !pickupLocation || !dropoffLocation || !startDate || !endDate) {
      return res.status(400).json({ error: 'Fusha të detyrueshme mungojnë.' });
    }
    // Convert ISO datetime strings to YYYY-MM-DD for MySQL DATE columns
    const fmtDate = (d) => {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) throw new Error('Datë e pavlefshme.');
      return dt.toISOString().slice(0, 10);
    };
    let sd, ed;
    try { sd = fmtDate(startDate); ed = fmtDate(endDate); } catch { return res.status(400).json({ error: 'Datat janë të pavlefshme.' }); }
    if (sd > ed) return res.status(400).json({ error: 'Data e fillimit duhet të jetë para datës së mbarimit.' });

    // ── Transaction with row lock to prevent double-booking ──
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the car row to prevent concurrent bookings
      const [carRows] = await conn.query('SELECT id, price_per_day, quantity FROM cars WHERE id = ? FOR UPDATE', [carId]);
      if (!carRows.length) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Makina nuk u gjet.' }); }
      const pricePerDay = Number(carRows[0].price_per_day);
      const carQuantity = Number(carRows[0].quantity) || 1;

      const msPerDay = 86400000;
      const days = Math.max(1, Math.ceil((new Date(ed) - new Date(sd)) / msPerDay));
      const totalPrice = +(pricePerDay * days).toFixed(2);

      // Count overlapping reservations vs car quantity
      const [overlap] = await conn.query(
        "SELECT COUNT(*) AS cnt FROM reservations WHERE car_id = ? AND status IN ('Pending','Confirmed','Active') AND start_date <= ? AND end_date >= ?",
        [carId, ed, sd]
      );
      if (overlap[0].cnt >= carQuantity) {
        await conn.rollback(); conn.release();
        return res.status(409).json({ error: 'Makina nuk është e disponueshme për këto data.' });
      }

      const id = uuidv4();
      await conn.query(
        'INSERT INTO reservations (id, car_id, customer_id, pickup_location, dropoff_location, start_date, start_time, end_date, end_time, notes, source, total_price, insurance, extras, discount_code, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, carId, customerId, pickupLocation, dropoffLocation, sd, startTime || '10:00', ed, endTime || '10:00', notes || null, source || 'Web', totalPrice, insurance || null, extras || '', discountCode || null, null]
      );

      await conn.commit();
      conn.release();

      const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
      res.status(201).json(fmt(rows[0]));
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      throw txErr;
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

const VALID_STATUSES = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'];

router.patch('/:id/status', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Statusi duhet të jetë një nga: ${VALID_STATUSES.join(', ')}` });
    }
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, req.params.id]);
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Reservation', entityId: req.params.id, description: `Status ndryshoi në: ${status}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const fmtDate = (d) => {
      if (!d) return undefined;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) throw new Error('Datë e pavlefshme.');
      return dt.toISOString().slice(0, 10);
    };
    let sd, ed;
    try {
      sd = req.body.startDate ? fmtDate(req.body.startDate) : undefined;
      ed = req.body.endDate ? fmtDate(req.body.endDate) : undefined;
    } catch { return res.status(400).json({ error: 'Datat janë të pavlefshme.' }); }

    const fields = {
      car_id: req.body.carId,
      customer_id: req.body.customerId,
      pickup_location: req.body.pickupLocation,
      dropoff_location: req.body.dropoffLocation,
      start_date: sd,
      start_time: req.body.startTime,
      end_date: ed,
      end_time: req.body.endTime,
      notes: req.body.notes,
      source: req.body.source,
      status: req.body.status,
      insurance: req.body.insurance,
      extras: req.body.extras,
      discount_code: req.body.discountCode,
      payment_status: req.body.paymentStatus,
    };
    // Validate status if provided
    if (fields.status && !VALID_STATUSES.includes(fields.status)) {
      return res.status(400).json({ error: `Statusi duhet të jetë një nga: ${VALID_STATUSES.join(', ')}` });
    }

    // Transaction with row lock for date/car changes
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [currentRows] = await conn.query('SELECT * FROM reservations WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!currentRows.length) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Rezervimi nuk u gjet.' }); }
      const current = currentRows[0];
      const newCarId = fields.car_id || current.car_id;
      const newSd = fields.start_date || current.start_date;
      const newEd = fields.end_date || current.end_date;
      const datesOrCarChanged = fields.car_id || fields.start_date || fields.end_date;

      if (datesOrCarChanged) {
        // Lock car row and check overlap
        const [carRows] = await conn.query('SELECT price_per_day, quantity FROM cars WHERE id = ? FOR UPDATE', [newCarId]);
        if (!carRows.length) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Makina nuk u gjet.' }); }
        const carQuantity = Number(carRows[0].quantity) || 1;

        const [overlap] = await conn.query(
          "SELECT COUNT(*) AS cnt FROM reservations WHERE car_id = ? AND id != ? AND status IN ('Pending','Confirmed','Active') AND start_date <= ? AND end_date >= ?",
          [newCarId, req.params.id, newEd, newSd]
        );
        if (overlap[0].cnt >= carQuantity) {
          await conn.rollback(); conn.release();
          return res.status(409).json({ error: 'Makina nuk është e disponueshme për këto data.' });
        }
        // Recalculate price
        const msPerDay = 86400000;
        const days = Math.max(1, Math.ceil((new Date(newEd) - new Date(newSd)) / msPerDay));
        fields.total_price = +(Number(carRows[0].price_per_day) * days).toFixed(2);
      }

      const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
      if (!entries.length) { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'Asnjë fushë për të ndryshuar.' }); }
      const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
      const values = entries.map(([, v]) => v);
      values.push(req.params.id);
      await conn.query(`UPDATE reservations SET ${setClauses} WHERE id = ?`, values);

      await conn.commit();
      conn.release();
    } catch (txErr) {
      await conn.rollback();
      conn.release();
      throw txErr;
    }

    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Reservation', entityId: req.params.id, description: `Rezervim u ndryshua`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.delete('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Reservation', entityId: req.params.id, description: `Rezervim u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Rezervimi u fshi.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
