const router = require('express').Router();
const pool = require('../database/db');
const { authenticate, requireRole, logActivity } = require('../middleware/auth');

// GET all settings (admin only)
router.get('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, category, updated_at FROM settings ORDER BY category, setting_key');
    // Group by category
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.setting_key] = row.setting_value;
    }
    res.json({ settings: grouped, raw: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// PUT — bulk upsert settings
router.put('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { settings } = req.body; // { "key": "value", ... }
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Formati i gabuar. Dërgo { settings: { key: value } }' });
    }

    const entries = Object.entries(settings);
    for (const [key, value] of entries) {
      // Determine category from key prefix (e.g. smtp_host → smtp, company_name → company)
      const category = key.split('_')[0] || 'general';
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value, category, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), category = VALUES(category), updated_by = VALUES(updated_by)',
        [key, String(value), category, req.user.id]
      );
    }

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'Settings',
      entityId: 'bulk',
      description: `Settings u ndryshuan: ${entries.map(([k]) => k).join(', ')}`,
      ipAddress: req.ip,
    });

    // Return updated settings
    const [rows] = await pool.query('SELECT setting_key, setting_value, category, updated_at FROM settings ORDER BY category, setting_key');
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = {};
      grouped[row.category][row.setting_key] = row.setting_value;
    }
    res.json({ settings: grouped, message: 'Settings u ruajtën.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

// GET public company info (no auth needed — for footer, contact page, etc.)
router.get('/public', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE category = 'company' OR setting_key IN ('company_name','company_phone','company_email','company_address','company_website','social_facebook','social_instagram','social_tiktok')"
    );
    const data = {};
    for (const row of rows) {
      data[row.setting_key] = row.setting_value;
    }
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Gabim i brendshëm.' }); }
});

module.exports = router;
