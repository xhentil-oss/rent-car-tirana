const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, logActivity } = require('../middleware/auth');

const fmt = (r) => ({ id: r.id, name: r.name, firstName: r.first_name, lastName: r.last_name, email: r.email, phone: r.phone, type: r.type, createdAt: r.created_at, updatedAt: r.updated_at });

router.get('/', authenticate, async (req, res) => {
  try {
    const { type, search, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(fmt));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Klienti nuk u gjet.' });
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, type = 'Standard' } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO customers (id, name, first_name, last_name, email, phone, type, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [id, name || `${firstName} ${lastName}`, firstName, lastName, email, phone, type, req.user.id]
    );
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'Customer', entityId: id, description: `Klient i ri: ${email}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, type } = req.body;
    await pool.query(
      'UPDATE customers SET name=?, first_name=?, last_name=?, email=?, phone=?, type=? WHERE id=?',
      [name, firstName, lastName, email, phone, type, req.params.id]
    );
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Customer', entityId: req.params.id, description: `Klient u ndryshua: ${email}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Customer', entityId: req.params.id, description: `Klient u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Klienti u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
