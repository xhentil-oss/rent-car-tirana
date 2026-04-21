const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const pool = require('../database/db');
const { authenticate, logActivity, ADMIN_ROLES } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const { BCRYPT_ROUNDS, REFRESH_TOKEN_EXPIRY_MS } = require('../lib/helpers');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ─── Cookie options ───────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = { httpOnly: true, secure: isProd, sameSite: isProd ? 'strict' : 'lax', path: '/' };
const ACCESS_MAX_AGE  = 60 * 60 * 1000;
const REFRESH_MAX_AGE = REFRESH_TOKEN_EXPIRY_MS;

function setAuthCookies(res, access, refresh) {
  res.cookie('rct_token', access, { ...COOKIE_OPTS, maxAge: ACCESS_MAX_AGE });
  res.cookie('rct_refresh_token', refresh, { ...COOKIE_OPTS, maxAge: REFRESH_MAX_AGE });
}

function clearAuthCookies(res) {
  res.clearCookie('rct_token', COOKIE_OPTS);
  res.clearCookie('rct_refresh_token', COOKIE_OPTS);
}

const makeTokens = (userId) => {
  const access = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
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
    body('phone').optional().isMobilePhone('any').withMessage('Numri i telefonit nuk është i vlefshëm'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, password, phone } = req.body;
    const role = 'customer';

    try {
      const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser.length) return res.status(409).json({ error: 'Ky email është tashmë i regjistruar.' });

      const [existingCust] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
      if (existingCust.length) return res.status(409).json({ error: 'Ky email është tashmë i regjistruar si klient.' });

      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const userId = uuidv4();
      const customerId = uuidv4();
      const verifyToken = crypto.randomBytes(32).toString('hex');

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(
          'INSERT INTO users (id, email, name, password, role, email_verification_token) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, email, name, hash, role, verifyToken]
        );

        await conn.query(
          'INSERT INTO customers (id, name, first_name, last_name, email, phone, type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [customerId, name, firstName, lastName, email, phone || '', 'Standard', userId]
        );

        const { access, refresh } = makeTokens(userId);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
        await conn.query(
          'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
          [uuidv4(), userId, hashToken(refresh), expiresAt]
        );

        await conn.commit();
        conn.release();

        // Send verification email (non-blocking)
        const frontendUrl = process.env.FRONTEND_URL || 'https://rentcartiranaairport.com';
        const verifyLink = `${frontendUrl}/api/auth/verify-email?token=${verifyToken}`;
        sendMail(email, 'Verifiko emailin tënd — RentCar Tirana', `
          <p>Mirë se vini, <strong>${name}</strong>!</p>
          <p>Klikoni linkun më poshtë për të verifikuar emailin tuaj:</p>
          <p><a href="${verifyLink}" style="color:#2563eb">Verifiko emailin</a></p>
          <p>Linku skudon pas 24 orësh.</p>
        `).catch(() => {});

        setAuthCookies(res, access, refresh);
        await logActivity({ userId, action: 'CREATE', entity: 'Customer', entityId: customerId, description: `Regjistrim klienti: ${email}`, ipAddress: req.ip });

        return res.status(201).json({
          user: { id: userId, email, name, role, customerId, email_verified: 0 },
        });
      } catch (txErr) {
        await conn.rollback();
        conn.release();
        throw txErr;
      }
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
      const [rows] = await pool.query(
        'SELECT id, email, name, role, password, is_active, two_factor_enabled, two_factor_secret, permissions, failed_attempts, locked_until, email_verified FROM users WHERE email = ?',
        [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Email ose fjalëkalim i gabuar.' });

      const user = rows[0];
      if (!user.is_active) return res.status(403).json({ error: 'Llogaria juaj është çaktivizuar.' });

      // Account lockout check
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remaining = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
        return res.status(423).json({ error: `Llogaria është bllokuar. Provoni pas ${remaining} minutash.` });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        const attempts = (user.failed_attempts || 0) + 1;
        if (attempts >= 5) {
          const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          await pool.query('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?', [attempts, lockedUntil, user.id]);
          return res.status(423).json({ error: 'Shumë përpjekje të gabuara. Llogaria u bllokua për 15 minuta.' });
        }
        await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
        return res.status(401).json({ error: `Email ose fjalëkalim i gabuar. (${5 - attempts} përpjekje të mbetura)` });
      }

      // Reset lockout on success
      await pool.query('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?', [user.id]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()', [user.id]);

      await logActivity({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, description: `Login: ${email}`, ipAddress: req.ip });

      // 2FA required — issue a short-lived temp token instead of full session
      if (user.two_factor_enabled) {
        const tempToken = jwt.sign(
          { userId: user.id, type: '2fa_pending' },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        );
        return res.json({ requires2fa: true, tempToken });
      }

      const { access, refresh } = makeTokens(user.id);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
      await pool.query(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), user.id, hashToken(refresh), expiresAt]
      );

      let customerId = null;
      if (!ADMIN_ROLES.includes(user.role)) {
        const [cust] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [user.id]);
        if (cust.length) customerId = cust[0].id;
      }

      setAuthCookies(res, access, refresh);
      return res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions, customerId, email_verified: user.email_verified },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
    }
  }
);

// ─── POST /api/auth/login-2fa ─────────────────────────────────
router.post('/login-2fa', async (req, res) => {
  const { tempToken, otp } = req.body;
  if (!tempToken || !otp) return res.status(400).json({ error: 'tempToken dhe OTP janë të detyrueshme.' });

  try {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token i pavlefshëm ose ka skaduar.' });
    }

    if (decoded.type !== '2fa_pending') return res.status(401).json({ error: 'Token i pavlefshëm.' });

    const [rows] = await pool.query(
      'SELECT id, email, name, role, permissions, two_factor_secret, email_verified FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Llogaria nuk ekziston.' });

    const user = rows[0];
    if (!user.two_factor_secret) return res.status(400).json({ error: '2FA nuk është konfiguruar.' });

    const valid = authenticator.check(otp, user.two_factor_secret);
    if (!valid) return res.status(401).json({ error: 'Kodi OTP është i gabuar.' });

    const { access, refresh } = makeTokens(user.id);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), user.id, hashToken(refresh), expiresAt]
    );

    let customerId = null;
    if (!ADMIN_ROLES.includes(user.role)) {
      const [cust] = await pool.query('SELECT id FROM customers WHERE user_id = ?', [user.id]);
      if (cust.length) customerId = cust[0].id;
    }

    setAuthCookies(res, access, refresh);
    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, permissions: user.permissions, customerId, email_verified: user.email_verified },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.rct_refresh_token;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token mungon.' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const hashedToken = hashToken(refreshToken);
    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()',
      [hashedToken, decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'Refresh token i pavlefshëm ose ka skaduar.' });

    const { access, refresh: newRefresh } = makeTokens(decoded.userId);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [hashedToken]);
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), decoded.userId, hashToken(newRefresh), expiresAt]
    );

    setAuthCookies(res, access, newRefresh);
    return res.json({ ok: true });
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Refresh token i pavlefshëm.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.cookies?.rct_refresh_token;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [hashToken(refreshToken)]);
    }
    clearAuthCookies(res);
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

      const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
      clearAuthCookies(res);

      return res.json({ message: 'Fjalëkalimi u ndryshua me sukses.' });
    } catch (err) {
      return res.status(500).json({ error: 'Gabim gjatë ndryshimit të fjalëkalimit.' });
    }
  }
);

// ─── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password',
  [body('email').isEmail()],
  async (req, res) => {
    // Always return 200 to prevent email enumeration
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Email i pavlefshëm.' });

    const { email } = req.body;
    try {
      const [rows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
      if (rows.length) {
        const user = rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 orë

        // Invalidate existing unused tokens for this user
        await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0', [user.id]);
        await pool.query(
          'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
          [uuidv4(), user.id, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'https://rentcartiranaairport.com';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        sendMail(email, 'Rivendosni fjalëkalimin — RentCar Tirana', `
          <p>Përshëndetje, <strong>${user.name}</strong>!</p>
          <p>Keni kërkuar rivendosjen e fjalëkalimit. Klikoni linkun më poshtë:</p>
          <p><a href="${resetLink}" style="color:#2563eb">Rivendos fjalëkalimin</a></p>
          <p>Linku skudon pas 1 ore. Nëse nuk e keni kërkuar ju, injoroni këtë email.</p>
        `).catch(() => {});
      }
      return res.json({ message: 'Nëse emaili ekziston, do të merrni udhëzime për rivendosjen.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
    }
  }
);

// ─── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, newPassword } = req.body;
    try {
      const [rows] = await pool.query(
        'SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()',
        [token]
      );
      if (!rows.length) return res.status(400).json({ error: 'Linku është i pavlefshëm ose ka skaduar.' });

      const { id: tokenId, user_id: userId } = rows[0];
      const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, userId]);
      await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [tokenId]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      clearAuthCookies(res);

      return res.json({ message: 'Fjalëkalimi u rivendos me sukses. Mund të kyçeni tani.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
    }
  }
);

// ─── GET /api/auth/verify-email ───────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token mungon.' });

  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email_verification_token = ?',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Token i pavlefshëm.' });

    await pool.query(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?',
      [rows[0].id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://rentcartiranaairport.com';
    return res.redirect(`${frontendUrl}/llogaria?verified=1`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
  }
});

// ─── POST /api/auth/resend-verification ──────────────────────
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT email_verified, email FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Useri nuk u gjet.' });
    if (rows[0].email_verified) return res.status(400).json({ error: 'Emaili është tashmë i verifikuar.' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    await pool.query('UPDATE users SET email_verification_token = ? WHERE id = ?', [verifyToken, req.user.id]);

    const frontendUrl = process.env.FRONTEND_URL || 'https://rentcartiranaairport.com';
    const verifyLink = `${frontendUrl}/api/auth/verify-email?token=${verifyToken}`;
    sendMail(rows[0].email, 'Verifiko emailin tënd — RentCar Tirana', `
      <p>Klikoni linkun për të verifikuar emailin tuaj:</p>
      <p><a href="${verifyLink}" style="color:#2563eb">Verifiko emailin</a></p>
    `).catch(() => {});

    return res.json({ message: 'Emaili i verifikimit u ridërgua.' });
  } catch (err) {
    return res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
  }
});

// ─── POST /api/auth/2fa/setup ─────────────────────────────────
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(req.user.email, 'RentCar Tirana', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return res.json({ tempSecret: secret, qrDataUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Gabim gjatë konfigurimit të 2FA.' });
  }
});

// ─── POST /api/auth/2fa/verify-setup ─────────────────────────
router.post('/2fa/verify-setup', authenticate,
  [body('tempSecret').notEmpty(), body('otp').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'tempSecret dhe OTP janë të detyrueshme.' });

    const { tempSecret, otp } = req.body;
    try {
      const valid = authenticator.check(otp, tempSecret);
      if (!valid) return res.status(400).json({ error: 'Kodi OTP është i gabuar. Provoni sërisht.' });

      await pool.query(
        'UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?',
        [tempSecret, req.user.id]
      );

      return res.json({ message: '2FA u aktivizua me sukses.' });
    } catch (err) {
      return res.status(500).json({ error: 'Gabim gjatë aktivizimit të 2FA.' });
    }
  }
);

// ─── POST /api/auth/2fa/disable ──────────────────────────────
router.post('/2fa/disable', authenticate,
  [body('otp').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'OTP është i detyrueshëm.' });

    const { otp } = req.body;
    try {
      const [rows] = await pool.query('SELECT two_factor_secret FROM users WHERE id = ?', [req.user.id]);
      if (!rows[0]?.two_factor_secret) return res.status(400).json({ error: '2FA nuk është aktiv.' });

      const valid = authenticator.check(otp, rows[0].two_factor_secret);
      if (!valid) return res.status(400).json({ error: 'Kodi OTP është i gabuar.' });

      await pool.query(
        'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?',
        [req.user.id]
      );

      return res.json({ message: '2FA u çaktivizua.' });
    } catch (err) {
      return res.status(500).json({ error: 'Gabim gjatë çaktivizimit të 2FA.' });
    }
  }
);

module.exports = router;
