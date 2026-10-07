/**
 * affine.ts — Affine Cipher (e).
 *
 *   E(x) = (a·x + b) mod 26
 *   D(y) = a⁻¹·(y - b) mod 26
 *
 * `a` wajib koprima dengan 26 (gcd(a,26) = 1) supaya punya invers.
 */

import { charToNum, gcd, mod, modInverse, numToChar, sanitize26 } from "./core";

/** 12 nilai `a` yang valid untuk modulus 26. */
export const VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25] as const;

/** Cek apakah `a` valid (koprima dengan 26). */
export function isValidA(a: number): boolean {
  return Number.isInteger(a) && gcd(a, 26) === 1;
}

/** Validasi kunci; pesan error menyebut nilai gcd-nya (S17). */
export function validateAffineKey(a: number, b: number): void {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new Error("Kunci Affine harus bilangan bulat (a dan b).");
  }
  if (!isValidA(a)) {
    throw new Error(
      `a = ${a} tidak valid karena gcd(${a}, 26) = ${gcd(a, 26)} ≠ 1. ` +
        `Nilai a yang valid: ${VALID_A.join(", ")}.`,
    );
  }
  if (b < 0 || b > 25) {
    throw new Error(`b = ${b} harus di antara 0 dan 25.`);
  }
}

/** Affine — enkripsi. */
export function encryptAffine(plaintext: string, a: number, b: number): string {
  validateAffineKey(a, b);
  const p = sanitize26(plaintext);
  let out = "";
  for (const ch of p) out += numToChar(a * charToNum(ch) + b);
  return out.toLowerCase();
}

/** Affine — dekripsi. */
export function decryptAffine(ciphertext: string, a: number, b: number): string {
  validateAffineKey(a, b);
  const c = sanitize26(ciphertext);
  const aInv = modInverse(a, 26);
  let out = "";
  for (const ch of c) out += numToChar(aInv * mod(charToNum(ch) - b, 26));
  return out.toLowerCase();
}
