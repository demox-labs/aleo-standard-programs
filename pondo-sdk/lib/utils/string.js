import crypto from 'crypto';

export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}