const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../lib/mailer');
const { contactForm } = require('../lib/emailTemplates');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Shumë kërkesa. Provoni pas 1 ore.' },
});

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Fusha të detyrueshme mungojnë.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Email i pavlefshëm.' });
  }
  if (String(message).trim().length < 10 || String(message).length > 2000) {
    return res.status(400).json({ error: 'Mesazhi duhet të jetë 10–2000 karaktere.' });
  }

  try {
    const to = process.env.MAIL_USER;
    await sendMail(
      to,
      `Kontakt: ${String(subject).slice(0, 80)} — ${String(name).slice(0, 80)}`,
      contactForm({ fromName: name, fromEmail: email, fromPhone: phone, subject, message })
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Contact]', err);
    res.status(500).json({ error: 'Dërgimi dështoi. Provoni sërish.' });
  }
});

module.exports = router;
