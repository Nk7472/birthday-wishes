// Validation shared by the browser (instant feedback) and the API (the real check).
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim().toLowerCase());

export const COUNTRIES = [
  ['+91', 'India'], ['+1', 'US / Canada'], ['+44', 'UK'], ['+971', 'UAE'], ['+966', 'Saudi Arabia'], ['+92', 'Pakistan'],
  ['+880', 'Bangladesh'], ['+94', 'Sri Lanka'], ['+977', 'Nepal'], ['+61', 'Australia'], ['+65', 'Singapore'], ['+49', 'Germany'],
];

/** Returns the cleaned number ("+91 9876543210") or '' when it is not a valid number for that country code. */
export function cleanPhone(dial, raw) {
  const digits = String(raw || '').replace(/[\s\-().]/g, '');
  if (!/^\d+$/.test(digits)) return '';
  if (dial === '+91' ? !/^[6-9]\d{9}$/.test(digits) : digits.length < 6 || digits.length > 14) return '';
  return `${dial} ${digits}`;
}

/** The "temporary id" every visitor gets on first load (also used for draft ids). */
export const isId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(v);

/** The per-person id the server hands out ("user12_k3f9a2"): every document of that person carries it as `uid`. */
export const isUid = (v) => typeof v === 'string' && /^user[1-9]\d{0,9}_[a-z0-9]{6}$/.test(v);
