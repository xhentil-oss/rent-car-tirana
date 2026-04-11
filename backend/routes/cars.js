const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');

const toSnake = (r) => ({
  id: r.id, brand: r.brand, model: r.model, year: r.year,
  category: r.category, transmission: r.transmission, fuel: r.fuel,
  seats: r.seats, luggage: r.luggage, pricePerDay: r.price_per_day,
  status: r.status, image: r.image, slug: r.slug, featured: !!r.featured,
  quantity: r.quantity ?? 1, description: r.description ?? '',
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
    params.push(Math.min(Math.max(1, Number(limit) || 100), 500), Math.max(0, Number(offset) || 0));
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(toSnake));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Makina nuk u gjet.' });
    res.json(toSnake(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status, image, slug, featured, quantity, description } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO cars (id, brand, model, year, category, transmission, fuel, seats, luggage, price_per_day, status, image, slug, featured, quantity, description, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, brand, model, year, category, transmission, fuel, seats, luggage, pricePerDay, status || 'Available', image, slug, featured ? 1 : 0, quantity ?? 1, description ?? null, req.user.id]
    );
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'Car', entityId: id, description: `Makina e re: ${brand} ${model}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    res.status(201).json(toSnake(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const fields = req.body;
    // Build partial update — only update fields that were actually sent
    const mapping = {
      brand: fields.brand, model: fields.model, year: fields.year,
      category: fields.category, transmission: fields.transmission, fuel: fields.fuel,
      seats: fields.seats, luggage: fields.luggage, price_per_day: fields.pricePerDay,
      status: fields.status, image: fields.image, slug: fields.slug,
      featured: fields.featured !== undefined ? (fields.featured ? 1 : 0) : undefined,
      quantity: fields.quantity, description: fields.description,
    };
    const entries = Object.entries(mapping).filter(([, v]) => v !== undefined);
    if (!entries.length) return res.status(400).json({ error: 'Asnjë fushë për të ndryshuar.' });
    const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = entries.map(([, v]) => v);
    values.push(req.params.id);
    await pool.query(`UPDATE cars SET ${setClauses} WHERE id = ?`, values);
    await logActivity({ userId: req.user.id, action: 'UPDATE', entity: 'Car', entityId: req.params.id, description: `Makina u ndryshua: ${fields.brand || ''} ${fields.model || ''}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    res.json(toSnake(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM cars WHERE id = ?', [req.params.id]);
    await logActivity({ userId: req.user.id, action: 'DELETE', entity: 'Car', entityId: req.params.id, description: `Makina u fshi: ${req.params.id}`, ipAddress: req.ip });
    res.json({ message: 'Makina u fshi.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
