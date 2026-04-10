const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');

const fmt = (r) => ({ id: r.id, rating: r.rating, text: r.text, authorName: r.author_name, aspects: r.aspects, approved: !!r.approved, createdAt: r.created_at, updatedAt: r.updated_at });

// Public — only approved
router.get('/', async (req, res) => {
  try {
    const admin = req.query.admin === 'true';
    let sql = admin ? 'SELECT * FROM reviews ORDER BY created_at DESC' : 'SELECT * FROM reviews WHERE approved = 1 ORDER BY created_at DESC';
    const [rows] = await pool.query(sql);
    res.json(rows.map(fmt));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public submit
router.post('/', async (req, res) => {
  try {
    const { rating, text, authorName, aspects } = req.body;
    const id = uuidv4();
    await pool.query('INSERT INTO reviews (id, rating, text, author_name, aspects, approved) VALUES (?,?,?,?,?,0)', [id, rating, text, authorName, aspects || null]);
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/approve', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { approved } = req.body;
    await pool.query('UPDATE reviews SET approved = ? WHERE id = ?', [approved ? 1 : 0, req.params.id]);
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Review', entityId: req.params.id, description: `Review ${approved ? 'u aprovua' : 'u refuzua'}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
