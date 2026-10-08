/**
 * cipher-runner.ts — orkestrasi alur teks & file untuk GUI.
 *
 * Semua logika "bagaimana sebuah operasi dijalankan" ada di sini supaya
 * komponen React tetap tipis dan mudah diuji.
 */

import {
  bytesToHex,
  bytesToUtf8,
  fromBase64,
  toBase64,
  utf8ToBytes,
  CIPHER_ID_NAMES,
  datFileName,
  packEnvelope,
  runCipher,
  unpackEnvelope,
  type CipherParams,
  type Direction,
  type EnvelopeHeader,
} from "./crypto";

export interface TextResult {
  /** Byte hasil (ciphertext atau plaintext). */
  bytes: Uint8Array;
  /** Tampilan utama: teks huruf untuk cipher 26 huruf, base64 untuk cipher biner. */
  display: string;
  /** Selalu tersedia (Sp4: base64 untuk tampilan). */
  base64: string;
  /** Hex 64 byte pertama (bukti byte-level). */
  hexPreview: string;
  /** True kalau hasilnya byte biner (bukan teks yang bisa dibaca). */
  isBinary: boolean;
  /** Peringatan non-fatal, mis. non-alfabet dibuang. */
  warnings: string[];
}

export interface FileEncryptResult {
  dat: Uint8Array;
  fileName: string;
  header: EnvelopeHeader;
  payloadBytes: number;
  warnings: string[];
}

export interface FileDecryptResult {
  restored: Uint8Array;
  /** Nama file asli dari header (Sp9). */
  fileName: string;
  header: EnvelopeHeader;
  cipherName: string;
  warnings: string[];
}

/** Hitung berapa karakter non-alfabet yang akan dibuang oleh cipher 26 huruf. */
function countNonAlpha(text: string): number {
  let n = 0;
  for (const ch of text) {
    const up = ch.toUpperCase();
    if (!(up.length === 1 && up >= "A" && up <= "Z")) n++;
  }
  return n;
}

/**
 * Jalankan cipher pada TEKS (S17).
 * Peringatan dikumpulkan, bukan dilempar, supaya bisa ditampilkan di UI.
 */
export function runText(
  slug: string,
  direction: Direction,
  text: string,
  params: CipherParams,
  isAlpha: boolean,
): TextResult {
  const warnings: string[] = [];
  const input = utf8ToBytes(text);

  if (isAlpha) {
    const dropped = countNonAlpha(text);
    if (dropped > 0) {
      warnings.push(
        `${dropped} karakter non-alfabet (spasi, angka, tanda baca) dibuang, ` +
          `cipher 26 huruf hanya memproses A-Z (Sp2).`,
      );
    }
    if (text.trim().length === 0) {
      throw new Error("Masukkan teks terlebih dahulu.");
    }
  } else if (text.length === 0) {
    throw new Error("Masukkan teks terlebih dahulu.");
  }

  const out = runCipher(slug, direction, input, params);
  const isBinary = !isAlpha;

  return {
    bytes: out,
    display: isAlpha ? bytesToUtf8(out) : toBase64(out),
    base64: toBase64(out),
    hexPreview: bytesToHex(out.subarray(0, Math.min(out.length, 64)))
      .replace(/(..)(?=.)/g, "$1 ")
      .trim(),
    isBinary,
    warnings,
  };
}

/**
 * Enkripsi FILE -> byte `.dat` (S14).
 * Cipher 26 huruf pada file biner diizinkan TAPI diberi peringatan keras
 * (§10 no.6) karena file tidak akan bisa direstorasi.
 */
export function runFileEncrypt(
  slug: string,
  cipherId: number,
  params: CipherParams,
  bytes: Uint8Array,
  fileName: string,
  mime: string,
  isAlpha: boolean,
  isTextFile: boolean,
): FileEncryptResult {
  const warnings: string[] = [];

  if (isAlpha && !isTextFile) {
    warnings.push(
      `PERINGATAN: "${slug}" hanya memproses huruf A-Z. File biner ini akan ` +
        `KEHILANGAN semua byte non-alfabet (termasuk header file) dan ` +
        `TIDAK BISA direstorasi. Untuk file, gunakan Extended Vigenere (c) ` +
        `atau Super Enkripsi (g).`,
    );
  }
  if (bytes.length === 0) throw new Error("File kosong (0 byte).");

  const encrypted = runCipher(slug, "encrypt", bytes, params);
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1) : "";

  const header: EnvelopeHeader = {
    name: fileName,
    ext,
    mime: mime || "application/octet-stream",
    size: bytes.length,
    mode: isAlpha ? "base64-text" : "binary",
    params,
  };
  const dat = packEnvelope(cipherId, header, encrypted);

  if (isAlpha) {
    warnings.push(
      "Payload disimpan sebagai mode `base64-text` (cipher 26 huruf). " +
        "Hasil dekripsi hanya berupa huruf, bukan file asli.",
    );
  }

  return { dat, fileName: datFileName(fileName), header, payloadBytes: encrypted.length, warnings };
}

/**
 * Dekripsi byte `.dat` -> file asli (S14).
 * Nama & ekstensi diambil dari header (Sp9); padding dipangkas pakai `size` (S11).
 */
export function runFileDecrypt(datBytes: Uint8Array): FileDecryptResult {
  const warnings: string[] = [];
  const env = unpackEnvelope(datBytes);
  const slug = CIPHER_ID_NAMES[env.cipher];
  if (!slug) {
    throw new Error(`Cipher dengan id ${env.cipher} tidak dikenal di file ini.`);
  }

  const params = (env.header.params ?? {}) as CipherParams;
  if (Object.keys(params).length === 0) {
    warnings.push(
      "File .dat ini tidak menyimpan parameter kunci. Kunci default akan dipakai. " +
        "kalau hasilnya tidak terbaca, kunci yang benar tidak bisa dipulihkan dari file.",
    );
  }

  const decrypted = runCipher(slug, "decrypt", env.payload, params);
  const size = env.header.size;

  let restored: Uint8Array;
  if (size === undefined || size === null || size <= 0) {
    restored = decrypted;
  } else if (size > decrypted.length) {
    warnings.push(
      `Ukuran asli di header (${size}) lebih besar dari hasil dekripsi ` +
        `(${decrypted.length}). File mungkin rusak atau kuncinya salah.`,
    );
    restored = decrypted;
  } else {
    restored = decrypted.slice(0, size);
  }

  return {
    restored,
    fileName: env.header.name || `hasil-${slug}`,
    header: env.header,
    cipherName: slug,
    warnings,
  };
}

/**
 * Bungkus hasil ciphertext TEKS menjadi file `.dat` (Sp6 + Sp9 + S16).
 *
 * Ini yang membuat alur "teks -> .dat -> dekripsi" bisa ditutup: file .dat
 * hasil tombol "Simpan .dat" bisa dibuka lagi lewat tab Dekripsi File dan
 * langsung memakai kunci yang tersimpan di header (params).
 */
export function buildTextDat(
  slug: string,
  cipherId: number,
  params: CipherParams,
  plaintextBytes: Uint8Array,
  cipherBytes: Uint8Array,
  isAlpha: boolean,
  fileName = "pesan.txt",
): { dat: Uint8Array; fileName: string } {
  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot + 1) : "";
  const header: EnvelopeHeader = {
    name: fileName,
    ext,
    mime: "text/plain;charset=utf-8",
    size: plaintextBytes.length,
    mode: isAlpha ? "base64-text" : "binary",
    params,
  };
  return { dat: packEnvelope(cipherId, header, cipherBytes), fileName: datFileName(fileName) };
}

/** Ringkas info header envelope untuk ditampilkan di UI. */
export function describeEnvelope(datBytes: Uint8Array): string[] {
  try {
    const env = unpackEnvelope(datBytes);
    const h = env.header;
    return [
      `Cipher        : ${CIPHER_ID_NAMES[env.cipher] ?? `id ${env.cipher}`}`,
      `Nama asli     : ${h.name}`,
      `Ekstensi      : ${h.ext || "(tidak ada)"}`,
      `MIME          : ${h.mime}`,
      `Ukuran asli   : ${h.size} byte`,
      `Mode payload  : ${h.mode}`,
      `Ukuran payload: ${env.payload.length} byte`,
      `Parameter     : ${JSON.stringify(h.params ?? {})}`,
    ];
  } catch (err) {
    return [`Gagal membaca header: ${(err as Error).message}`];
  }
}

/** Base64 -> byte untuk input manual (mode "tempel base64"). */
export function base64ToBytes(str: string): Uint8Array {
  return fromBase64(str);
}
