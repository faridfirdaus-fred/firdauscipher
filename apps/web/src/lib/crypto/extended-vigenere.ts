/**
 * extended-vigenere.ts — Extended Vigenere Cipher (c), 256 karakter ASCII.
 *
 * Operasi pada BYTE (0-255), modulo 256. TIDAK ada sanitasi: byte 0x00, 0xFF,
 * dan header file asli ikut diproses (Sp8). Output byte mentah; base64 hanya
 * untuk tampilan (Sp4).
 */

import { utf8ToBytes } from "./core";

const MOD256 = 256;

/** Kunci sebagai byte. String key dikonversi UTF-8. */
function keyToBytes(key: string | Uint8Array): Uint8Array {
  const k = typeof key === "string" ? utf8ToBytes(key) : key;
  if (k.length === 0) throw new Error("Kunci Extended Vigenere kosong.");
  return k;
}

/** Extended Vigenere — enkripsi byte. */
export function encryptExtVigenere(bytes: Uint8Array, key: string | Uint8Array): Uint8Array {
  const k = keyToBytes(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = (bytes[i] + k[i % k.length]) % MOD256;
  return out;
}

/** Extended Vigenere — dekripsi byte. */
export function decryptExtVigenere(bytes: Uint8Array, key: string | Uint8Array): Uint8Array {
  const k = keyToBytes(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = (bytes[i] - k[i % k.length] + MOD256) % MOD256;
  return out;
}
