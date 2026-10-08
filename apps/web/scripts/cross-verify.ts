#!/usr/bin/env tsx
/**
 * cross-verify.ts — cross-verifikasi TS <-> Ruby (S22). ⭐ Pembeda bonus 2.
 *
 * Membuktikan satu hal: **implementasi TypeScript dan Ruby menghasilkan
 * ciphertext yang IDENTIK untuk seluruh kasus di packages/vectors/vectors.json**.
 *
 * Cara kerja (deterministik, tanpa server):
 *   1. Muat 27 kasus vektor.
 *   2. Jalankan tiap kasus di TS lokal (runCipher) -> enc/dec.
 *   3. Panggil Ruby (apps/api/bin/cross_cli.rb) lewat STDIN -> enc/dec.
 *   4. Bandingkan: TS == Ruby == vektor resmi.
 *
 * Tiga kolom dianggap lulus hanya kalau ketiganya sama. Jadi kalau Ruby dan
 * TS "sama-sama salah", tetap terdeteksi karena vektor resmi jadi acuan ketiga.
 *
 * Jalankan: pnpm --filter firdauscipher-web cross-verify
 * Output  : laporan/uji/cross-verify.json + laporan/uji/cross-verify.md
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { fromBase64, toBase64 } from "../src/lib/crypto/core";
import { runCipher, type CipherParams } from "../src/lib/crypto";

const REPO_ROOT = resolve(__dirname, "../../..");
const VECTORS_PATH = join(REPO_ROOT, "packages/vectors/vectors.json");
// Bisa di-override lewat env (dipakai uji falsifiabilitas: pastikan harness
// benar-benar GAGAL kalau implementasi Ruby dirusak).
const RUBY_CLI = process.env.CROSS_CLI ?? join(REPO_ROOT, "apps/api/bin/cross_cli.rb");
const OUT_DIR = join(REPO_ROOT, "laporan/uji");

interface VectorCase {
  id: string;
  cipher: string;
  mode: "text" | "binary";
  plaintext: string;
  ciphertext: string;
  params: Record<string, unknown>;
  note?: string;
}

/** String <-> byte sesuai mode kasus vektor. */
function inputBytes(value: string, mode: string): Uint8Array {
  return mode === "binary" ? fromBase64(value) : new TextEncoder().encode(value);
}
function outputString(bytes: Uint8Array, mode: string): string {
  return mode === "binary" ? toBase64(bytes) : new TextDecoder("latin1").decode(bytes);
}

/**
 * vectors.json menyimpan `matrix` (Hill) sebagai array-of-arrays dan `rotors`
 * (Enigma) sebagai array, sedangkan runCipher TS mengharapkan STRING.
 * Ruby sudah menerima keduanya; di sini kita samakan bentuknya untuk TS.
 */
function toTsParams(params: Record<string, unknown>): CipherParams {
  const out: CipherParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "matrix" && Array.isArray(v)) {
      out[k] = (v as number[][]).map((row) => row.join(",")).join(";");
    } else if (k === "rotors" && Array.isArray(v)) {
      out[k] = (v as string[]).join(",");
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

/** Jalankan semua kasus di Ruby sekaligus (satu proses, cepat). */
function runRuby(cases: VectorCase[]): Map<string, { encrypt: string; decrypt: string; error?: string }> {
  const payload = JSON.stringify({
    cases: cases.map((c) => ({
      id: c.id,
      cipher: c.cipher,
      mode: c.mode,
      plaintext: c.plaintext,
      ciphertext: c.ciphertext,
      params: c.params,
    })),
  });

  const res = spawnSync("ruby", [RUBY_CLI], { input: payload, encoding: "utf8" });
  if (res.error) throw new Error(`Gagal menjalankan Ruby: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`Ruby keluar dengan kode ${res.status}: ${res.stderr?.slice(0, 500)}`);
  }

  const parsed = JSON.parse(res.stdout) as {
    results: Array<{ id: string; encrypt?: string; decrypt?: string; error?: string }>;
  };
  const map = new Map<string, { encrypt: string; decrypt: string; error?: string }>();
  for (const r of parsed.results) {
    map.set(r.id, { encrypt: r.encrypt ?? "", decrypt: r.decrypt ?? "", error: r.error });
  }
  return map;
}

interface Row {
  id: string;
  cipher: string;
  mode: string;
  tsEnc: string;
  rbEnc: string;
  vector: string;
  encMatch: boolean;
  decMatch: boolean;
  pass: boolean;
  note: string;
}

function main(): void {
  const data = JSON.parse(readFileSync(VECTORS_PATH, "utf8")) as {
    version: string;
    generated: string;
    cases: VectorCase[];
  };
  const cases = data.cases;

  console.log("═".repeat(78));
  console.log("CROSS-VERIFIKASI TS ↔ RUBY (S22)");
  console.log("═".repeat(78));
  console.log(`Vektor   : ${VECTORS_PATH}`);
  console.log(`Kasus    : ${cases.length}`);
  console.log(`Versi    : ${data.version} (${data.generated})`);
  console.log("");

  const ruby = runRuby(cases);
  const rows: Row[] = [];
  let rubyErrors = 0;

  for (const c of cases) {
    const params = toTsParams(c.params);
    const plainBytes = inputBytes(c.plaintext, c.mode);
    const cipherBytes = inputBytes(c.ciphertext, c.mode);

    let tsEnc = "";
    let tsDec = "";
    let tsError = "";
    try {
      tsEnc = outputString(runCipher(c.cipher, "encrypt", plainBytes, params), c.mode);
      tsDec = outputString(runCipher(c.cipher, "decrypt", cipherBytes, params), c.mode);
    } catch (e) {
      tsError = e instanceof Error ? e.message : String(e);
    }

    const rb = ruby.get(c.id) ?? { encrypt: "", decrypt: "" };
    if (rb.error) rubyErrors++;

    // Enkripsi: TS harus sama dengan Ruby DAN sama dengan vektor resmi.
    const encMatch = !tsError && !rb.error && tsEnc === rb.encrypt && tsEnc === c.ciphertext;
    // Dekripsi: TS harus sama dengan Ruby (vektor menyimpan ciphertext, jadi
    // plaintext hasil dekripsi tidak selalu sama persis karena filler Hill/Playfair).
    const decMatch = !tsError && !rb.error && tsDec === rb.decrypt;

    rows.push({
      id: c.id,
      cipher: c.cipher,
      mode: c.mode,
      tsEnc,
      rbEnc: rb.encrypt,
      vector: c.ciphertext,
      encMatch,
      decMatch,
      pass: encMatch && decMatch,
      note: tsError ? `TS error: ${tsError}` : rb.error ? `Ruby error: ${rb.error}` : c.note ?? "",
    });
  }

  // ---- Tabel konsol ----
  const w = 20;
  console.log(
    "ID".padEnd(w) +
      "CIPHER".padEnd(15) +
      "MODE".padEnd(8) +
      "TS==RUBY".padEnd(10) +
      "TS==VEKTOR".padEnd(11) +
      "DEKRIPSI",
  );
  console.log("─".repeat(78));
  for (const r of rows) {
    console.log(
      r.id.padEnd(w) +
        r.cipher.padEnd(15) +
        r.mode.padEnd(8) +
        (r.encMatch ? "  ✓" : "  ✗").padEnd(10) +
        (r.encMatch ? "  ✓" : "  ✗").padEnd(11) +
        (r.decMatch ? "  ✓" : "  ✗"),
    );
  }

  const passed = rows.filter((r) => r.pass).length;
  const encIdentical = rows.filter((r) => r.encMatch).length;
  const decIdentical = rows.filter((r) => r.decMatch).length;

  console.log("");
  console.log("═".repeat(78));
  console.log("RINGKASAN");
  console.log("═".repeat(78));
  console.log(`Enkripsi identik (TS == Ruby == vektor) : ${encIdentical}/${rows.length}`);
  console.log(`Dekripsi identik (TS == Ruby)           : ${decIdentical}/${rows.length}`);
  console.log(`Kasus lulus penuh                        : ${passed}/${rows.length}`);
  if (rubyErrors > 0) console.log(`Error Ruby                               : ${rubyErrors}`);
  console.log(
    passed === rows.length
      ? "\n✅ LULUS: 100% kasus vektor identik di kedua implementasi."
      : `\n❌ GAGAL: ${rows.length - passed} kasus tidak cocok.`,
  );

  // ---- Tulis laporan ----
  mkdirSync(OUT_DIR, { recursive: true });

  const json = {
    version: data.version,
    generated: data.generated,
    verifiedAt: new Date().toISOString(),
    total: rows.length,
    encIdentical,
    decIdentical,
    passed,
    allPass: passed === rows.length,
    rows: rows.map((r) => ({
      id: r.id,
      cipher: r.cipher,
      mode: r.mode,
      tsEncrypt: r.tsEnc,
      rubyEncrypt: r.rbEnc,
      vectorCiphertext: r.vector,
      encryptIdentical: r.encMatch,
      decryptIdentical: r.decMatch,
      pass: r.pass,
      note: r.note,
    })),
  };
  writeFileSync(join(OUT_DIR, "cross-verify.json"), JSON.stringify(json, null, 2) + "\n");

  const md: string[] = [];
  md.push("# Cross-Verifikasi TypeScript ↔ Ruby (S22)\n");
  md.push("Bukti **BONUS 2**: satu set vektor (`packages/vectors/vectors.json`)");
  md.push("dijalankan di dua implementasi berbeda (TypeScript & Ruby) dan hasilnya");
  md.push("dibandingkan byte-per-byte.\n");
  md.push(`- Vektor versi: \`${data.version}\` (${data.generated})`);
  md.push(`- Diverifikasi: ${json.verifiedAt}`);
  md.push(`- Kasus: **${rows.length}**\n`);
  md.push("## Ringkasan\n");
  md.push("| Metrik | Hasil |");
  md.push("|---|---|");
  md.push(`| Enkripsi identik (TS == Ruby == vektor) | **${encIdentical}/${rows.length}** |`);
  md.push(`| Dekripsi identik (TS == Ruby) | **${decIdentical}/${rows.length}** |`);
  md.push(`| Kasus lulus penuh | **${passed}/${rows.length}** |`);
  md.push("");
  md.push(
    passed === rows.length
      ? "> ✅ **LULUS — 100% kasus identik di kedua implementasi.**\n"
      : `> ❌ **GAGAL — ${rows.length - passed} kasus tidak cocok.**\n`,
  );
  md.push("## Tabel per kasus\n");
  md.push("| # | ID | Cipher | Mode | TS == Ruby | TS == Vektor | Dekripsi | Catatan |");
  md.push("|---|---|---|---|---|---|---|---|");
  rows.forEach((r, i) => {
    md.push(
      `| ${i + 1} | \`${r.id}\` | ${r.cipher} | ${r.mode} | ${r.encMatch ? "✅" : "❌"} | ` +
        `${r.encMatch ? "✅" : "❌"} | ${r.decMatch ? "✅" : "❌"} | ${r.note.replace(/\|/g, "\\|")} |`,
    );
  });
  md.push("");
  md.push("## Perbandingan ciphertext\n");
  md.push("| ID | TypeScript | Ruby | Vektor resmi |");
  md.push("|---|---|---|---|");
  for (const r of rows) {
    md.push(`| \`${r.id}\` | \`${r.tsEnc}\` | \`${r.rbEnc}\` | \`${r.vector}\` |`);
  }
  md.push("");
  md.push("## Cara menjalankan ulang\n");
  md.push("```bash");
  md.push("pnpm --filter firdauscipher-web cross-verify");
  md.push("```");
  md.push("");
  writeFileSync(join(OUT_DIR, "cross-verify.md"), md.join("\n"));

  console.log("");
  console.log("Hasil ditulis ke:");
  console.log(`  ${join(OUT_DIR, "cross-verify.json")}`);
  console.log(`  ${join(OUT_DIR, "cross-verify.md")}`);

  if (passed !== rows.length) process.exit(1);
}

main();
