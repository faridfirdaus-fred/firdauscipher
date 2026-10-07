/**
 * index.ts — registry terpadu semua cipher.
 *
 * GUI memakai registry ini supaya panel tiap cipher bisa di-render otomatis
 * dari metadata (`keyFields`) dan dijalankan lewat satu fungsi `runCipher`.
 *
 * Semua cipher menerima & mengembalikan BYTE (`Uint8Array`):
 *   - cipher 26 huruf : byte masuk diperlakukan sebagai teks, disanitasi (Sp2),
 *                       hasilnya huruf kecil ASCII (Sp5).
 *   - cipher biner    : byte diproses apa adanya, termasuk 0x00 dan header (Sp8).
 */

import { bytesToUtf8, utf8ToBytes } from "./core";
import { CipherId, type PayloadMode } from "./envelope";
import { decryptAutoKey, decryptVigenere, encryptAutoKey, encryptVigenere } from "./vigenere";
import { decryptPlayfair, encryptPlayfair } from "./playfair";
import { decryptAffine, encryptAffine, VALID_A } from "./affine";
import { decryptHill, encryptHill, parseMatrix } from "./hill";
import { decryptExtVigenere, encryptExtVigenere } from "./extended-vigenere";
import { decryptColumnar, encryptColumnar } from "./columnar";
import { superDecrypt, superEncrypt } from "./super-encryption";
import { DEFAULT_ENIGMA, decryptEnigma, encryptEnigma, ROTOR_WIRING, REFLECTOR_WIRING } from "./enigma";

export * from "./core";
export * from "./envelope";
export * from "./vigenere";
export * from "./playfair";
export * from "./affine";
export * from "./hill";
export * from "./extended-vigenere";
export * from "./columnar";
export * from "./super-encryption";
export * from "./enigma";

export type Direction = "encrypt" | "decrypt";

/** Deskripsi satu field kunci untuk auto-render form di GUI. */
export interface KeyField {
  name: string;
  label: string;
  type: "text" | "number" | "matrix" | "select";
  placeholder?: string;
  help?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

/** Metadata satu cipher. */
export interface CipherDef {
  id: number;
  slug: string;
  /** Huruf pada soal: a, b, c, d, e, f, g, h. */
  letter: string;
  name: string;
  /** Cara payload diperlakukan pada file .dat. */
  mode: PayloadMode;
  /** True kalau cipher 26 huruf (non-alfabet dibuang). */
  isAlpha: boolean;
  description: string;
  keyFields: KeyField[];
}

/** Nilai parameter yang dikirim GUI (semua string). */
export type CipherParams = Record<string, string>;

function need(params: CipherParams, name: string): string {
  const v = params[name];
  if (v === undefined || v.trim() === "") {
    throw new Error(`Kunci "${name}" wajib diisi.`);
  }
  return v;
}

/** Jalankan cipher berdasarkan slug. */
export function runCipher(
  slug: string,
  direction: Direction,
  input: Uint8Array,
  params: CipherParams,
): Uint8Array {
  const enc = direction === "encrypt";
  switch (slug) {
    case "vigenere": {
      const text = bytesToUtf8(input);
      const key = need(params, "key");
      return utf8ToBytes(enc ? encryptVigenere(text, key) : decryptVigenere(text, key));
    }
    case "autokey": {
      const text = bytesToUtf8(input);
      const key = need(params, "key");
      return utf8ToBytes(enc ? encryptAutoKey(text, key) : decryptAutoKey(text, key));
    }
    case "ext-vigenere": {
      const key = need(params, "key");
      return enc ? encryptExtVigenere(input, key) : decryptExtVigenere(input, key);
    }
    case "playfair": {
      const text = bytesToUtf8(input);
      const key = need(params, "key");
      return utf8ToBytes(enc ? encryptPlayfair(text, key) : decryptPlayfair(text, key));
    }
    case "affine": {
      const text = bytesToUtf8(input);
      const a = Number(params.a);
      const b = Number(params.b);
      if (params.a === undefined || params.a === "") throw new Error('Kunci "a" wajib diisi.');
      if (params.b === undefined || params.b === "") throw new Error('Kunci "b" wajib diisi.');
      return utf8ToBytes(enc ? encryptAffine(text, a, b) : decryptAffine(text, a, b));
    }
    case "hill": {
      const text = bytesToUtf8(input);
      const matrix = parseMatrix(need(params, "matrix"));
      return utf8ToBytes(enc ? encryptHill(text, matrix) : decryptHill(text, matrix));
    }
    case "columnar": {
      const key = need(params, "key");
      return enc ? encryptColumnar(input, key) : decryptColumnar(input, key);
    }
    case "super": {
      const key1 = need(params, "key1");
      const key2 = need(params, "key2");
      return enc ? superEncrypt(input, key1, key2) : superDecrypt(input, key1, key2);
    }
    case "enigma": {
      const text = bytesToUtf8(input);
      const config = {
        rotors: (params.rotors || "I,II,III").split(/[\s,]+/) as [string, string, string],
        reflector: params.reflector || "B",
        ring: params.ring || "AAA",
        position: params.position || "AAA",
        plugboard: params.plugboard || "",
      };
      return utf8ToBytes(enc ? encryptEnigma(text, config) : decryptEnigma(text, config));
    }
    default:
      throw new Error(`Cipher "${slug}" tidak dikenal.`);
  }
}

/** Registry lengkap — urut sesuai soal a–h. */
export const CIPHERS: CipherDef[] = [
  {
    id: CipherId.VIGENERE,
    slug: "vigenere",
    letter: "a",
    name: "Vigenere Standard",
    mode: "base64-text",
    isAlpha: true,
    description: "C = (P + K) mod 26, kunci diulang. Hanya huruf A-Z yang diproses.",
    keyFields: [{ name: "key", label: "Kunci", type: "text", placeholder: "LEMON", help: "Huruf bebas, panjang bebas." }],
  },
  {
    id: CipherId.AUTOKEY,
    slug: "autokey",
    letter: "b",
    name: "Auto-Key Vigenere",
    mode: "base64-text",
    isAlpha: true,
    description: "Keystream = kunci diikuti plaintext itu sendiri.",
    keyFields: [{ name: "key", label: "Kunci", type: "text", placeholder: "QUEENLY" }],
  },
  {
    id: CipherId.EXT_VIGENERE,
    slug: "ext-vigenere",
    letter: "c",
    name: "Extended Vigenere (256 ASCII)",
    mode: "binary",
    isAlpha: false,
    description: "Modulo 256, semua byte termasuk 0x00 dan header file ikut diproses.",
    keyFields: [{ name: "key", label: "Kunci", type: "text", placeholder: "kunci rahasia" }],
  },
  {
    id: CipherId.PLAYFAIR,
    slug: "playfair",
    letter: "d",
    name: "Playfair",
    mode: "base64-text",
    isAlpha: true,
    description: "Matriks 5x5, I/J digabung, digraph, filler X.",
    keyFields: [{ name: "key", label: "Kunci", type: "text", placeholder: "MONARCHY" }],
  },
  {
    id: CipherId.AFFINE,
    slug: "affine",
    letter: "e",
    name: "Affine",
    mode: "base64-text",
    isAlpha: true,
    description: "E(x) = (a·x + b) mod 26. `a` wajib koprima dengan 26.",
    keyFields: [
      {
        name: "a",
        label: "a (koprima 26)",
        type: "select",
        defaultValue: "5",
        options: VALID_A.map((v) => ({ value: String(v), label: String(v) })),
      },
      { name: "b", label: "b (0-25)", type: "number", defaultValue: "8" },
    ],
  },
  {
    id: CipherId.HILL,
    slug: "hill",
    letter: "f",
    name: "Hill",
    mode: "base64-text",
    isAlpha: true,
    description: "Matriks kunci 2x2 atau 3x3, determinan wajib koprima 26. Padding X.",
    keyFields: [
      {
        name: "matrix",
        label: "Matriks kunci",
        type: "matrix",
        defaultValue: "6,24,1;13,16,10;20,17,15",
        placeholder: "6,24,1;13,16,10;20,17,15",
        help: "Pisahkan elemen dengan koma, baris dengan titik-koma (2x2 atau 3x3).",
      },
    ],
  },
  {
    id: CipherId.EXT_VIGENERE,
    slug: "columnar",
    letter: "g",
    name: "Transposisi Kolom",
    mode: "binary",
    isAlpha: false,
    description: "Transposisi kolom pada byte. Dipakai juga sebagai tahap 2 Super Enkripsi.",
    keyFields: [{ name: "key", label: "Kunci", type: "text", placeholder: "ZEBRAS" }],
  },
  {
    id: CipherId.SUPER,
    slug: "super",
    letter: "g",
    name: "Super Enkripsi",
    mode: "binary",
    isAlpha: false,
    description: "Extended Vigenere lalu Transposisi Kolom (dua kunci terpisah).",
    keyFields: [
      { name: "key1", label: "Kunci 1 (Extended Vigenere)", type: "text", placeholder: "kunci-vigenere" },
      { name: "key2", label: "Kunci 2 (Transposisi Kolom)", type: "text", placeholder: "ZEBRAS" },
    ],
  },
  {
    id: CipherId.ENIGMA,
    slug: "enigma",
    letter: "h",
    name: "Enigma (Bonus)",
    mode: "base64-text",
    isAlpha: true,
    description: "Enigma I: 3 rotor, reflector B, ring setting, posisi awal, plugboard opsional.",
    keyFields: [
      {
        name: "rotors",
        label: "Rotor (kiri-tengah-kanan)",
        type: "text",
        defaultValue: "I,II,III",
        help: `Tersedia: ${Object.keys(ROTOR_WIRING).join(", ")}`,
      },
      {
        name: "reflector",
        label: "Reflector",
        type: "select",
        defaultValue: "B",
        options: Object.keys(REFLECTOR_WIRING).map((v) => ({ value: v, label: v })),
      },
      { name: "ring", label: "Ring setting", type: "text", defaultValue: "AAA" },
      { name: "position", label: "Posisi awal", type: "text", defaultValue: "AAA" },
      { name: "plugboard", label: "Plugboard", type: "text", defaultValue: "", placeholder: "AB CD EF", help: "Opsional. Pasangan huruf, mis. AB CD." },
    ],
  },
];

/** Cari definisi cipher dari slug. */
export function getCipher(slug: string): CipherDef {
  const found = CIPHERS.find((c) => c.slug === slug);
  if (!found) throw new Error(`Cipher "${slug}" tidak dikenal.`);
  return found;
}
