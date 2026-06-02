// Minimal i18n helper for API error messages.
// Frontend may send the user's UI locale either via:
//   - Custom header `X-Locale: en` or `X-Locale: sq`
//   - Standard `Accept-Language` header (parsed loosely)
//   - Query string `?lang=en`
// Defaults to `sq` (the primary site language) when nothing matches.

const SUPPORTED = ['sq', 'en'];

function detectLocale(req) {
  // 1. Explicit override
  const xLocale = String(req.headers['x-locale'] || '').toLowerCase().trim();
  if (SUPPORTED.includes(xLocale)) return xLocale;

  // 2. Query string
  const qLang = String(req.query?.lang || '').toLowerCase().trim();
  if (SUPPORTED.includes(qLang)) return qLang;

  // 3. Accept-Language (take the first 2 letters of the highest-priority entry).
  const accept = String(req.headers['accept-language'] || '').toLowerCase();
  if (accept) {
    const first = accept.split(',')[0]?.split(';')[0]?.trim().slice(0, 2);
    if (SUPPORTED.includes(first)) return first;
  }

  return 'sq';
}

// Pre-defined message dictionary. Add new keys here.
const messages = {
  contact: {
    rateLimited: {
      sq: 'Shumë kërkesa. Provoni pas 1 ore.',
      en: 'Too many requests. Try again in an hour.',
    },
    missingFields: {
      sq: 'Fusha të detyrueshme mungojnë.',
      en: 'Required fields missing.',
    },
    invalidEmail: {
      sq: 'Email i pavlefshëm.',
      en: 'Invalid email address.',
    },
    messageLength: {
      sq: 'Mesazhi duhet të jetë 10–2000 karaktere.',
      en: 'Message must be 10–2000 characters.',
    },
    sendFailed: {
      sq: 'Dërgimi dështoi. Provoni sërish.',
      en: 'Send failed. Please try again.',
    },
  },
};

function t(req, path) {
  const locale = detectLocale(req);
  const parts = path.split('.');
  let node = messages;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return path; // missing key — return path so dev sees what's broken
  }
  if (node && typeof node === 'object' && locale in node) return node[locale];
  if (node && typeof node === 'object' && 'sq' in node) return node.sq;
  return path;
}

module.exports = { detectLocale, t };
