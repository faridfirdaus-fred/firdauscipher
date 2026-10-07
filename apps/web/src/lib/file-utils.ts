/**
 * file-utils.ts — baca file biner, deteksi tipe, hexdump, unduh.
 *
 * ATURAN PENTING (§10 no.5): selalu `file.arrayBuffer()`, JANGAN `file.text()`
 * — `text()` merusak byte non-UTF-8.
 */

import { bytesToHex } from "./crypto/core";
import { datFileName } from "./crypto/envelope";

/** Batas ukuran file yang diproses di UI utama (S13). */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export interface FileInfo {
  name: string;
  size: number;
  mime: string;
  ext: string;
  /** True kalau isinya terlihat seperti teks (bukan biner). */
  isText: boolean;
  /** 64 byte pertama sebagai hex (bukti header ikut terbaca). */
  hexPreview: string;
  bytes: Uint8Array;
}

/** Baca file jadi byte. Melempar error kalau terlalu besar. */
export async function readFileBytes(file: File): Promise<Uint8Array> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file ${formatBytes(file.size)} melebihi batas ${formatBytes(MAX_FILE_SIZE)}.`,
    );
  }
  // `Blob.arrayBuffer()` belum ada di semua lingkungan (mis. jsdom).
  // FileReader adalah fallback yang bekerja di mana-mana.
  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return new Uint8Array(buffer);
  }
  return await readViaFileReader(file);
}

/** Fallback pembacaan byte lewat FileReader (dipakai kalau arrayBuffer tidak ada). */
function readViaFileReader(file: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) resolve(new Uint8Array(result));
      else reject(new Error("FileReader tidak mengembalikan ArrayBuffer."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Deteksi apakah byte terlihat seperti teks.
 * Heuristik: kalau ada byte NUL -> biner. Kalau >10% byte di luar
 * printable+whitespace -> biner.
 */
export function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  if (sample.length === 0) return true;
  if (sample.includes(0)) return false;
  let odd = 0;
  for (const b of sample) {
    const printable = b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126);
    if (!printable) odd++;
  }
  return odd / sample.length <= 0.1;
}

/** Ambil ekstensi (tanpa titik, huruf kecil). */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** 64 byte pertama sebagai hex, dipisah spasi. */
export function hexPreview(bytes: Uint8Array, limit = 64): string {
  const head = bytes.subarray(0, Math.min(bytes.length, limit));
  return bytesToHex(head).replace(/(..)(?=.)/g, "$1 ").trim();
}

/** Baca file + susun info lengkap untuk ditampilkan. */
export async function readFileInfo(file: File): Promise<FileInfo> {
  const bytes = await readFileBytes(file);
  return {
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    ext: getExtension(file.name),
    isText: looksLikeText(bytes),
    hexPreview: hexPreview(bytes),
    bytes,
  };
}

/** Ukuran dalam format manusiawi. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Trigger unduhan byte jadi file di browser. */
export function downloadBytes(bytes: Uint8Array, fileName: string, mime = "application/octet-stream"): void {
  // Salin ke ArrayBuffer baru supaya Blob tidak menahan buffer besar.
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Beri waktu browser memulai unduhan sebelum melepas URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Unduh ciphertext sebagai `.dat`. */
export function downloadDat(bytes: Uint8Array, originalName: string): void {
  downloadBytes(bytes, datFileName(originalName), "application/octet-stream");
}

/** Hitung SHA-256 (untuk uji round-trip S15 & auto-verifikasi S30). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return bytesToHex(new Uint8Array(digest));
}
