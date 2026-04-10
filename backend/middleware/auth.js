const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');

/**
 * Verify access token — attaches req.user on success
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token mungon. Ju luteni kyçuni.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, email, name, role, is_active, permissions FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ error: 'Llogaria nuk ekziston ose është çaktivizuar.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token ka skaduar. Kyçuni sërisht.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token i pavlefshëm.' });
  }
};

/**
 * Require specific roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Jo i autentifikuar.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Nuk keni leje për këtë veprim.' });
  }
  next();
};

/**
 * Log activity helper
 */
const logActivity = async ({ userId, action, entity, entityId, description, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action, entity, entity_id, description, ip_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuidv4(), userId || null, action, entity, entityId || null, description, ipAddress || null]
    );
  } catch (e) {
    // Non-critical — don't break main flow
    console.error('Activity log error:', e.message);
  }
};

module.exports = { authenticate, requireRole, logActivity };
