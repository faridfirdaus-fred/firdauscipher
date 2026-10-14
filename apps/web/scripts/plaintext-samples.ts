#!/usr/bin/env tsx
/**
 * plaintext-samples.ts — contoh plainteks & cipherteks KONKRET per kategori (R2).
 *
 * Dosen meminta laporan berisi "contoh plainteks dan cipherteks (text, gambar,
 * file database, audio, video) serta penjelasannya". Skrip ini menghasilkan
 * bukti konkret tersebut:
 *
 *   1. Untuk 5 kategori file: 16 byte pertama SEBELUM vs SESUDAH enkripsi
 *      (hex + ASCII), ukuran, dan SHA-256.
 *   2. Untuk pesan teks: contoh plainteks -> cipherteks tiap cipher 26 huruf.
 *
 * Semua angka/bita diambil dari berkas nyata, bukan dikarang.
 *
 * Jalankan: pnpm --filter firdauscipher-web samples
 * Keluaran: laporan/uji-file/samples.json
 */

import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { runCipher, type CipherParams } from "../src/lib/crypto";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");
const TESTFILES = join(REPO_ROOT, "packages", "testfiles");
const OUT_DIR = join(REPO_ROOT, "laporan", "uji-file");

/** Cipher biner dipakai untuk semua kategori file (semua byte dipertahankan). */
const FILE_CIPHER = {
  slug: "ext-vigenere",
  label: "Extended Vigenere (c)",
  params: { key: "kunci-laporan-uts" } as CipherParams,
};

const FILES = [
  { category: "Teks", file: "contoh.txt", mime: "text/plain", desc: "berkas teks UTF-8" },
  { category: "Gambar", file: "contoh.png", mime: "image/png", desc: "citra PNG" },
  { category: "Database", file: "contoh.sqlite", mime: "application/vnd.sqlite3", desc: "basis data SQLite" },
  { category: "Audio", file: "contoh.wav", mime: "audio/wav", desc: "berkas suara WAV" },
  { category: "Video", file: "contoh.mp4", mime: "video/mp4", desc: "berkas video MP4" },
];

/** Contoh teks untuk tiap cipher 26 huruf (plainteks -> cipherteks). */
const TEXT_CASES: { cipher: string; params: CipherParams; plaintext: string }[] = [
  { cipher: "vigenere", params: { key: "LEMON" }, plaintext: "SERANG SUBUH SEKALI" },
  { cipher: "autokey", params: { key: "LEMON" }, plaintext: "SERANG SUBUH SEKALI" },
  { cipher: "playfair", params: { key: "MONARCHY" }, plaintext: "SERANG SUBUH SEKALI" },
  { cipher: "affine", params: { a: "5", b: "8" }, plaintext: "SERANG SUBUH SEKALI" },
  { cipher: "hill", params: { matrix: "3 3;2 5" }, plaintext: "SERANGSUB" },
  { cipher: "enigma", params: { rotors: "I,II,III", reflector: "B", ring: "AAA", position: "AAA", plugboard: "" }, plaintext: "SERANG SUBUH SEKALI" },
];

function sha256(b: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(b)).digest("hex");
}

function hexdump(bytes: Uint8Array, n = 16): { hex: string; ascii: string } {
  const slice = bytes.slice(0, n);
  const hex = Array.from(slice)
    .map((x) => x.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
  const ascii = Array.from(slice)
    .map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : "."))
    .join("");
  return { hex, ascii };
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const out: any = {
    generated: new Date().toISOString(),
    cipher: FILE_CIPHER,
    files: [],
    text: [],
  };

  console.log("=".repeat(78));
  console.log("CONTOH PLAINTEKS & CIPHERTEKS PER KATEGORI (R2)");
  console.log("=".repeat(78));

  // --- 1. Lima kategori file -------------------------------------------------
  for (const f of FILES) {
    const path = join(TESTFILES, f.file);
    const plain = new Uint8Array(readFileSync(path));
    const cipher = runCipher(FILE_CIPHER.slug, "encrypt", plain, FILE_CIPHER.params);
    const back = runCipher(FILE_CIPHER.slug, "decrypt", cipher, FILE_CIPHER.params);
    const restored = back.slice(0, plain.length);

    const p = hexdump(plain) as any;
    const c = hexdump(cipher) as any;
    const identical = sha256(plain) === sha256(restored);

    const rec = {
      category: f.category,
      file: f.file,
      mime: f.mime,
      desc: f.desc,
      bytes: plain.length,
      cipherBytes: cipher.length,
      plainHex: p.hex,
      plainAscii: p.ascii,
      cipherHex: c.hex,
      cipherAscii: c.ascii,
      shaBefore: sha256(plain),
      shaAfter: sha256(restored),
      identical,
    };
    out.files.push(rec);

    console.log(`\n[${f.category}] ${f.file} (${plain.length} byte, ${f.desc})`);
    console.log(`  plainteks   : ${p.hex}`);
    console.log(`                |${p.ascii}|`);
    console.log(`  cipherteks  : ${c.hex}`);
    console.log(`                |${c.ascii}|`);
    console.log(`  SHA identik : ${identical ? "YA" : "TIDAK"}`);
  }

  // --- 2. Contoh teks tiap cipher 26 huruf ----------------------------------
  console.log("\n" + "=".repeat(78));
  console.log("CONTOH PESAN TEKS (26 HURUF)");
  console.log("=".repeat(78));
  for (const t of TEXT_CASES) {
    const plainBytes = new TextEncoder().encode(t.plaintext);
    const enc = runCipher(t.cipher, "encrypt", plainBytes, t.params);
    const dec = runCipher(t.cipher, "decrypt", enc, t.params);
    const rec = {
      cipher: t.cipher,
      params: t.params,
      plaintext: t.plaintext,
      ciphertext: new TextDecoder().decode(enc),
      decrypted: new TextDecoder().decode(dec),
    };
    out.text.push(rec);
    console.log(`\n${t.cipher}: ${t.plaintext} -> ${rec.ciphertext}`);
    console.log(`  kunci: ${JSON.stringify(t.params)}`);
  }

  writeFileSync(join(OUT_DIR, "samples.json"), JSON.stringify(out, null, 2));
  console.log(`\nDitulis: ${join(OUT_DIR, "samples.json")}`);
}

main();
