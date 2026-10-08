/**
 * screenshots.ts — S29/R1: ambil screenshot antarmuka tiap cipher.
 *
 * R1 laporan = "tampilan antarmuka program (print screen)". Skrip ini
 * mengotomasi pengambilan gambar supaya bukti R1 bisa diulang kapan saja
 * (bukan screenshot manual yang tidak reproducible).
 *
 * Cara pakai:
 *   1. jalankan app:  pnpm --filter firdauscipher-web dev
 *   2. jalankan skrip: pnpm --filter firdauscipher-web screenshots
 *
 * Keluaran: laporan/screenshot/ui-<slug>.png  (9 cipher, mode teks)
 *
 * CATATAN: memakai playwright-core + Chromium dari cache Playwright lokal
 * (tanpa mengunduh browser baru). Set CHROME_PATH untuk menunjuk binary lain.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const OUT = process.env.OUT_DIR ?? path.resolve(process.cwd(), "../../laporan/screenshot");
const CHROME =
  process.env.CHROME_PATH ??
  path.join(process.env.HOME ?? "", ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome");

/** Satu baris = satu cipher yang di-screenshot.
 *
 * plaintext & kunci memakai contoh klasik supaya hasilnya mudah diperiksa dosen.
 * `keys` boleh berisi <input> teks maupun <select> Radix (mis. Affine "a").
 */
type Case = {
  slug: string;
  label: string;
  text: string;
  keys: Record<string, string>;
};

/** File uji R2 (ada di packages/testfiles/) — 5 kategori wajib dosen. */
const TESTFILES = path.resolve(process.cwd(), "../../packages/testfiles");

const FILE_CASES: { slug: string; label: string; file: string; keys: Record<string, string> }[] = [
  { slug: "ext-vigenere", label: "c) Extended Vigenere (256 ASCII)", file: "contoh.png", keys: { key: "RAHASIA" } },
  { slug: "super", label: "g) Super Enkripsi", file: "contoh.sqlite", keys: { key1: "RAHASIA", key2: "ZEBRAS" } },
];

const CASES: Case[] = [
  { slug: "vigenere", label: "a) Vigenere Standard", text: "SERANG SUBUH SEKALI", keys: { key: "LEMON" } },
  { slug: "autokey", label: "b) Auto-Key Vigenere", text: "SERANG SUBUH SEKALI", keys: { key: "QUEENLY" } },
  { slug: "ext-vigenere", label: "c) Extended Vigenere (256 ASCII)", text: "Serang subuh! 123", keys: { key: "RAHASIA" } },
  { slug: "playfair", label: "d) Playfair", text: "TEMUI SAYA DI JEMBATAN", keys: { key: "MONARCHY" } },
  { slug: "affine", label: "e) Affine", text: "SERANG SUBUH SEKALI", keys: { a: "5", b: "8" } },
  { slug: "hill", label: "f) Hill", text: "SERANG SUBUH SEKALI", keys: { matrix: "6,24,1;13,16,10;20,17,15" } },
  { slug: "columnar", label: "Transposisi Kolom (bagian g)", text: "SERANG SUBUH SEKALI", keys: { key: "ZEBRAS" } },
  { slug: "super", label: "g) Super Enkripsi", text: "SERANG SUBUH SEKALI", keys: { key1: "RAHASIA", key2: "ZEBRAS" } },
  {
    slug: "enigma",
    label: "h) Enigma (Bonus)",
    text: "KRIPTOGRAFI",
    keys: { rotors: "I,II,III", ring: "AAA", position: "AAA", plugboard: "" },
  },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  if (!fs.existsSync(CHROME)) {
    throw new Error(
      `Chromium tidak ditemukan di ${CHROME}.\n` +
        `Pasang dengan: npx playwright install chromium\n` +
        `atau set CHROME_PATH ke binary Chrome/Chromium yang ada.`,
    );
  }

  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const report: Record<string, unknown>[] = [];

  for (const c of CASES) {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });

    // 1) pilih cipher lewat dropdown Radix
    await page.click('[aria-label="Pilih cipher"]');
    await page.waitForTimeout(300);
    await page.click(`[role="option"]:has-text("${c.label}")`);
    await page.waitForTimeout(600);

    // 2) isi kunci — <input> teks atau <select> Radix (Affine "a")
    for (const [k, v] of Object.entries(c.keys)) {
      const sel = `#key-${k}`;
      if ((await page.locator(sel).count()) === 0) continue;
      const isButton = await page.locator(sel).evaluate((el) => el.tagName === "BUTTON");
      if (isButton) {
        await page.click(sel);
        await page.waitForTimeout(250);
        await page.click(`[role="option"]:has-text("${v}")`);
        await page.waitForTimeout(250);
      } else {
        await page.fill(sel, v);
      }
    }

    // 3) isi plaintext
    await page.fill("#input-text", c.text);
    await page.waitForTimeout(300);

    // 4) klik Enkripsi — WAJIB teks persis. `has-text("Enkripsi")` juga cocok
    //    dengan chip "g) Super Enkripsi", jadi exact:true supaya tidak salah klik.
    await page.getByRole("button", { name: "Enkripsi", exact: true }).click();
    await page.waitForTimeout(2500);

    // 5) baca hasil. Hanya Alert "Gagal memproses" yang dihitung error;
    //    Alert "Perhatian" (mis. non-alfabet dibuang) BUKAN kegagalan.
    const got = await page.evaluate(() => {
      const out = document.querySelector<HTMLTextAreaElement>('[data-testid="result-output"]');
      const kind = document.querySelector('[data-testid="result-kind"]');
      const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
      const errBox = alerts.find((a) => /Gagal memproses/i.test(a.textContent ?? ""));
      return {
        output: out ? (out.value ?? out.textContent ?? "").trim() : null,
        kind: kind ? (kind.textContent ?? "").trim() : null,
        error: errBox ? (errBox.textContent ?? "").trim().slice(0, 200) : null,
      };
    });

    const file = path.join(OUT, `ui-${c.slug}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const status = got.error ? "GAGAL" : got.output ? "OK" : "KOSONG";
    console.log(`[${status}] ${c.label} -> ${got.kind ?? "-"} ${(got.output ?? got.error ?? "").slice(0, 60)}`);

    report.push({ slug: c.slug, label: c.label, plaintext: c.text, keys: c.keys, ...got, png: file });
  }

  // ---------------------------------------------------------------------------
  // Mode FILE (R2): bukti antarmuka untuk 5 kategori file wajib dosen.
  // ---------------------------------------------------------------------------
  for (const fc of FILE_CASES) {
    const src = path.join(TESTFILES, fc.file);
    if (!fs.existsSync(src)) {
      console.log(`[LEWAT] ${fc.file} tidak ada di ${TESTFILES}`);
      continue;
    }

    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });

    await page.click('[aria-label="Pilih cipher"]');
    await page.waitForTimeout(300);
    await page.click(`[role="option"]:has-text("${fc.label}")`);
    await page.waitForTimeout(600);

    for (const [k, v] of Object.entries(fc.keys)) {
      const sel = `#key-${k}`;
      if ((await page.locator(sel).count()) === 0) continue;
      await page.fill(sel, v);
    }

    // pindah ke tab "Mode File"
    await page.getByRole("tab", { name: "Mode File" }).click();
    await page.waitForTimeout(500);

    await page.setInputFiles("#file-input", src);
    await page.waitForTimeout(800);

    // klik tombol enkripsi file; unduhan ditangkap supaya tidak menggantung
    const dl = page.waitForEvent("download", { timeout: 20_000 }).catch(() => null);
    await page.getByRole("button", { name: /Enkripsi .* Unduh/ }).click();
    await dl;
    await page.waitForTimeout(2000);

    const got = await page.evaluate(() => {
      const name = document.querySelector('[data-testid="file-result-name"]');
      const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
      const errBox = alerts.find((a) => /Gagal|gagal/i.test(a.textContent ?? ""));
      return {
        output: name ? (name.textContent ?? "").trim() : null,
        error: errBox ? (errBox.textContent ?? "").trim().slice(0, 200) : null,
      };
    });

    const outFile = path.join(OUT, `file-${fc.slug}-${path.parse(fc.file).name}.png`);
    await page.screenshot({ path: outFile, fullPage: true });

    const status = got.error ? "GAGAL" : got.output ? "OK" : "KOSONG";
    console.log(`[${status}] FILE ${fc.file} (${fc.label}) -> ${got.output ?? got.error ?? "-"}`);

    report.push({
      mode: "file",
      slug: fc.slug,
      label: fc.label,
      file: fc.file,
      keys: fc.keys,
      ...got,
      png: outFile,
    });
  }

  const summary = path.join(OUT, "screenshots.json");
  fs.writeFileSync(summary, JSON.stringify(report, null, 2));

  await browser.close();

  const ok = report.filter((r) => !r.error && r.output).length;
  console.log(`\n${ok}/${report.length} screenshot berhasil -> ${OUT}`);
  console.log(`Ringkasan: ${summary}`);

  if (ok !== report.length) process.exit(1);
}

main().catch((e) => {
  console.error("GAGAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
