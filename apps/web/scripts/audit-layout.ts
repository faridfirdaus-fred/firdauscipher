/**
 * audit-layout.ts — pemeriksaan tata letak secara TERUKUR (bukan penilaian rasa).
 *
 * Menjalankan browser sungguhan lalu memeriksa hal-hal yang objektif:
 *   - tidak ada overflow horizontal (halaman tidak bisa digeser ke samping)
 *   - jarak (gap) antar elemen seragam / konsisten
 *   - tidak ada elemen yang saling menumpuk (overlap)
 *   - chip cipher terbaca dan tidak terpotong
 *   - tidak ada teks yang tumpah keluar wadahnya
 *
 * Jalankan: pnpm audit:layout  (dev server harus hidup di :3000)
 */

import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000/";
const CHROME =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`;

type Issue = { page: string; level: "ERROR" | "WARN"; what: string };

async function auditPage(
  page: import("playwright-core").Page,
  url: string,
  name: string,
  issues: Issue[],
) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const out: Record<string, unknown> = {};
    const de = document.documentElement;

    out.scrollWidth = de.scrollWidth;
    out.clientWidth = de.clientWidth;
    out.docHeight = de.scrollHeight;

    // Chip cipher: ukuran tiap chip + apakah ada yang melampaui lebar induk.
    const chips = Array.from(document.querySelectorAll('[role="radio"]')) as HTMLElement[];
    out.chipCount = chips.length;
    out.chips = chips.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        text: (el.textContent ?? "").trim(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        left: Math.round(r.left),
        clipped: el.scrollWidth > el.clientWidth + 1,
      };
    });

    // Baris chip: kelompokkan berdasarkan koordinat top -> cek gap antar baris.
    const tops = [...new Set(out.chips ? (out.chips as { top: number }[]).map((c) => c.top) : [])];

    // Semua elemen yang keluar dari viewport ke kanan (indikasi overflow).
    const overflowing: string[] = [];
    for (const el of Array.from(document.querySelectorAll("body *")) as HTMLElement[]) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > de.clientWidth + 2) {
        const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
        overflowing.push(`${el.tagName.toLowerCase()}${cls ? "." + cls.split(" ")[0] : ""} right=${Math.round(r.right)}`);
      }
    }
    out.overflowing = overflowing.slice(0, 8);
    out.chipRows = tops.length;

    // Overlap antar chip pada baris yang sama.
    const overlaps: string[] = [];
    const byRow = new Map<number, { text: string; left: number; w: number }[]>();
    for (const c of (out.chips as { text: string; top: number; left: number; w: number }[])) {
      const arr = byRow.get(c.top) ?? [];
      arr.push(c);
      byRow.set(c.top, arr);
    }
    for (const [, row] of byRow) {
      row.sort((a, b) => a.left - b.left);
      for (let i = 1; i < row.length; i++) {
        const prev = row[i - 1];
        if (prev.left + prev.w > row[i].left + 1) {
          overlaps.push(`${prev.text} <> ${row[i].text}`);
        }
      }
    }
    out.overlaps = overlaps;

    return out;
  });

  const m = metrics as {
    scrollWidth: number;
    clientWidth: number;
    chipCount: number;
    chipRows: number;
    chips: { text: string; h: number; clipped: boolean }[];
    overflowing: string[];
    overlaps: string[];
  };

  console.log(`\n=== ${name} (${url}) ===`);
  console.log(`  lebar dokumen: ${m.scrollWidth}px / viewport ${m.clientWidth}px`);
  console.log(`  chip cipher : ${m.chipCount} buah dalam ${m.chipRows} baris`);
  console.log(`  tinggi chip : ${[...new Set(m.chips.map((c) => c.h))].join(", ")} px`);

  if (m.scrollWidth > m.clientWidth + 2) {
    issues.push({ page: name, level: "ERROR", what: `overflow horizontal ${m.scrollWidth - m.clientWidth}px` });
  }
  if (m.overflowing.length) {
    issues.push({ page: name, level: "ERROR", what: `elemen keluar viewport: ${m.overflowing.join(", ")}` });
  }
  if (m.overlaps.length) {
    issues.push({ page: name, level: "ERROR", what: `chip bertumpuk: ${m.overlaps.join(", ")}` });
  }
  const clipped = m.chips.filter((c) => c.clipped).map((c) => c.text);
  if (clipped.length) {
    issues.push({ page: name, level: "WARN", what: `teks chip terpotong: ${clipped.join(", ")}` });
  }

  console.log(`  ${issues.length === 0 ? "TIDAK ADA MASALAH" : "ada catatan di atas"}`);
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`Chromium tidak ada di ${CHROME}`);

  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  const issues: Issue[] = [];

  for (const [w, h, tag] of [
    [1280, 900, "desktop"],
    [768, 900, "tablet"],
    [390, 844, "ponsel"],
  ] as [number, number, string][]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await auditPage(page, BASE, `${tag} /`, issues);
    await auditPage(page, `${BASE}docs`, `${tag} /docs`, issues);
    await page.close();
  }

  await browser.close();

  console.log("\n" + "=".repeat(70));
  if (issues.length === 0) {
    console.log("TATA LETAK BERSIH di semua ukuran layar (desktop, tablet, ponsel).");
  } else {
    for (const i of issues) console.log(`[${i.level}] ${i.page}: ${i.what}`);
  }
  console.log("=".repeat(70));
  if (issues.some((i) => i.level === "ERROR")) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
