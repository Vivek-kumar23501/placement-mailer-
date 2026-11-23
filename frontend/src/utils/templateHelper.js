/**
 * Replaces placeholders {{company}} and {{hr}} in text.
 * Matches case-insensitively with flexible whitespace:
 * - {{company}}, {{Company}}, {{ COMPANY }}
 * - {{hr}}, {{HR}}, {{hrname}}, {{hr name}}, {{ HRName }}
 *
 * @param {string} text - Raw template string
 * @param {object} contact - Contact details { company, hrName }
 * @returns {string} - Personalized text
 */
export function personalizeTemplate(text, contact = {}) {
  if (!text || typeof text !== 'string') return '';

  const company = (contact.company || '').trim() || 'Company';
  const hr = (contact.hrName || '').trim() || 'Hiring Manager';

  return text
    // Replace {{company}}
    .replace(/\{\{\s*company\s*\}\}/gi, company)
    // Replace {{hr}} or {{hrname}} or {{hr_name}} or {{hr name}}
    .replace(/\{\{\s*(hr|hrname|hr_name|hr\s+name)\s*\}\}/gi, hr);
}

/**
 * Validates whether an email string looks like a standard email.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Formats byte size to human readable string (e.g. 1.2 MB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
