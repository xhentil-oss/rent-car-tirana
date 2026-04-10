require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();

// ─── Validate required secrets ──────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be set and at least 32 characters.');
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('❌ JWT_REFRESH_SECRET must be set and at least 32 characters.');
  process.exit(1);
}

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.emailjs.com", "https://unpkg.com", "https://images.unsplash.com"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://rentcartiranaairport.com',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Rate limit — login endpoint
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 20,
  message: { error: 'Shumë kërkesa. Provoni pas 15 minutash.' },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Shumë kërkesa. Provoni më vonë.' },
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, require('./routes/auth'));
app.use('/api/cars',          apiLimiter,  require('./routes/cars'));
app.use('/api/customers',     apiLimiter,  require('./routes/customers'));
app.use('/api/reservations',  apiLimiter,  require('./routes/reservations'));
app.use('/api/invoices',      apiLimiter,  require('./routes/invoices'));
app.use('/api/reviews',       apiLimiter,  require('./routes/reviews'));
app.use('/api/pricing-rules', apiLimiter,  require('./routes/pricingRules'));
app.use('/api/fleet',         apiLimiter,  require('./routes/fleet'));
app.use('/api/users',         apiLimiter,  require('./routes/users'));
app.use('/api/activity-logs', apiLimiter,  require('./routes/activityLogs'));
app.use('/api/chat',          apiLimiter,  require('./routes/chat'));
app.use('/api/settings',      apiLimiter,  require('./routes/settings'));
app.use('/api/blog',          apiLimiter,  require('./routes/blog'));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── API 404 for unknown endpoints ────────────────────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nuk ekziston.' });
});

// ─── SERVE FRONTEND (production) ─────────────────────────────
const distPath = path.join(__dirname, 'public');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});
