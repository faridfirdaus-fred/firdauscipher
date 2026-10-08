// @vitest-environment jsdom
/**
 * docs.test.tsx — uji halaman /docs dan navigasi situs.
 *
 * Halaman dokumentasi harus memuat panduan pemakaian DAN pemetaan huruf soal
 * (a–h) yang sengaja tidak ditampilkan di antarmuka utama.
 */

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DocsPage from "@/app/docs/page";
import { SiteNav } from "@/components/site-nav";
import { CIPHERS, cipherLabelWithLetter } from "@/lib/crypto";
import { GITHUB_URL, GITHUB_USER } from "@/lib/site";

// next/navigation butuh router; usePathname cukup distub.
vi.mock("next/navigation", () => ({
  usePathname: () => "/docs",
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("halaman /docs", () => {
  it("memuat judul dan langkah pemakaian", () => {
    render(<DocsPage />);
    expect(screen.getByRole("heading", { name: /Cara pakai/i })).toBeTruthy();
    expect(screen.getAllByText(/Mode Teks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mode File/i).length).toBeGreaterThan(0);
  });

  it("menampilkan pemetaan huruf soal untuk semua cipher", () => {
    render(<DocsPage />);
    for (const c of CIPHERS) {
      // Nama + huruf soal (mis. "g) Super Enkripsi") harus muncul di docs.
      expect(
        screen.getByText(cipherLabelWithLetter(c)),
        `docs tidak memuat ${c.slug}`,
      ).toBeTruthy();
    }
  });
});

describe("navbar", () => {
  it("memuat nama aplikasi, tautan Home & Docs, dan tombol GitHub", () => {
    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "FirdausCipher" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Docs" })).toBeTruthy();

    const github = screen.getByRole("link", { name: /GitHub/i }) as HTMLAnchorElement;
    expect(github.href).toBe(GITHUB_URL);
    expect(GITHUB_URL).toContain(GITHUB_USER);
  });
});
