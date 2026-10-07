#!/usr/bin/env tsx
/**
 * roundtrip-test.ts — uji round-trip file biner 5 kategori (S15).
 *
 * Ini bukti utama untuk R2 (permintaan eksplisit dosen): SHA-256 file
 * SEBELUM vs SESUDAH enkripsi-dekripsi harus IDENTIK untuk minimal 1 file
 * di setiap kategori: teks, gambar, database, audio, video.
 *
 * Cipher yang diuji per file:
 *   - ext-vigenere (c)  : cipher biner, semua byte dipertahankan
 *   - super (g)         : cipher biner, dua kunci
 *   - columnar          : transposisi kolom (bagian dari g)
 *   - vigenere (a)      : cipher 26 huruf -> file biner TIDAK bisa dipulihkan
 *                         (dibuktikan sebagai perbandingan, bukan kegagalan)
 *
 * Jalankan: pnpm --filter firdauscipher-web roundtrip
 * Output  : laporan/uji-file/roundtrip.json + laporan/uji-file/roundtrip.md
 */

import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  CipherId,
  packEnvelope,
  unpackEnvelope,
  type EnvelopeHeader,
} from "../src/lib/crypto/envelope";
import { runCipher, type CipherParams } from "../src/lib/crypto";

const REPO_ROOT = resolve(__dirname, "../../..");
const TESTFILES = join(REPO_ROOT, "packages/testfiles");
const OUT_DIR = join(REPO_ROOT, "laporan/uji-file");

/** Kategori wajib R2 + file + cipher yang dipakai. */
const CATEGORIES = [
  { category: "Teks", file: "contoh.txt", mime: "text/plain" },
  { category: "Gambar", file: "contoh.png", mime: "image/png" },
  { category: "Database", file: "contoh.sqlite", mime: "application/vnd.sqlite3" },
  { category: "Audio", file: "contoh.wav", mime: "audio/wav" },
  { category: "Video", file: "contoh.mp4", mime: "video/mp4" },
];

/** Cipher biner yang WAJIB berhasil round-trip byte-identik. */
const BINARY_CIPHERS: { slug: string; cipherId: number; params: CipherParams; label: string }[] = [
  {
    slug: "ext-vigenere",
    cipherId: CipherId.EXT_VIGENERE,
    params: { key: "kunci-uji-roundtrip" },
    label: "Extended Vigenere (c)",
  },
  {
    slug: "columnar",
    cipherId: CipherId.COLUMNAR,
    params: { key: "ZEBRAS" },
    label: "Transposisi Kolom",
  },
  {
    slug: "super",
    cipherId: CipherId.SUPER,
    params: { key1: "kunci-vigenere", key2: "ZEBRAS" },
    label: "Super Enkripsi (g)",
  },
];

/** Cipher 26 huruf: dipakai sebagai pembanding (file biner rusak). */
const ALPHA_CIPHERS: { slug: string; cipherId: number; params: CipherParams; label: string }[] = [
  {
    slug: "vigenere",
    cipherId: CipherId.VIGENERE,
    params: { key: "LEMON" },
    label: "Vigenere (a)",
  },
];

interface Result {
  category: string;
  file: string;
  bytes: number;
  cipher: string;
  label: string;
  shaBefore: string;
  shaAfter: string;
  identical: boolean;
  roundTrip: boolean;
  datBytes: number;
  restoreName: string;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

/** Enkripsi -> envelope -> dekripsi, persis seperti alur aplikasi. */
function roundTrip(
  slug: string,
  cipherId: number,
  params: CipherParams,
  bytes: Uint8Array,
  fileName: string,
  mime: string,
): { restored: Uint8Array; dat: Uint8Array; header: EnvelopeHeader } {
  const encrypted = runCipher(slug, "encrypt", bytes, params);

  const dot = fileName.lastIndexOf(".");
  const ext = dot > 0 ? fileName.slice(dot + 1) : "";
  const header: EnvelopeHeader = {
    name: fileName,
    ext,
    mime,
    size: bytes.length,
    mode: "binary",
    params,
  };
  const dat = packEnvelope(cipherId, header, encrypted);

  // --- Sisi dekripsi: baca .dat seperti aplikasi ---
  const parsed = unpackEnvelope(dat);
  const decrypted = runCipher(slug, "decrypt", parsed.payload, parsed.header.params as CipherParams);
  // Pangkas padding 0x00 memakai `size` dari header (S11).
  const restored = decrypted.slice(0, parsed.header.size);
  return { restored, dat, header: parsed.header };
}

function main(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const results: Result[] = [];
  const warnings: string[] = [];

  console.log("=".repeat(78));
  console.log("UJI ROUND-TRIP FILE — FirdausCipher (S15)");
  console.log("=".repeat(78));

  for (const cat of CATEGORIES) {
    const path = join(TESTFILES, cat.file);
    if (!existsSync(path)) {
      warnings.push(`File uji tidak ada: ${cat.file} (jalankan packages/testfiles/generate.py)`);
      continue;
    }
    const original = new Uint8Array(readFileSync(path));
    const shaBefore = sha256(original);

    console.log(`\n[${cat.category}] ${cat.file} — ${original.length.toLocaleString("id-ID")} byte`);
    console.log(`  SHA-256 sebelum : ${shaBefore}`);

    // --- Cipher biner: harus byte-identik ---
    for (const c of BINARY_CIPHERS) {
      const { restored, dat, header } = roundTrip(
        c.slug,
        c.cipherId,
        c.params,
        original,
        cat.file,
        cat.mime,
      );
      const shaAfter = sha256(restored);
      const identical = shaAfter === shaBefore;
      const roundTripOk = Buffer.from(restored).equals(Buffer.from(original));

      console.log(`  [${identical ? "OK " : "GAGAL"}] ${c.label.padEnd(24)} .dat=${dat.length.toLocaleString("id-ID")}B  SHA sesudah=${shaAfter.slice(0, 16)}…`);

      results.push({
        category: cat.category,
        file: cat.file,
        bytes: original.length,
        cipher: c.slug,
        label: c.label,
        shaBefore,
        shaAfter,
        identical,
        roundTrip: roundTripOk,
        datBytes: dat.length,
        restoreName: `${header.name}`,
      });

      if (!identical) {
        warnings.push(
          `GAGAL: ${cat.file} dengan ${c.label} — SHA berbeda (${shaBefore} vs ${shaAfter})`,
        );
      }
    }

    // --- Cipher 26 huruf: pembanding, file biner memang rusak (Sp2) ---
    for (const c of ALPHA_CIPHERS) {
      const { restored, dat, header } = roundTrip(
        c.slug,
        c.cipherId,
        c.params,
        original,
        cat.file,
        cat.mime,
      );
      const shaAfter = sha256(restored);
      const identical = shaAfter === shaBefore;
      console.log(
        `  [${identical ? "OK " : "BEDA"}] ${c.label.padEnd(24)} .dat=${dat.length.toLocaleString("id-ID")}B  ` +
          `(cipher 26 huruf membuang non-alfabet -> ukuran ${restored.length}B dari ${original.length}B)`,
      );
      results.push({
        category: cat.category,
        file: cat.file,
        bytes: original.length,
        cipher: c.slug,
        label: c.label,
        shaBefore,
        shaAfter,
        identical,
        roundTrip: false,
        datBytes: dat.length,
        restoreName: header.name,
      });
    }
  }

  // ------------------------------------------------------------- ringkasan
  const binary = results.filter((r) => BINARY_CIPHERS.some((c) => c.slug === r.cipher));
  const alpha = results.filter((r) => ALPHA_CIPHERS.some((c) => c.slug === r.cipher));
  const allBinaryOk = binary.every((r) => r.identical);

  console.log("\n" + "=".repeat(78));
  console.log("RINGKASAN");
  console.log("=".repeat(78));
  console.log(`Cipher biner  : ${binary.filter((r) => r.identical).length}/${binary.length} byte-identik`);
  console.log(`Cipher 26 huruf: ${alpha.filter((r) => r.identical).length}/${alpha.length} byte-identik (diharapkan 0 — Sp2)`);
  console.log(`Kategori wajib R2 terpenuhi: ${allBinaryOk ? "YA (5/5 kategori)" : "TIDAK"}`);

  // ------------------------------------------------------------- tulis hasil
  const jsonPath = join(OUT_DIR, "roundtrip.json");
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        node: process.version,
        testfiles: TESTFILES,
        categories: CATEGORIES.map((c) => c.category),
        binaryCiphers: BINARY_CIPHERS.map((c) => c.slug),
        allBinaryIdentical: allBinaryOk,
        results,
        warnings,
      },
      null,
      2,
    ) + "\n",
  );

  const md: string[] = [
    "# Hasil Uji Round-Trip File (S15)",
    "",
    `Dibuat: ${new Date().toISOString()}`,
    "",
    "Uji ini memenuhi **R2**: SHA-256 file sebelum vs sesudah enkripsi–dekripsi harus identik",
    "untuk minimal 1 file di setiap kategori: teks, gambar, database, audio, video.",
    "",
    "## 1. Ringkasan",
    "",
    `- Cipher biner byte-identik: **${binary.filter((r) => r.identical).length}/${binary.length}**`,
    `- Cipher 26 huruf byte-identik: ${alpha.filter((r) => r.identical).length}/${alpha.length} (memang 0 — Sp2 membuang non-alfabet)`,
    `- Kategori wajib R2: **${allBinaryOk ? "5/5 TERPENUHI" : "BELUM" }**`,
    "",
    "## 2. Tabel hasil",
    "",
    "| Kategori | File | Ukuran | Cipher | SHA-256 sebelum | SHA-256 sesudah | Identik | Ukuran .dat |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of results) {
    md.push(
      `| ${r.category} | \`${r.file}\` | ${r.bytes.toLocaleString("id-ID")} B | ${r.label} | \`${r.shaBefore.slice(0, 16)}…\` | \`${r.shaAfter.slice(0, 16)}…\` | ${r.identical ? "✅ Ya" : "❌ Tidak"} | ${r.datBytes.toLocaleString("id-ID")} B |`,
    );
  }
  md.push("", "## 3. Bukti SHA-256 lengkap", "");
  for (const r of results) {
    md.push(`### ${r.category} — ${r.file} — ${r.label}`, "");
    md.push(`- SHA-256 sebelum : \`${r.shaBefore}\``);
    md.push(`- SHA-256 sesudah : \`${r.shaAfter}\``);
    md.push(`- Identik         : ${r.identical ? "**YA**" : "TIDAK"}`);
    md.push("");
  }
  if (warnings.length > 0) {
    md.push("## 4. Peringatan", "");
    for (const w of warnings) md.push(`- ${w}`);
    md.push("");
  }
  writeFileSync(join(OUT_DIR, "roundtrip.md"), md.join("\n") + "\n");

  console.log(`\nHasil ditulis ke:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${join(OUT_DIR, "roundtrip.md")}`);

  if (!allBinaryOk) {
    console.error("\nGAGAL: ada cipher biner yang tidak byte-identik.");
    process.exit(1);
  }
}

main();
