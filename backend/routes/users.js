const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');

const fmt = (r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, isActive: !!r.is_active, twoFactorEnabled: !!r.two_factor_enabled, permissions: r.permissions, lastLogin: r.last_login, createdAt: r.created_at });

router.get('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, role, is_active, two_factor_enabled, permissions, last_login, created_at FROM users ORDER BY created_at DESC');
    res.json(rows.map(fmt));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { email, name, password, role, permissions } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Fjalëkalimi duhet të ketë min 8 karaktere.' });
    if (!email || !name) return res.status(400).json({ error: 'Email dhe emri janë të detyrueshme.' });
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email ekziston.' });
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    await pool.query('INSERT INTO users (id, email, name, password, role, permissions) VALUES (?,?,?,?,?,?)', [id, email, name, hash, role || 'staff', permissions || '']);
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'User', entityId: id, description: `Përdorues i ri: ${email}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT id, email, name, role, is_active, two_factor_enabled, permissions, last_login, created_at FROM users WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, role, isActive, permissions, twoFactorEnabled } = req.body;
    // Use COALESCE to preserve existing values when fields are not sent
    await pool.query(
      'UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role), is_active=COALESCE(?,is_active), permissions=COALESCE(?,permissions), two_factor_enabled=COALESCE(?,two_factor_enabled) WHERE id=?',
      [name, role, isActive !== undefined ? (isActive ? 1 : 0) : null, permissions !== undefined ? permissions : null, twoFactorEnabled !== undefined ? (twoFactorEnabled ? 1 : 0) : null, req.params.id]
    );
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'User', entityId: req.params.id, description: `Përdorues u ndryshua: ${req.params.id}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT id, email, name, role, is_active, two_factor_enabled, permissions, last_login, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Nuk mund të fshini llogarinë tuaj.' });
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'User', entityId: req.params.id, description: `Përdorues u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Përdoruesi u fshi.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
