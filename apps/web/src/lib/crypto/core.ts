/**
 * core.ts — utilitas bersama untuk seluruh cipher.
 *
 * ATURAN (AGENTS.md §3.1 no.5): file ini dan semua file di `lib/crypto/**`
 * TIDAK BOLEH memakai `Buffer`, `fs`, `process`, atau `node:*`.
 * Harus jalan di browser, Node, DAN Cloudflare Workers runtime.
 *
 * Karena itu base64 ditulis manual (bukan `Buffer.from(...).toString("base64")`).
 */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const MOD26 = 26;

/** Matriks persegi berisi angka (baris x kolom). */
export type Matrix = number[][];

// ---------------------------------------------------------------------------
// Alfabet 26 huruf
// ---------------------------------------------------------------------------

/**
 * Buang semua karakter non-alfabet dan ubah ke huruf besar (Sp2).
 * Dipakai oleh semua cipher 26 huruf.
 */
export function sanitize26(text: string): string {
  const out: string[] = [];
  for (const ch of text) {
    const up = ch.toUpperCase();
    // `up.length === 1` penting: 'ß'.toUpperCase() === 'SS'.
    if (up.length === 1 && up >= "A" && up <= "Z") out.push(up);
  }
  return out.join("");
}

/** Ubah huruf A-Z jadi 0-25. Melempar error kalau bukan huruf tunggal. */
export function charToNum(ch: string): number {
  if (ch.length !== 1) throw new Error(`charToNum: butuh 1 karakter, dapat "${ch}"`);
  const n = ch.charCodeAt(0) - 65;
  if (n < 0 || n > 25) throw new Error(`charToNum: "${ch}" bukan huruf A-Z`);
  return n;
}

/** Ubah angka jadi huruf A-Z (otomatis modulo 26). */
export function numToChar(n: number): string {
  return String.fromCharCode(mod(n, MOD26) + 65);
}

/** Modulo yang selalu non-negatif (JS `%` bisa negatif). */
export function mod(n: number, m: number): number {
  if (m <= 0) throw new Error(`mod: modulus harus > 0, dapat ${m}`);
  return ((n % m) + m) % m;
}

// ---------------------------------------------------------------------------
// Base64 (manual, bebas Buffer)
// ---------------------------------------------------------------------------

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Encode byte -> base64. */
export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const hasB1 = i + 1 < bytes.length;
    const hasB2 = i + 2 < bytes.length;
    const b1 = hasB1 ? bytes[i + 1] : 0;
    const b2 = hasB2 ? bytes[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    out += B64[(triple >> 18) & 63];
    out += B64[(triple >> 12) & 63];
    out += hasB1 ? B64[(triple >> 6) & 63] : "=";
    out += hasB2 ? B64[triple & 63] : "=";
  }
  return out;
}

/** Decode base64 -> byte. Karakter di luar alfabet base64 (termasuk "=") diabaikan. */
export function fromBase64(str: string): Uint8Array {
  const clean = str.replace(/[^A-Za-z0-9+/]/g, "");
  const outLen = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64.indexOf(clean[i]);
    const c1 = i + 1 < clean.length ? B64.indexOf(clean[i + 1]) : 0;
    const c2 = i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : 0;
    const c3 = i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : 0;
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (o < outLen) out[o++] = (triple >> 16) & 255;
    if (o < outLen) out[o++] = (triple >> 8) & 255;
    if (o < outLen) out[o++] = triple & 255;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Konversi byte <-> string
// ---------------------------------------------------------------------------

/** byte (0-255) -> string latin1 (1 char = 1 byte). Dipakai untuk Extended Vigenere. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** string latin1 -> byte. Karakter > 0xFF dipotong ke byte rendah. */
export function latin1ToBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
  return out;
}

/** string UTF-8 -> byte. */
export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** byte UTF-8 -> string. */
export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/** byte -> string hex (untuk tampilan/debug). */
export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

/** string hex -> byte. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// ---------------------------------------------------------------------------
// Aljabar modular & matriks (Sp10: boleh pakai library, tapi ini ditulis sendiri)
// ---------------------------------------------------------------------------

/** Faktor persekutuan terbesar. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/**
 * Invers modulo: cari x sehingga (a * x) % m === 1.
 * Melempar error kalau gcd(a, m) !== 1 (invers tidak ada).
 */
export function modInverse(a: number, m: number): number {
  let oldR = mod(a, m);
  let r = m;
  let oldS = 1;
  let s = 0;
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1) {
    throw new Error(`modInverse: gcd(${a}, ${m}) = ${oldR} ≠ 1 → tidak ada invers modulo ${m}`);
  }
  return mod(oldS, m);
}

/** Determinan matriks (tanpa modulo) — rekursif, cukup untuk n ≤ 3. */
function detRaw(matrix: Matrix): number {
  const n = matrix.length;
  if (n === 0) return 0;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  let sum = 0;
  for (let c = 0; c < n; c++) {
    const minor = matrix.slice(1).map((row) => row.filter((_, j) => j !== c));
    sum += (c % 2 === 0 ? 1 : -1) * matrix[0][c] * detRaw(minor);
  }
  return sum;
}

/** Determinan modulo m. */
export function detMod(matrix: Matrix, m: number): number {
  assertSquare(matrix);
  return mod(detRaw(matrix), m);
}

/** Perkalian matriks modulo m. */
export function matMulMod(a: Matrix, b: Matrix, m: number): Matrix {
  const n = a.length;
  const k = b.length;
  const p = b[0]?.length ?? 0;
  if (a[0]?.length !== k) {
    throw new Error(`matMulMod: dimensi tidak cocok (${a[0]?.length} vs ${k})`);
  }
  const out: Matrix = [];
  for (let i = 0; i < n; i++) {
    out.push(new Array<number>(p).fill(0));
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let t = 0; t < k; t++) sum += a[i][t] * b[t][j];
      out[i][j] = mod(sum, m);
    }
  }
  return out;
}

/** Transpose matriks. */
export function transpose(matrix: Matrix): Matrix {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const out: Matrix = [];
  for (let j = 0; j < cols; j++) {
    out.push(new Array<number>(rows).fill(0));
    for (let i = 0; i < rows; i++) out[j][i] = matrix[i][j];
  }
  return out;
}

function minorOf(matrix: Matrix, row: number, col: number): Matrix {
  return matrix.filter((_, i) => i !== row).map((r) => r.filter((_, j) => j !== col));
}

/** Matriks kofaktor. */
export function cofactorMatrix(matrix: Matrix): Matrix {
  assertSquare(matrix);
  const n = matrix.length;
  const out: Matrix = [];
  for (let i = 0; i < n; i++) {
    out.push(new Array<number>(n).fill(0));
    for (let j = 0; j < n; j++) {
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      out[i][j] = sign * detRaw(minorOf(matrix, i, j));
    }
  }
  return out;
}

/**
 * Invers matriks modulo m: adj(A) * det(A)^-1 mod m.
 * Melempar error yang menyebut nilai determinan kalau tidak punya invers.
 */
export function invertMatrixMod(matrix: Matrix, m: number): Matrix {
  assertSquare(matrix);
  const det = detMod(matrix, m);
  let detInv: number;
  try {
    detInv = modInverse(det, m);
  } catch {
    throw new Error(
      `Matriks tidak punya invers modulo ${m}: det = ${det}, gcd(${det}, ${m}) ≠ 1. ` +
        `Pilih matriks lain dengan determinan koprima ${m}.`,
    );
  }
  const adj = transpose(cofactorMatrix(matrix));
  return adj.map((row) => row.map((v) => mod(v * detInv, m)));
}

/** Pastikan matriks persegi dan tidak kosong. */
export function assertSquare(matrix: Matrix): void {
  const n = matrix.length;
  if (n === 0) throw new Error("Matriks kosong — isi dulu matriks kuncinya.");
  matrix.forEach((row, i) => {
    if (row.length !== n) {
      throw new Error(
        `Matriks harus persegi: baris ${i + 1} berisi ${row.length} elemen, ` +
          `sedangkan jumlah baris ada ${n}. Tulis 2×2 atau 3×3, ` +
          `mis. "3,3;2,5" atau "6,24,1;13,16,10;20,17,15".`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Padding blok
// ---------------------------------------------------------------------------

/**
 * Tambah padding sampai panjang kelipatan n.
 * `filler` = nilai byte pengisi (default 0x00 untuk jalur biner; cipher 26 huruf pakai 'X').
 * Kalau data sudah kelipatan n → tidak menambah apa pun.
 */
export function padBlock(data: Uint8Array, n: number, filler = 0): Uint8Array {
  if (n <= 0) throw new Error(`padBlock: n harus > 0, dapat ${n}`);
  const rem = data.length % n;
  if (rem === 0) return data.slice();
  const out = new Uint8Array(data.length + (n - rem));
  out.set(data, 0);
  out.fill(filler, data.length);
  return out;
}

/** String 26 huruf -> byte ASCII (untuk jalur file pada cipher 26 huruf). */
export function alphaToBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 255;
  return out;
}
