const router = require('express').Router();
const pool = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { entity, action, userId, limit = 100, offset = 0 } = req.query;
    let sql = `SELECT al.*, u.name as user_name, u.email as user_email
               FROM activity_logs al
               LEFT JOIN users u ON al.user_id = u.id
               WHERE 1=1`;
    const p = [];
    if (entity) { sql += ' AND al.entity = ?'; p.push(entity); }
    if (action) { sql += ' AND al.action = ?'; p.push(action); }
    if (userId) { sql += ' AND al.user_id = ?'; p.push(userId); }
    sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
    p.push(Number(limit), Number(offset));
    const [rows] = await pool.query(sql, p);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
