/**
 * Web Crypto PBKDF2 Password Hashing
 * Works natively in Cloudflare Workers and Node.js without binary dependencies.
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(':')) return false;

  const [saltHex, originalHashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex === originalHashHex;
}
