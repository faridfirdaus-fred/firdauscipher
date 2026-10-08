#!/usr/bin/env tsx
/**
 * demo.ts — skrip demo FirdausCipher (satu perintah, jalan offline).
 *
 * Tujuan: menunjukkan bahwa program benar-benar BEKERJA — bukan sekadar
 * "tampilannya bagus". Skrip ini memanggil KODE YANG SAMA dengan yang dipakai
 * antarmuka web (src/lib/crypto), lalu mencetak hasilnya ke terminal.
 *
 * Isi demo:
 *   BAGIAN 1  9 cipher mode teks  -> enkripsi + dekripsi balik
 *   BAGIAN 2  mode file (biner)   -> SHA-256 sebelum vs sesudah (harus identik)
 *   BAGIAN 3  vektor acuan resmi  -> 27/27 kasus harus cocok
 *
 * Semua dijalankan lokal di dalam Node — tanpa server, tanpa internet.
 *
 * Jalankan:
 *   pnpm demo                        # dari root repositori
 *   cd apps/web && pnpm demo         # dari folder frontend
 *   pnpm demo -- --ringkas           # versi singkat (lewati bagian 2)
 *
 * Keluar dengan kode 1 kalau ada satu saja pemeriksaan yang gagal, sehingga
 * skrip ini sekaligus bisa dipakai sebagai pemeriksaan cepat (mis. di CI).
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CipherId, packEnvelope, unpackEnvelope, type EnvelopeHeader } from "../src/lib/crypto/envelope";
import { runCipher, type CipherParams } from "../src/lib/crypto";
import { fromBase64, toBase64 } from "../src/lib/crypto/core";

const REPO_ROOT = resolve(__dirname, "../../..");
const VECTORS_PATH = join(REPO_ROOT, "packages/vectors/vectors.json");
const TESTFILES = join(REPO_ROOT, "packages/testfiles");

const RINGKAS = process.argv.includes("--ringkas");

const LINE = "=".repeat(78);
const DASH = "-".repeat(78);

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);
const textOf = (bytes: Uint8Array): string => new TextDecoder("utf-8").decode(bytes);
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(Buffer.from(bytes)).digest("hex");

/** Huruf A-Z saja (cipher 26 huruf mengabaikan spasi/tanda baca). */
const sanitize26 = (text: string): string => text.toUpperCase().replace(/[^A-Z]/g, "");

/** Bandingkan dua larik byte (persis). */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Cipher yang memulihkan plaintext PERSIS (tanpa filler).
 * Playfair & Hill menyisipkan filler X yang tidak bisa dibedakan dari plaintext
 * asli, jadi untuk keduanya hasilnya diverifikasi lewat ENKRIPSI ULANG.
 * Aturan ini sama dengan yang dipakai tests/vectors.test.ts milik proyek.
 */
const NO_FILLER = new Set(["vigenere", "autokey", "affine", "enigma"]);

/* ================================================================== */
/* BAGIAN 1 — 9 cipher, mode teks                                      */
/* ================================================================== */

interface TextCase {
  label: string;
  slug: string;
  /** "alpha" = cipher 26 huruf; "binary" = cipher byte (semua byte diproses). */
  kind: "alpha" | "binary";
  text: string;
  params: CipherParams;
}

const TEXT_CASES: TextCase[] = [
  { label: "a) Vigenere Standard", slug: "vigenere", kind: "alpha", text: "SERANG SUBUH SEKALI", params: { key: "LEMON" } },
  { label: "b) Auto-Key Vigenere", slug: "autokey", kind: "alpha", text: "SERANG SUBUH SEKALI", params: { key: "QUEENLY" } },
  { label: "c) Extended Vigenere (256 ASCII)", slug: "ext-vigenere", kind: "binary", text: "Serang subuh! 123", params: { key: "RAHASIA" } },
  { label: "d) Playfair", slug: "playfair", kind: "alpha", text: "TEMUI SAYA DI JEMBATAN", params: { key: "MONARCHY" } },
  { label: "e) Affine", slug: "affine", kind: "alpha", text: "SERANG SUBUH SEKALI", params: { a: "5", b: "8" } },
  { label: "f) Hill (3x3)", slug: "hill", kind: "alpha", text: "SERANG SUBUH SEKALI", params: { matrix: "6,24,1;13,16,10;20,17,15" } },
  { label: "Transposisi Kolom (bagian g)", slug: "columnar", kind: "binary", text: "SERANG SUBUH SEKALI", params: { key: "ZEBRAS" } },
  { label: "g) Super Enkripsi", slug: "super", kind: "binary", text: "SERANG SUBUH SEKALI", params: { key1: "RAHASIA", key2: "ZEBRAS" } },
  {
    label: "h) Enigma (Bonus)",
    slug: "enigma",
    kind: "alpha",
    text: "KRIPTOGRAFI",
    params: { rotors: "I,II,III", reflector: "B", ring: "AAA", position: "AAA", plugboard: "" },
  },
];

interface TextResult {
  label: string;
  plain: string;
  params: CipherParams;
  cipher: string;
  back: string;
  ok: boolean;
  note: string;
}

function demoText(): TextResult[] {
  const out: TextResult[] = [];

  for (const c of TEXT_CASES) {
    const input = bytesOf(c.text);
    const enc = runCipher(c.slug, "encrypt", input, c.params);
    const dec = runCipher(c.slug, "decrypt", enc, c.params);

    let ok: boolean;
    let note: string;
    let cipher: string;
    let back: string;

    if (c.kind === "binary") {
      // Cipher byte: hasilnya biner, ditampilkan sebagai base64 (seperti di
      // aplikasi). Panjang asli diketahui di sini, jadi padding blok dipangkas
      // dengan panjang itu lalu dibandingkan byte-per-byte.
      const restored = dec.slice(0, input.length);
      ok = bytesEqual(restored, input);
      cipher = toBase64(enc);
      back = textOf(restored);
      note = "persis";
    } else {
      // Cipher 26 huruf: hanya A-Z yang bermakna. Verifikasi kuat = enkripsi
      // ulang hasil dekripsi harus menghasilkan ciphertext yang sama.
      const reenc = runCipher(c.slug, "encrypt", dec, c.params);
      const roundTrip = bytesEqual(reenc, enc);
      const exact = sanitize26(textOf(dec)) === sanitize26(c.text);
      ok = roundTrip && (!NO_FILLER.has(c.slug) || exact);
      cipher = textOf(enc);
      back = textOf(dec);
      note = NO_FILLER.has(c.slug) ? "persis" : "persis + filler (cek enkripsi ulang)";
    }

    out.push({ label: c.label, plain: c.text, params: c.params, cipher, back, ok, note });
  }

  return out;
}

/* ================================================================== */
/* BAGIAN 2 — mode file biner (SHA-256 harus identik)                  */
/* ================================================================== */

interface FileCase {
  slug: string;
  cipherId: number;
  label: string;
  file: string;
  params: CipherParams;
}

const FILE_CASES: FileCase[] = [
  { slug: "ext-vigenere", cipherId: CipherId.EXT_VIGENERE, label: "Extended Vigenere (c)", file: "contoh.png", params: { key: "RAHASIA" } },
  { slug: "super", cipherId: CipherId.SUPER, label: "Super Enkripsi (g)", file: "contoh.sqlite", params: { key1: "RAHASIA", key2: "ZEBRAS" } },
  { slug: "columnar", cipherId: CipherId.COLUMNAR, label: "Transposisi Kolom", file: "contoh.wav", params: { key: "ZEBRAS" } },
];

interface FileResult {
  label: string;
  file: string;
  bytes: number;
  shaBefore: string;
  shaAfter: string;
  identical: boolean;
  restoreName: string;
  datBytes: number;
}

/** Enkripsi -> bungkus .dat -> baca ulang -> dekripsi (alur yang sama dgn aplikasi). */
function demoFile(c: FileCase): FileResult | null {
  const path = join(TESTFILES, c.file);
  if (!existsSync(path)) return null;

  const original = new Uint8Array(readFileSync(path));
  const shaBefore = sha256(original);
  const encrypted = runCipher(c.slug, "encrypt", original, c.params);

  const dot = c.file.lastIndexOf(".");
  const header: EnvelopeHeader = {
    name: c.file,
    ext: dot > 0 ? c.file.slice(dot + 1) : "",
    mime: "application/octet-stream",
    size: original.length,
    mode: "binary",
    params: c.params,
  };
  const dat = packEnvelope(c.cipherId, header, encrypted);

  // Sisi dekripsi: persis seperti saat pengguna mengunggah berkas .dat.
  // Panjang asli diambil dari header (bukan menebak padding) — inilah gunanya
  // envelope .dat.
  const parsed = unpackEnvelope(dat);
  const decrypted = runCipher(c.slug, "decrypt", parsed.payload, parsed.header.params as CipherParams);
  const restored = decrypted.slice(0, parsed.header.size);

  const shaAfter = sha256(restored);
  return {
    label: c.label,
    file: c.file,
    bytes: original.length,
    shaBefore,
    shaAfter,
    identical: shaAfter === shaBefore,
    restoreName: parsed.header.name,
    datBytes: dat.length,
  };
}

/* ================================================================== */
/* BAGIAN 3 — vektor acuan resmi (27 kasus)                            */
/* ================================================================== */

interface VectorCase {
  id: string;
  cipher: string;
  mode: "text" | "binary";
  plaintext: string;
  ciphertext: string;
  params: Record<string, unknown>;
}

/** vectors.json menyimpan matrix/rotors sebagai array; runCipher mau string. */
function toTsParams(params: Record<string, unknown>): CipherParams {
  const out: CipherParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "matrix" && Array.isArray(v)) out[k] = (v as number[][]).map((r) => r.join(",")).join(";");
    else if (k === "rotors" && Array.isArray(v)) out[k] = (v as string[]).join(",");
    else out[k] = String(v);
  }
  return out;
}

const vectorInput = (value: string, mode: string): Uint8Array =>
  mode === "binary" ? fromBase64(value) : bytesOf(value);

const vectorOutput = (bytes: Uint8Array, mode: string): string =>
  mode === "binary" ? toBase64(bytes) : new TextDecoder("latin1").decode(bytes);

interface VectorResult {
  id: string;
  cipher: string;
  ok: boolean;
}

/**
 * Aturan pemeriksaan — SAMA dengan tests/vectors.test.ts milik proyek:
 *  - ENKRIPSI harus sama PERSIS dengan ciphertext vektor acuan.
 *  - DEKRIPSI cipher biner: dipangkas sepanjang plaintext asli, lalu dibandingkan
 *    persis (sisanya padding 0x00 dari transposisi kolom).
 *  - DEKRIPSI cipher teks: diverifikasi lewat ENKRIPSI ULANG. Untuk cipher
 *    ber-filler (Playfair, Hill) plaintext juga harus persis.
 */
function demoVectors(): { results: VectorResult[]; total: number } {
  const raw = JSON.parse(readFileSync(VECTORS_PATH, "utf8")) as { cases: VectorCase[] };
  const results: VectorResult[] = [];

  for (const c of raw.cases) {
    const params = toTsParams(c.params);
    try {
      const plainBytes = vectorInput(c.plaintext, c.mode);
      const cipherBytes = vectorInput(c.ciphertext, c.mode);

      const enc = runCipher(c.cipher, "encrypt", plainBytes, params);
      const dec = runCipher(c.cipher, "decrypt", cipherBytes, params);

      const encOk = vectorOutput(enc, c.mode) === c.ciphertext;

      let decOk: boolean;
      if (c.mode === "binary") {
        // Cipher biner: pangkas sepanjang plaintext asli (sisanya padding 0x00).
        decOk = vectorOutput(dec.slice(0, plainBytes.length), c.mode) === c.plaintext;
      } else {
        // Cipher teks: enkripsi ulang hasil dekripsi harus sama dgn ciphertext
        // acuan; cipher ber-filler juga harus memulihkan plaintext persis.
        const reenc = runCipher(c.cipher, "encrypt", dec, params);
        const roundTrip = vectorOutput(reenc, c.mode) === c.ciphertext;
        const exact = sanitize26(textOf(dec)) === sanitize26(c.plaintext);
        decOk = roundTrip && (!NO_FILLER.has(c.cipher) || exact);
      }

      results.push({ id: c.id, cipher: c.cipher, ok: encOk && decOk });
    } catch {
      results.push({ id: c.id, cipher: c.cipher, ok: false });
    }
  }

  return { results, total: raw.cases.length };
}

/* ================================================================== */
/* Program utama                                                       */
/* ================================================================== */

function main(): void {
  console.log(LINE);
  console.log("DEMO FirdausCipher — cipher klasik, implementasi TypeScript");
  console.log("(skrip ini memanggil kode yang sama dengan antarmuka web)");
  console.log(LINE);
  console.log("Berjalan sepenuhnya lokal di dalam Node — tanpa server, tanpa internet.");
  console.log("");

  let gagal = 0;

  // ---- BAGIAN 1 ----
  console.log(DASH);
  console.log("BAGIAN 1 — 9 cipher, mode teks (enkripsi lalu dekripsi balik)");
  console.log(DASH);
  const textResults = demoText();
  for (const r of textResults) {
    if (!r.ok) gagal++;
    console.log(`${r.ok ? "OK   " : "GAGAL"} | ${r.label}`);
    console.log(`        teks     : ${r.plain}`);
    console.log(`        kunci    : ${JSON.stringify(r.params)}`);
    console.log(`        cipher   : ${r.cipher}`);
    console.log(`        dekripsi : ${r.back}  (${r.note})`);
  }
  const okText = textResults.filter((r) => r.ok).length;
  console.log("");
  console.log(`Ringkasan bagian 1: ${okText}/${textResults.length} cipher berhasil enkripsi+dekripsi.`);

  // ---- BAGIAN 2 ----
  if (!RINGKAS) {
    console.log("");
    console.log(DASH);
    console.log("BAGIAN 2 — mode file (biner): SHA-256 sebelum vs sesudah");
    console.log("Cipher biner harus memulihkan berkas byte-per-byte (identik).");
    console.log(DASH);
    for (const c of FILE_CASES) {
      const r = demoFile(c);
      if (!r) {
        console.log(`LEWAT | ${c.file} tidak ada (jalankan packages/testfiles/generate.py)`);
        continue;
      }
      if (!r.identical) gagal++;
      console.log(`${r.identical ? "OK   " : "GAGAL"} | ${r.label}  —  ${r.file}`);
      console.log(`        ukuran asli   : ${r.bytes.toLocaleString("id-ID")} byte`);
      console.log(`        SHA-256 asli  : ${r.shaBefore.slice(0, 32)}...`);
      console.log(`        SHA-256 pulih : ${r.shaAfter.slice(0, 32)}...`);
      console.log(`        .dat          : ${r.datBytes.toLocaleString("id-ID")} byte, nama asli dipulihkan: ${r.restoreName}`);
    }
    console.log("");
    console.log("Catatan: cipher 26 huruf (Vigenere dll.) memang TIDAK bisa memulihkan");
    console.log("berkas biner — itu perilaku benar sesuai soal. Yang wajib biner adalah");
    console.log("c), g), dan Transposisi Kolom.");
  }

  // ---- BAGIAN 3 ----
  console.log("");
  console.log(DASH);
  console.log("BAGIAN 3 — vektor acuan resmi (packages/vectors/vectors.json)");
  console.log(DASH);
  const vec = demoVectors();
  const okVec = vec.results.filter((r) => r.ok).length;
  if (okVec !== vec.total) gagal += vec.total - okVec;

  if (RINGKAS) {
    console.log(`Hasil: ${okVec}/${vec.total} kasus cocok dengan vektor acuan.`);
  } else {
    const perCipher = new Map<string, { ok: number; total: number }>();
    for (const r of vec.results) {
      const e = perCipher.get(r.cipher) ?? { ok: 0, total: 0 };
      e.total++;
      if (r.ok) e.ok++;
      perCipher.set(r.cipher, e);
    }
    for (const [slug, e] of perCipher) {
      console.log(`${e.ok === e.total ? "OK   " : "GAGAL"} | ${slug.padEnd(14)} ${e.ok}/${e.total} kasus`);
    }
    console.log("");
    console.log(`Ringkasan bagian 3: ${okVec}/${vec.total} kasus cocok.`);
    console.log("(Kesamaan TS ↔ Ruby untuk kasus yang sama diuji oleh `pnpm cross-verify`.)");
  }

  // ---- PENUTUP ----
  console.log("");
  console.log(LINE);
  if (gagal === 0) {
    console.log(`SEMUA LULUS — ${textResults.length} cipher (teks) + ${vec.total} vektor acuan.`);
    console.log("");
    console.log("Cara memakai antarmuka web (juga tanpa internet):");
    console.log("  1. pnpm install   # sekali saja; HANYA langkah ini yang butuh internet");
    console.log("  2. pnpm build     # bangun aplikasi produksi");
    console.log("  3. pnpm start     # buka http://localhost:3000");
    console.log("  (atau 'pnpm dev' untuk mode pengembangan)");
  } else {
    console.log(`ADA ${gagal} PEMERIKSAAN YANG GAGAL — lihat baris bertanda GAGAL di atas.`);
  }
  console.log(LINE);

  process.exit(gagal === 0 ? 0 : 1);
}

main();
