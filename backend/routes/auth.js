const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const pool = require('../database/db');
const { authenticate, logActivity } = require('../middleware/auth');

const makeTokens = (userId) => {
  const access = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { access, refresh };
};

// ─── POST /api/auth/register ─────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email i pavlefshëm'),
    body('password').isLength({ min: 8 }).withMessage('Fjalëkalimi duhet të ketë min 8 karaktere'),
    body('name').notEmpty().withMessage('Emri është i detyrueshëm'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, password, role = 'staff' } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'Ky email është tashmë i regjistruar.' });

      const hash = await bcrypt.hash(password, 12);
      const id = uuidv4();

      await pool.query(
        'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)',
        [id, email, name, hash, role]
      );

      const { access, refresh } = makeTokens(id);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), id, refresh, expiresAt]
      );

      await logActivity({ userId: id, action: 'CREATE', entity: 'User', entityId: id, description: `Regjistrim i ri: ${email}`, ipAddress: req.ip });

      return res.status(201).json({ accessToken: access, refreshToken: refresh, user: { id, email, name, role } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar.' });

      const user = rows[0];
      if (!user.is_active) return res.status(403).json({ error: 'Llogaria juaj është çaktivizuar.' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar.' });

      const { access, refresh } = makeTokens(user.id);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()', [user.id]);
      await pool.query(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), user.id, refresh, expiresAt]
      );

      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      await logActivity({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, description: `Login: ${email}`, ipAddress: req.ip });

      return res.json({
        accessToken: access,
        refreshToken: refresh,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token mungon.' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
      [refreshToken, decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Refresh token i pavlefshëm ose ka skaduar.' });

    const { access, refresh: newRefresh } = makeTokens(decoded.userId);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), decoded.userId, newRefresh, expiresAt]
    );

    return res.json({ accessToken: access, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token i pavlefshëm.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    await logActivity({ userId: req.user.id, action: 'LOGOUT', entity: 'User', entityId: req.user.id, description: `Logout: ${req.user.email}`, ipAddress: req.ip });
    return res.json({ message: 'U shkyçët me sukses.' });
  } catch (err) {
    return res.status(500).json({ error: 'Gabim gjatë shkyçjes.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ─── POST /api/auth/change-password ──────────────────────────
router.post('/change-password', authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    try {
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
      const valid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!valid) return res.status(400).json({ error: 'Fjalëkalimi aktual është i gabuar.' });

      const hash = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);

      return res.json({ message: 'Fjalëkalimi u ndryshua me sukses.' });
    } catch (err) {
      return res.status(500).json({ error: 'Gabim gjatë ndryshimit të fjalëkalimit.' });
    }
  }
);

module.exports = router;
