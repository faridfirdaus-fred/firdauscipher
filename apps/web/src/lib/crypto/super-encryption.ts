/**
 * super-encryption.ts — Super Enkripsi (g).
 *
 * Komposisi dua cipher. Urutan DIKUNCI (S12):
 *   enkripsi : Extended Vigenere  ->  Transposisi Kolom
 *   dekripsi : Kolom⁻¹            ->  Vigenere⁻¹
 *
 * Dua kunci terpisah (Q2): key1 = Extended Vigenere, key2 = Transposisi Kolom.
 */

import { decryptExtVigenere, encryptExtVigenere } from "./extended-vigenere";
import { decryptColumnar, encryptColumnar } from "./columnar";

/** Super enkripsi — enkripsi byte. */
export function superEncrypt(bytes: Uint8Array, key1: string, key2: string): Uint8Array {
  if (key1.length === 0) throw new Error("Kunci 1 (Extended Vigenere) kosong.");
  if (key2.length === 0) throw new Error("Kunci 2 (Transposisi Kolom) kosong.");
  const step1 = encryptExtVigenere(bytes, key1);
  return encryptColumnar(step1, key2);
}

/**
 * Super enkripsi — dekripsi byte.
 * `originalLength` = panjang plaintext asli; dipakai memangkas padding 0x00
 * dari transposisi kolom (S11).
 */
export function superDecrypt(
  bytes: Uint8Array,
  key1: string,
  key2: string,
  originalLength?: number,
): Uint8Array {
  if (key1.length === 0) throw new Error("Kunci 1 (Extended Vigenere) kosong.");
  if (key2.length === 0) throw new Error("Kunci 2 (Transposisi Kolom) kosong.");
  const step1 = decryptColumnar(bytes, key2);
  const step2 = decryptExtVigenere(step1, key1);
  if (originalLength === undefined) return step2;
  if (originalLength > step2.length) {
    throw new Error(
      `Panjang asli (${originalLength}) lebih besar dari hasil dekripsi (${step2.length}). ` +
        `Kunci atau file mungkin salah.`,
    );
  }
  return step2.slice(0, originalLength);
}
