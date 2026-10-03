import { createHash, randomBytes } from 'node:crypto';

// 256 bits aleatorios, aptos para usar en una URL o en un encabezado HTTP.
export function generarToken() {
  return randomBytes(32).toString('base64url');
}

// En la base se guarda solo el hash del token: si alguien lee la base, no puede usarlo.
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}
