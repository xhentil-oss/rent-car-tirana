require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
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
app.set('trust proxy', 1); // Trust cPanel reverse proxy — fixes req.ip and rate limiting
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://lh3.googleusercontent.com"],
      connectSrc: ["'self'", "https://api.emailjs.com", "https://unpkg.com", "https://images.unsplash.com", "https://maps.googleapis.com"],
    },
  },
}));
app.use(compression());
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'https://rentcartiranaairport.com')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Rate limit — strict for login/register/reset (brute-force sensitive)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 20,
  message: { error: 'Shumë kërkesa. Provoni pas 15 minutash.' },
});

// Lenient limiter for session endpoints used during normal navigation (/me, /refresh, /logout)
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Shumë kërkesa. Provoni më vonë.' },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Shumë kërkesa. Provoni më vonë.' },
});

// Stricter limiter for public POST endpoints (booking, reviews, customers)
const publicPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Shumë kërkesa. Provoni pas 15 minutash.' },
});

// ─── ROUTES ───────────────────────────────────────────────────
// Stricter rate limits on public POST endpoints (booking spam, review flood)
app.post('/api/customers', publicPostLimiter);
app.post('/api/reservations', publicPostLimiter);
app.post('/api/reviews', publicPostLimiter);

// Apply strict auth limiter only to login/register/forgot; lenient to /me, /refresh, /logout
const strictAuthPaths = ['/login', '/register', '/forgot-password', '/login-2fa', '/reset-password', '/resend-verification'];
app.use('/api/auth', (req, res, next) => {
  const p = req.path;
  if (strictAuthPaths.some(s => p === s || p.startsWith(s))) return authLimiter(req, res, next);
  return sessionLimiter(req, res, next);
}, require('./routes/auth'));
app.use('/api/cars',          apiLimiter,  require('./routes/cars'));
app.use('/api/customers',     apiLimiter,  require('./routes/customers'));
app.use('/api/reservations',  apiLimiter,  require('./routes/reservations'));
app.use('/api/invoices',      apiLimiter,  require('./routes/invoices'));
app.use('/api/reviews',       apiLimiter,  require('./routes/reviews'));
app.use('/api/pricing-rules', apiLimiter,  require('./routes/pricingRules'));
app.use('/api/monthly-rates', apiLimiter,  require('./routes/monthlyRates'));
app.use('/api/fleet',         apiLimiter,  require('./routes/fleet'));
app.use('/api/users',         apiLimiter,  require('./routes/users'));
app.use('/api/activity-logs', apiLimiter,  require('./routes/activityLogs'));
app.use('/api/chat',          apiLimiter,  require('./routes/chat'));
app.use('/api/settings',      apiLimiter,  require('./routes/settings'));
app.use('/api/blog',          apiLimiter,  require('./routes/blog'));
app.use('/api/deposits',      apiLimiter,  require('./routes/deposits'));
app.use('/api/customer-documents', apiLimiter, require('./routes/customerDocuments'));
app.use('/api/communication-logs', apiLimiter, require('./routes/communicationLogs'));
app.use('/api/google-reviews',     apiLimiter,  require('./routes/googleReviews'));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── API 404 for unknown endpoints ────────────────────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nuk ekziston.' });
});

// ─── SERVE FRONTEND (production) ─────────────────────────────
const distPath = path.join(__dirname, 'public');
// Cache hashed assets (JS/CSS) for 1 year; never cache index.html
app.use(express.static(distPath, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Gabim i brendshëm i serverit.' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n⚡ ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => { console.error('⏰ Forced shutdown'); process.exit(1); }, 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
