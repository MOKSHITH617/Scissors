const crypto = require('crypto');
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'scissorlinessecretkey12345secret';
// Secret key must be exactly 32 bytes. We hash the user key to enforce this.
const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 2) return text; // Fallback if key is not encrypted
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original text on failure
  }
}

module.exports = { encrypt, decrypt };
