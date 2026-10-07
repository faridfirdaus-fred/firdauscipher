/**
 * envelope.ts — bungkus (envelope) file ciphertext `.dat`.
 *
 * Format DIKUNCI (lihat docs/format-file.md):
 *
 *   [0..3]   magic  : "KRI1"          (4 byte ASCII)
 *   [4]      version: 0x01
 *   [5]      cipher : 1 byte enum (1..8)
 *   [6..9]   hdrLen : uint32 little-endian
 *   [10..]   header : JSON UTF-8 { name, ext, mime, size, mode, params }
 *   [..]     payload: byte ciphertext
 *
 * Envelope ini lapisan LUAR yang ditambah SETELAH enkripsi, jadi semua byte
 * plaintext (termasuk header file aslinya) tetap ikut terenkripsi (Sp8).
 */

import { bytesToUtf8, utf8ToBytes } from "./core";

export const MAGIC = "KRI1";
export const VERSION = 1;

/** Enum cipher — dipakai di byte ke-5 envelope. */
export const CipherId = {
  VIGENERE: 1,
  AUTOKEY: 2,
  EXT_VIGENERE: 3,
  PLAYFAIR: 4,
  AFFINE: 5,
  HILL: 6,
  SUPER: 7,
  ENIGMA: 8,
} as const;

export type CipherIdValue = (typeof CipherId)[keyof typeof CipherId];

export const CIPHER_ID_NAMES: Record<number, string> = {
  1: "vigenere",
  2: "autokey",
  3: "ext-vigenere",
  4: "playfair",
  5: "affine",
  6: "hill",
  7: "super",
  8: "enigma",
};

/** Mode payload: byte mentah, atau teks base64 (cipher 26 huruf). */
export type PayloadMode = "binary" | "base64-text";

/** Metadata yang disimpan di header envelope. */
export interface EnvelopeHeader {
  /** Nama file plaintext asli, mis. "gambar.jpg". */
  name: string;
  /** Ekstensi tanpa titik, mis. "jpg" (untuk auto-restore, Sp9). */
  ext: string;
  /** MIME type, mis. "image/jpeg". */
  mime: string;
  /** Ukuran byte plaintext asli (sebelum enkripsi). */
  size: number;
  /** Cara payload dibaca saat dekripsi. */
  mode: PayloadMode;
  /** Parameter tambahan per cipher (mis. {a,b} Affine, {matrix} Hill, {config} Enigma). */
  params?: Record<string, unknown>;
  /** Ada kalau plaintext bukan file tapi hasil ketik. */
  fromText?: boolean;
}

export interface Envelope {
  cipher: number;
  header: EnvelopeHeader;
  payload: Uint8Array;
}

const HEADER_OFFSET = 10;

/** Tulis uint32 little-endian. */
function writeUint32LE(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

/** Susun envelope jadi byte siap-unduh. */
export function packEnvelope(cipher: number, header: EnvelopeHeader, payload: Uint8Array): Uint8Array {
  if (MAGIC.length !== 4) throw new Error("MAGIC harus 4 byte");
  const headerBytes = utf8ToBytes(JSON.stringify(header));
  const total = HEADER_OFFSET + headerBytes.length + payload.length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  for (let i = 0; i < 4; i++) out[i] = MAGIC.charCodeAt(i);
  out[4] = VERSION;
  out[5] = cipher & 255;
  writeUint32LE(view, 6, headerBytes.length);
  out.set(headerBytes, HEADER_OFFSET);
  out.set(payload, HEADER_OFFSET + headerBytes.length);
  return out;
}

/** Baca envelope dari byte. Melempar error yang jelas kalau file bukan format KRI1. */
export function unpackEnvelope(bytes: Uint8Array): Envelope {
  if (bytes.length < HEADER_OFFSET) {
    throw new Error("File terlalu pendek untuk format KRI1 (.dat)");
  }
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== MAGIC) {
    throw new Error(`Bukan file .dat FirdausCipher: magic = "${magic}", harusnya "${MAGIC}"`);
  }
  const version = bytes[4];
  if (version !== VERSION) {
    throw new Error(`Versi envelope tidak didukung: ${version} (didukung: ${VERSION})`);
  }
  const cipher = bytes[5];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const hdrLen = view.getUint32(6, true);
  const headerEnd = HEADER_OFFSET + hdrLen;
  if (headerEnd > bytes.length) {
    throw new Error("Header envelope rusak (hdrLen melebihi ukuran file)");
  }
  const headerJson = bytesToUtf8(bytes.subarray(HEADER_OFFSET, headerEnd));
  let header: EnvelopeHeader;
  try {
    header = JSON.parse(headerJson) as EnvelopeHeader;
  } catch {
    throw new Error("Header envelope bukan JSON valid");
  }
  return { cipher, header, payload: bytes.subarray(headerEnd) };
}

/** Nama file `.dat` default: <nama-asli>.dat (mis. "gambar.jpg" -> "gambar.jpg.dat"). */
export function datFileName(originalName: string): string {
  return `${originalName}.dat`;
}

/** Ambil nama + ekstensi dari nama file. */
export function splitFileName(fileName: string): { name: string; ext: string } {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return { name: fileName, ext: "" };
  return { name: fileName.slice(0, dot), ext: fileName.slice(dot + 1) };
}
