const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');

const toSnake = (r) => ({
  id: r.id, brand: r.brand, model: r.model, year: r.year,
  category: r.category, transmission: r.transmission, fuel: r.fuel,
  seats: r.seats, luggage: r.luggage, pricePerDay: r.price_per_day,
  status: r.status, image: r.image, slug: r.slug, featured: !!r.featured,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

router.get('/', async (req, res) => {
  try {
    const { category, status, featured, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status)   { sql += ' AND status = ?';   params.push(status); }
    if (featured !== undefined) { sql += ' AND featured = ?'; params.push(featured === 'true' ? 1 : 0); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(toSnake));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Makina nuk u gjet.' });
    res.json(toSnake(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status, image, slug, featured } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO cars (id, brand, model, year, category, transmission, fuel, seats, luggage, price_per_day, status, image, slug, featured, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status || 'Available', image, slug, featured ? 1 : 0, req.user.id]
    );
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'Car', entityId: id, description: `Makina e re: ${brand} ${model}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    res.status(201).json(toSnake(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status, image, slug, featured } = req.body;
    await pool.query(
      'UPDATE cars SET brand=?, model=?, year=?, category=?, transmission=?, fuel=?, seats=?, luggage=?, price_per_day=?, status=?, image=?, slug=?, featured=? WHERE id=?',
      [brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status, image, slug, featured ? 1 : 0, req.params.id]
    );
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Car', entityId: req.params.id, description: `Makina u ndryshua: ${brand} ${model}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    res.json(toSnake(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM cars WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Car', entityId: req.params.id, description: `Makina u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Makina u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
