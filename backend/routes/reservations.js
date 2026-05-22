const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity, ADMIN_ROLES } = require('../middleware/auth');
const { safePagination } = require('../lib/helpers');
const { sendMail } = require('../lib/mailer');
const tpl = require('../lib/emailTemplates');
const {
  loadLocations,
  getLocationFee,
  getAllowedLocations,
  DEFAULT_LOCATION_FEES,
  DEFAULT_FREE_LOCATIONS,
} = require('../lib/locations');

// Location fees & free locations are loaded from the `settings` table
// (keys `location_fees` + `free_locations`) so admins can manage them from
// the UI without redeploying. See backend/lib/locations.js for details.

const fmt = (r) => ({
  id: r.id, carId: r.car_id, customerId: r.customer_id,
  pickupLocation: r.pickup_location, dropoffLocation: r.dropoff_location,
  startDate: r.start_date, startTime: r.start_time,
  endDate: r.end_date, endTime: r.end_time,
  notes: r.notes, source: r.source, status: r.status,
  totalPrice: r.total_price, locationFee: r.location_fee || 0,
  insurance: r.insurance, extras: r.extras,
  discountCode: r.discount_code, paymentStatus: r.payment_status,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

// Public: minimal availability data (only active bookings, only carId + dates)
router.get('/availability', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT car_id, start_date, end_date, start_time, end_time, status FROM reservations WHERE status IN ('Pending','Confirmed','Active')"
    );
    res.json(rows.map(r => ({
      carId: r.car_id,
      startDate: r.start_date,
      endDate: r.end_date,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, carId, customerId, limit = 200, offset = 0 } = req.query;
    // Single-query approach: JOIN customers so non-admins can be scoped via c.user_id
    // without an extra round-trip (fixes N+1).
    let sql = 'SELECT r.* FROM reservations r';
    const params = [];

    if (!ADMIN_ROLES.includes(req.user.role)) {
      sql += ' INNER JOIN customers c ON c.id = r.customer_id AND c.user_id = ?';
      params.push(req.user.id);
      sql += ' WHERE 1=1';
    } else {
      sql += ' WHERE 1=1';
      if (customerId) { sql += ' AND r.customer_id = ?'; params.push(customerId); }
    }

    if (status)     { sql += ' AND r.status = ?';      params.push(status); }
    if (carId)      { sql += ' AND r.car_id = ?';      params.push(carId); }
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(...safePagination(limit, offset, 200));
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
    const { carId, customerId, startDate, startTime, endDate, endTime, notes, source, insurance, extras, discountCode, website, customerEmail } = req.body;
    let { pickupLocation, dropoffLocation } = req.body;
    // Honeypot bot protection — real users never fill hidden 'website' field
    if (website) return res.status(400).json({ error: 'Gabim.' });
    if (!carId || !customerId || !pickupLocation || !dropoffLocation || !startDate || !endDate) {
      return res.status(400).json({ error: 'Fusha të detyrueshme mungojnë.' });
    }

    // Verify customerId matches a real customer, and if customerEmail provided, that they match
    const [custCheck] = await pool.query('SELECT id, email FROM customers WHERE id = ?', [customerId]);
    if (!custCheck.length) return res.status(400).json({ error: 'Klient i pavlefshëm.' });
    if (customerEmail && custCheck[0].email.toLowerCase() !== String(customerEmail).toLowerCase()) {
      return res.status(403).json({ error: 'Klient i pavlefshëm.' });
    }

    // Validate locations against admin-managed list (prevent arbitrary values).
    // Tolerant comparison: trim + Unicode NFC so admin-entered diacritics
    // ("Tiranë Qendër" with NBSP, or NFD-decomposed ë) still match.
    const normLoc = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    const allowedRaw = await getAllowedLocations();
    const ALLOWED_LOCATIONS = allowedRaw.map(normLoc);
    const pickupNorm = normLoc(pickupLocation);
    const dropoffNorm = normLoc(dropoffLocation);
    if (!ALLOWED_LOCATIONS.includes(pickupNorm) || !ALLOWED_LOCATIONS.includes(dropoffNorm)) {
      console.warn('[reservations] Invalid location', {
        pickupLocation, dropoffLocation, pickupNorm, dropoffNorm, ALLOWED_LOCATIONS,
      });
      return res.status(400).json({ error: 'Lokacion i pavlefshëm.' });
    }
    // Use canonical spelling going forward (consistent storage + fee lookup).
    pickupLocation = allowedRaw[ALLOWED_LOCATIONS.indexOf(pickupNorm)];
    dropoffLocation = allowedRaw[ALLOWED_LOCATIONS.indexOf(dropoffNorm)];

    // Validate free-text lengths
    if (notes && String(notes).length > 1000) return res.status(400).json({ error: 'Shënime shumë të gjata.' });
    if (discountCode && String(discountCode).length > 50) return res.status(400).json({ error: 'Kodi i zbritjes i pavlefshëm.' });
    const ALLOWED_INSURANCE = ['basic', 'standard', 'premium', 'full'];
    const insuranceNorm = insurance ? String(insurance).charAt(0).toUpperCase() + String(insurance).slice(1).toLowerCase() : null;
    if (insuranceNorm && !ALLOWED_INSURANCE.includes(insuranceNorm.toLowerCase())) return res.status(400).json({ error: 'Siguracion i pavlefshëm.' });
    if (extras && String(extras).length > 500) return res.status(400).json({ error: 'Ekstra shumë të gjata.' });

    // Convert incoming date values to YYYY-MM-DD without timezone shifting.
    const parseDateOnly = (value) => {
      const raw = String(value || '').trim();
      const match = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
      if (!match) throw new Error('Datë e pavlefshme.');
      const [year, month, day] = match[1].split('-').map(Number);
      const dt = new Date(year, month - 1, day);
      if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
        throw new Error('Datë e pavlefshme.');
      }
      return match[1];
    };
    const parseTimeOnly = (value) => {
      const raw = String(value || '').trim();
      const match = raw.match(/^(\d{2}):(\d{2})$/);
      if (!match) throw new Error('Ora është e pavlefshme.');
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) throw new Error('Ora është e pavlefshme.');
      return `${match[1]}:${match[2]}`;
    };
    const buildDateTime = (dateValue, timeValue) => {
      const [year, month, day] = dateValue.split('-').map(Number);
      const [hours, minutes] = timeValue.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    };
    const formatDateOnlyToLocale = (value) => {
      const raw = String(value || '').trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return String(value || '');
      const [year, month, day] = match[1].split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('sq-AL');
    };
    let sd, ed, st, et;
    try {
      sd = parseDateOnly(startDate);
      ed = parseDateOnly(endDate);
      st = parseTimeOnly(startTime || '10:00');
      et = parseTimeOnly(endTime || '10:00');
    } catch {
      return res.status(400).json({ error: 'Datat ose oraret janë të pavlefshme.' });
    }
    const startDateTime = buildDateTime(sd, st);
    const endDateTime = buildDateTime(ed, et);
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ error: 'Data dhe ora e mbarimit duhet të jenë pas datës dhe orës së fillimit.' });
    }

    // ── Transaction with row lock to prevent double-booking ──
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock the car row to prevent concurrent bookings
      const [carRows] = await conn.query('SELECT id, brand, model, price_per_day, quantity, category FROM cars WHERE id = ? FOR UPDATE', [carId]);
      if (!carRows.length) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Makina nuk u gjet.' }); }
      const basePricePerDay = Number(carRows[0].price_per_day);
      const carQuantity = Number(carRows[0].quantity) || 1;
      const carCategory = carRows[0].category;

      // Check for monthly rate override (car-specific > category > all)
      const [sdYear, sdMonth] = sd.split('-').map(Number);
      const startMonth = sdMonth;
      const startYear = sdYear;
      const [monthlyRates] = await conn.query(
        'SELECT applies_to, applies_to_value, price_per_day FROM monthly_rates WHERE month = ? AND (year = ? OR year IS NULL)',
        [startMonth, startYear]
      );
      let pricePerDay = basePricePerDay;
      const mrCar = monthlyRates.find(r => r.applies_to === 'car' && r.applies_to_value === carId);
      const mrCat = monthlyRates.find(r => r.applies_to === 'category' && r.applies_to_value === carCategory);
      const mrAll = monthlyRates.find(r => r.applies_to === 'all');
      if (mrCar) pricePerDay = Number(mrCar.price_per_day);
      else if (mrCat) pricePerDay = Number(mrCat.price_per_day);
      else if (mrAll) pricePerDay = Number(mrAll.price_per_day);

      const [edYear, edMonth, edDay] = ed.split('-').map(Number);
      const [sdYear2, sdMonth2, sdDay2] = sd.split('-').map(Number);
      const msPerDay = 86400000;
      const days = Math.max(1, Math.ceil((new Date(edYear, edMonth - 1, edDay).getTime() - new Date(sdYear2, sdMonth2 - 1, sdDay2).getTime()) / msPerDay));
      const locationFee = await getLocationFee(pickupLocation, dropoffLocation);
      const totalPrice = +(pricePerDay * days + locationFee).toFixed(2);

      // Count overlapping reservations vs car quantity, including time-of-day when available.
      const [overlap] = await conn.query(
        `SELECT COUNT(*) AS cnt FROM reservations
         WHERE car_id = ?
           AND status IN ('Pending','Confirmed','Active')
           AND (
             (start_date < ? OR (start_date = ? AND start_time < ?))
             AND
             (end_date > ? OR (end_date = ? AND end_time > ?))
           )`,
        [carId, ed, ed, endTime || '10:00', sd, sd, startTime || '10:00']
      );
      if (overlap[0].cnt >= carQuantity) {
        await conn.rollback(); conn.release();
        return res.status(409).json({ error: 'Makina nuk është e disponueshme për këto data.' });
      }

      const id = uuidv4();
      await conn.query(
        'INSERT INTO reservations (id, car_id, customer_id, pickup_location, dropoff_location, start_date, start_time, end_date, end_time, notes, source, total_price, location_fee, insurance, extras, discount_code, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, carId, customerId, pickupLocation, dropoffLocation, sd, startTime || '10:00', ed, endTime || '10:00', notes || null, source || 'Web', totalPrice, locationFee, insuranceNorm || null, extras || '', discountCode || null, null]
      );

      await conn.commit();
      conn.release();

      const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
      const [custRows] = await pool.query('SELECT name, email FROM customers WHERE id = ?', [customerId]);
      if (custRows.length && custRows[0].email) {
        const fmtLocale = (d) => {
          const raw = String(d || '').trim();
          const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!match) return String(d || '');
          const [year, month, day] = match[1].split('-').map(Number);
          return new Date(year, month - 1, day).toLocaleDateString('sq-AL');
        };
        sendMail(
          custRows[0].email,
          'Konfirmim Rezervimi — Rent Car Tirana',
          tpl.bookingConfirmation({
            customerName: custRows[0].name,
            carName: `${carRows[0].brand || ''} ${carRows[0].model || ''}`.trim(),
            pickupLocation,
            dropoffLocation,
            startDate: fmtLocale(sd),
            endDate: fmtLocale(ed),
            startTime: startTime || '10:00',
            endTime: endTime || '10:00',
            totalPrice,
            insurance: insurance || null,
            reservationId: id,
          })
        ).catch((e) => console.error('[Email] booking confirmation failed:', e));
      }
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

    // Send status email non-blocking — after response is sent
    if (['Confirmed', 'Cancelled', 'Completed'].includes(status)) {
      pool.query(
        `SELECT r.total_price, r.pickup_location, r.start_date, r.end_date,
                cu.name AS customer_name, cu.email AS customer_email,
                ca.brand, ca.model
         FROM reservations r
         JOIN customers cu ON cu.id = r.customer_id
         JOIN cars ca ON ca.id = r.car_id
         WHERE r.id = ?`,
        [req.params.id]
      ).then(([eRows]) => {
        if (!eRows.length || !eRows[0].customer_email) return;
        const r = eRows[0];
        const fmtLocale = (d) => {
          const raw = String(d || '').trim();
          const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!match) return String(d || '');
          const [year, month, day] = match[1].split('-').map(Number);
          return new Date(year, month - 1, day).toLocaleDateString('sq-AL');
        };
        const emailData = {
          customerName: r.customer_name,
          carName: `${r.brand} ${r.model}`,
          startDate: fmtLocale(r.start_date),
          endDate: fmtLocale(r.end_date),
          pickupLocation: r.pickup_location,
          totalPrice: r.total_price,
          reservationId: req.params.id,
        };
        if (status === 'Confirmed') {
          sendMail(r.customer_email, 'Rezervimi u konfirmua — Rent Car Tirana', tpl.reservationConfirmed(emailData)).catch(() => {});
        } else if (status === 'Cancelled') {
          sendMail(r.customer_email, 'Rezervimi u anulua — Rent Car Tirana', tpl.reservationCancelled(emailData)).catch(() => {});
        } else if (status === 'Completed') {
          sendMail(r.customer_email, 'Fatura juaj — Rent Car Tirana', tpl.invoiceEmail({
            ...emailData,
            invoiceNo: `INV-${String(req.params.id).slice(0, 8).toUpperCase()}`,
          })).catch(() => {});
        }
      }).catch(() => {});
    }
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
        const [carRows] = await conn.query('SELECT price_per_day, quantity, category FROM cars WHERE id = ? FOR UPDATE', [newCarId]);
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
        // Check monthly rate override for new dates
        const [nSdYear, nSdMonth] = newSd.split('-').map(Number);
        const startMonth = nSdMonth;
        const startYear = nSdYear;
        const [monthlyRates] = await conn.query(
          'SELECT applies_to, applies_to_value, price_per_day FROM monthly_rates WHERE month = ? AND (year = ? OR year IS NULL)',
          [startMonth, startYear]
        );
        let effectivePrice = Number(carRows[0].price_per_day);
        const mrCar = monthlyRates.find(r => r.applies_to === 'car' && r.applies_to_value === newCarId);
        const mrCat = monthlyRates.find(r => r.applies_to === 'category' && r.applies_to_value === carRows[0].category);
        const mrAll = monthlyRates.find(r => r.applies_to === 'all');
        if (mrCar) effectivePrice = Number(mrCar.price_per_day);
        else if (mrCat) effectivePrice = Number(mrCat.price_per_day);
        else if (mrAll) effectivePrice = Number(mrAll.price_per_day);

        const [nEdYear, nEdMonth, nEdDay] = newEd.split('-').map(Number);
        const [nSdYear2, nSdMonth2, nSdDay2] = newSd.split('-').map(Number);
        const msPerDay = 86400000;
        const days = Math.max(1, Math.ceil((new Date(nEdYear, nEdMonth - 1, nEdDay).getTime() - new Date(nSdYear2, nSdMonth2 - 1, nSdDay2).getTime()) / msPerDay));
        const newPickup = fields.pickup_location || current.pickup_location;
        const newDropoff = fields.dropoff_location || current.dropoff_location;
        const newLocationFee = await getLocationFee(newPickup, newDropoff);
        fields.location_fee = newLocationFee;
        fields.total_price = +(effectivePrice * days + newLocationFee).toFixed(2);
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

// Expose loader hooks for other modules (e.g. settings public endpoint).
// Properties on a router are ignored by Express but available via require().
router.loadLocations = loadLocations;
// Deprecated direct references — kept for backward compatibility with any
// caller that imported them previously. Reflect defaults only; use
// `loadLocations()` for live values.
router.LOCATION_FEES = DEFAULT_LOCATION_FEES;
router.FREE_LOCATIONS = DEFAULT_FREE_LOCATIONS;

module.exports = router;
