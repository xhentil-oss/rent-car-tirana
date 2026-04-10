const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const { authenticate, logActivity } = require('../middleware/auth');

const fmt = (r) => ({ id: r.id, invoiceNo: r.invoice_no, reservationId: r.reservation_id, amount: r.amount, status: r.status, dueDate: r.due_date, paidAt: r.paid_at, createdAt: r.created_at, updatedAt: r.updated_at });

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, reservationId } = req.query;
    let sql = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    if (status)        { sql += ' AND status = ?';         params.push(status); }
    if (reservationId) { sql += ' AND reservation_id = ?'; params.push(reservationId); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(fmt));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ? OR invoice_no = ?', [req.params.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Fatura nuk u gjet.' });
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { invoiceNo, reservationId, amount, status, dueDate } = req.body;
    const id = uuidv4();
    await pool.query('INSERT INTO invoices (id, invoice_no, reservation_id, amount, status, due_date, created_by) VALUES (?,?,?,?,?,?,?)', [id, invoiceNo, reservationId, amount, status || 'Pa paguar', dueDate, req.user.id]);
    await logActivity({ userId: req.user.id, action: 'CREATE', entity: 'Invoice', entityId: id, description: `Faturë e re: ${invoiceNo}`, ipAddress: req.ip });
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [id]);
    res.status(201).json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { invoiceNo, reservationId, amount, status, dueDate } = req.body;
    const paidAt = status === 'Paguar' ? new Date() : null;
    await pool.query('UPDATE invoices SET invoice_no=?, reservation_id=?, amount=?, status=?, due_date=?, paid_at=? WHERE id=?', [invoiceNo, reservationId, amount, status, dueDate, paidAt, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    res.json(fmt(rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fatura u fshi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
