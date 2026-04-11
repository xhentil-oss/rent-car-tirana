const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity, ADMIN_ROLES } = require('../middleware/auth');

const fmt = (r) => ({ id: r.id, name: r.name, firstName: r.first_name, lastName: r.last_name, email: r.email, phone: r.phone, type: r.type, createdAt: r.created_at, updatedAt: r.updated_at });

router.get('/', authenticate, requireRole('admin', 'manager', 'staff', 'accountant'), async (req, res) => {
  try {
    const { type, search, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Math.min(Math.max(1, Number(limit) || 100), 500), Math.max(0, Number(offset) || 0));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Klienti nuk u gjet.' });
    // Non-admin can only see their own customer record
    if (!ADMIN_ROLES.includes(req.user.role) && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Nuk keni leje.' });
    }
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// Public: find-or-create customer (used by booking form)
router.post('/', async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, type = 'Standard' } = req.body;
    // Check if customer with this email already exists (match by email only, not OR phone)
    const [existing] = await pool.query(
      'SELECT * FROM customers WHERE email = ?', [email]
    );
    if (existing.length) {
      // Return existing customer without overwriting their data
      return res.json(fmt(existing[0]));
    }
    const id = uuidv4();
    const createdBy = req.user ? req.user.id : null;
    await pool.query(
      'INSERT INTO customers (id, name, first_name, last_name, email, phone, type, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [id, name || `${firstName} ${lastName}`, firstName, lastName, email, phone, type, createdBy]
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, type } = req.body;
    // Check duplicate email/phone on another customer
    const [dup] = await pool.query(
      'SELECT id FROM customers WHERE (email = ? OR phone = ?) AND id != ?', [email, phone, req.params.id]
    );
    if (dup.length) {
      return res.status(409).json({ error: 'Një klient me këtë email ose numër telefoni ekziston tashmë.' });
    }
    await pool.query(
      'UPDATE customers SET name=?, first_name=?, last_name=?, email=?, phone=?, type=? WHERE id=?',
      [name, firstName, lastName, email, phone, type, req.params.id]
    );
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Customer', entityId: req.params.id, description: `Klient u ndryshua: ${email}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.delete('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Customer', entityId: req.params.id, description: `Klient u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Klienti u fshi.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
