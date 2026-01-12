import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './env.js';

export function hashToken(token: string): string {
  return createHmac('sha256', config.serverSecret).update(token).digest('hex');
}

export function compareTokens(provided: string, stored: string): boolean {
  try {
    const providedHash = hashToken(provided);
    const storedBuffer = Buffer.from(stored, 'hex');
    const providedBuffer = Buffer.from(providedHash, 'hex');
    if (storedBuffer.length !== providedBuffer.length) {
      return false;
    }
    return timingSafeEqual(storedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
