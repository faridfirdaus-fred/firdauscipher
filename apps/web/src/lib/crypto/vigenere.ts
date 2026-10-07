/**
 * vigenere.ts — Vigenere standard (a) + Auto-Key Vigenere (b).
 *
 * Standard : C_i = (P_i + K_i) mod 26, kunci diulang.
 * Auto-Key : keystream = kunci + plaintext itu sendiri (untuk enkripsi).
 *
 * Semua fungsi: input teks apa pun -> disanitasi dulu (Sp2, hanya A-Z),
 * output ciphertext huruf KECIL tanpa spasi (Sp5, D19).
 */

import { charToNum, numToChar, sanitize26 } from "./core";

/** Siapkan kunci: sanitasi, wajib tidak kosong. */
function prepareKey(key: string): string {
  const k = sanitize26(key);
  if (k.length === 0) {
    throw new Error("Kunci kosong atau tidak punya huruf A-Z. Isi kunci minimal 1 huruf.");
  }
  return k;
}

/** Vigenere standard — enkripsi. */
export function encryptVigenere(plaintext: string, key: string): string {
  const p = sanitize26(plaintext);
  const k = prepareKey(key);
  let out = "";
  for (let i = 0; i < p.length; i++) {
    out += numToChar(charToNum(p[i]) + charToNum(k[i % k.length]));
  }
  return out.toLowerCase();
}

/** Vigenere standard — dekripsi. */
export function decryptVigenere(ciphertext: string, key: string): string {
  const c = sanitize26(ciphertext);
  const k = prepareKey(key);
  let out = "";
  for (let i = 0; i < c.length; i++) {
    out += numToChar(charToNum(c[i]) - charToNum(k[i % k.length]));
  }
  return out.toLowerCase();
}

/** Auto-Key Vigenere — enkripsi. Keystream = kunci diikuti plaintext. */
export function encryptAutoKey(plaintext: string, key: string): string {
  const p = sanitize26(plaintext);
  const k = prepareKey(key);
  const stream = k + p; // kunci, lalu lanjut plaintext
  let out = "";
  for (let i = 0; i < p.length; i++) {
    out += numToChar(charToNum(p[i]) + charToNum(stream[i]));
  }
  return out.toLowerCase();
}

/**
 * Auto-Key Vigenere — dekripsi.
 *
 * WAJIB sekuensial: huruf plaintext ke-i yang baru didapat menjadi bagian
 * keystream untuk huruf ke-(i+1). Ini sumber bug klasik (lihat §10 no.1).
 */
export function decryptAutoKey(ciphertext: string, key: string): string {
  const c = sanitize26(ciphertext);
  const k = prepareKey(key);
  const plain: string[] = [];
  for (let i = 0; i < c.length; i++) {
    const keyChar = i < k.length ? k[i] : plain[i - k.length];
    const p = numToChar(charToNum(c[i]) - charToNum(keyChar));
    plain.push(p);
  }
  return plain.join("").toLowerCase();
}
