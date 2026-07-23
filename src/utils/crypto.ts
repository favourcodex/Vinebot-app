/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

// Standard 256-bit encryption key.
// In production, this would be set via an environment variable.
// We fall back to a stable cryptographic hash for continuous development sandbox persistence.
const ENCRYPTION_SECRET = process.env.MT5_ENCRYPTION_SECRET || 'vinebot-enterprise-standard-secure-key-2026';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

interface EncryptedData {
  encryptedPassword: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt a plain-text password using AES-256-GCM
 */
export function encryptPassword(password: string): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encryptedPassword: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag
  };
}

/**
 * Decrypt an AES-256-GCM encrypted password
 */
export function decryptPassword(encryptedPassword: string, ivBase64: string, authTagBase64: string): string {
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
