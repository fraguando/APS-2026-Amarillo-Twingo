// Almacenamiento seguro de contraseñas (US9).
//
// Algoritmo: scrypt (RFC 7914), una función de derivación de claves diseñada
// específicamente para guardar contraseñas: es lenta y usa mucha memoria a
// propósito, lo que encarece los ataques por fuerza bruta.
//  - Cada contraseña lleva una sal aleatoria de 16 bytes: dos usuarios con la
//    misma contraseña quedan con valores almacenados distintos.
//  - Se guarda solo el resultado de la derivación (64 bytes); no existe una
//    operación inversa que permita reconstruir la contraseña original.
//  - Formato almacenado: scrypt$N$r$p$sal(base64)$clave(base64)
// Ver docs/arquitectura.md, decisión D2.
import { randomBytes, scrypt as scryptConCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptConCallback);
export const ALGORITMO = 'scrypt';
export const LONGITUD_MAXIMA = 128;

function normalizar(password) {
  return String(password).normalize('NFKC');
}

function memoriaMaxima(N, r) {
  return 256 * N * r; // scrypt necesita 128 * N * r bytes; dejamos margen.
}

export async function hashearPassword(password, { N, r, p, longitudClave }) {
  const sal = randomBytes(16);
  const clave = await scrypt(normalizar(password), sal, longitudClave, { N, r, p, maxmem: memoriaMaxima(N, r) });
  return [ALGORITMO, N, r, p, sal.toString('base64'), clave.toString('base64')].join('$');
}

export async function verificarPassword(password, almacenado) {
  if (typeof almacenado !== 'string') return false;
  const partes = almacenado.split('$');
  if (partes.length !== 6 || partes[0] !== ALGORITMO) return false;
  const [, N, r, p, salB64, claveB64] = partes;
  const esperado = Buffer.from(claveB64, 'base64');
  const calculado = await scrypt(normalizar(password), Buffer.from(salB64, 'base64'), esperado.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: memoriaMaxima(Number(N), Number(r)),
  });
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}

// Política de contraseñas (longitud mínima configurable + complejidad).
export function reglasPassword(password, minLongitud) {
  const pw = typeof password === 'string' ? password : '';
  return [
    { codigo: 'longitud', descripcion: `Al menos ${minLongitud} caracteres`, cumple: pw.length >= minLongitud },
    { codigo: 'mayuscula', descripcion: 'Una letra mayúscula', cumple: /\p{Lu}/u.test(pw) },
    { codigo: 'minuscula', descripcion: 'Una letra minúscula', cumple: /\p{Ll}/u.test(pw) },
    { codigo: 'numero', descripcion: 'Un número', cumple: /\p{Nd}/u.test(pw) },
    { codigo: 'simbolo', descripcion: 'Un símbolo (# $ % & !)', cumple: /[^\p{L}\p{Nd}\s]/u.test(pw) },
  ];
}

export function incumplimientosPassword(password, { minLongitud }) {
  const fallas = reglasPassword(password, minLongitud)
    .filter((regla) => !regla.cumple)
    .map((regla) => regla.descripcion.toLowerCase());
  if (typeof password === 'string' && password.length > LONGITUD_MAXIMA) {
    fallas.push(`como máximo ${LONGITUD_MAXIMA} caracteres`);
  }
  return fallas;
}

export function mensajePolitica(fallas) {
  return `La contraseña no cumple la política. Le falta: ${fallas.join('; ')}.`;
}
