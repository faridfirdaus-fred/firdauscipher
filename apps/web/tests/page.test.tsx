// @vitest-environment jsdom
/**
 * page.test.tsx — uji halaman utama (S16).
 *
 * Verifikasi S16: "semua tab bisa diklik, tidak ada error console".
 * Halaman asli (`src/app/page.tsx`) dirender, tiap cipher dipilih lewat daftar
 * chip, dan console diintip supaya error apa pun langsung terlihat.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { CIPHERS, cipherLabel } from "@/lib/crypto";

// jsdom belum punya API ini, padahal Radix Select memerlukannya.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture ?? (() => false);
Element.prototype.setPointerCapture = Element.prototype.setPointerCapture ?? (() => {});
Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture ?? (() => {});

let consoleErrors: string[] = [];
let consoleWarns: string[] = [];

beforeEach(() => {
  consoleErrors = [];
  consoleWarns = [];
  vi.spyOn(console, "error").mockImplementation((...args) => {
    consoleErrors.push(args.map(String).join(" "));
  });
  vi.spyOn(console, "warn").mockImplementation((...args) => {
    consoleWarns.push(args.map(String).join(" "));
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Pilih cipher lewat daftar chip (radiogroup). */
async function pilihCipher(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("radio", { name }));
}

describe("S16 — halaman utama", () => {
  it("menampilkan judul, daftar cipher, dan dua mode (teks/file)", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Enkripsi & dekripsi cipher klasik/i })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: /Pilih cipher/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Mode Teks" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Mode File" })).toBeTruthy();
  });

  it("daftar cipher berisi seluruh cipher dari registry, tanpa dropdown", async () => {
    render(<Home />);

    for (const c of CIPHERS) {
      expect(
        screen.getByRole("radio", { name: cipherLabel(c) }),
        `pilihan ${c.slug} tidak ada`,
      ).toBeTruthy();
    }

    // Tidak boleh ada dropdown pemilih cipher lagi.
    expect(screen.queryByRole("combobox", { name: /Pilih cipher/i })).toBeNull();
  });

  it("nama cipher di UI tidak memakai huruf soal (a-h)", () => {
    for (const c of CIPHERS) {
      expect(cipherLabel(c)).not.toMatch(/^[a-h]\)/);
      expect(cipherLabel(c)).not.toMatch(/bagian [a-h]/);
    }
  });

  it("setiap cipher bisa dipilih dan panelnya tampil tanpa error console", async () => {
    const user = userEvent.setup();
    render(<Home />);

    for (const c of CIPHERS) {
      await pilihCipher(user, cipherLabel(c));
      // Panel teks selalu punya kolom Plaintext + tombol Enkripsi.
      await waitFor(() => {
        expect(screen.getByLabelText(/Plaintext/i), `${c.slug} tidak menampilkan input`).toBeTruthy();
        expect(screen.getByRole("button", { name: "Enkripsi" })).toBeTruthy();
      });
      expect(screen.getByText(c.description)).toBeTruthy();
    }

    expect(consoleErrors, `console.error terpanggil:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  it("pindah ke Mode File menampilkan input file untuk setiap cipher", async () => {
    const user = userEvent.setup();
    render(<Home />);

    for (const c of CIPHERS) {
      await pilihCipher(user, cipherLabel(c));
      await user.click(screen.getByRole("tab", { name: "Mode File" }));
      await waitFor(() => {
        expect(document.querySelector("#file-input"), `${c.slug} tanpa input file`).toBeTruthy();
      });
      await user.click(screen.getByRole("tab", { name: "Mode Teks" }));
    }

    expect(consoleErrors, `console.error terpanggil:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  it("Enigma menampilkan konfigurasi rotornya, bukan kolom kunci biasa", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await pilihCipher(user, "Enigma (Bonus)");

    await waitFor(() => {
      expect(screen.getByLabelText(/Rotor \(kiri-tengah-kanan\)/i)).toBeTruthy();
      expect(screen.getByLabelText(/Ring setting/i)).toBeTruthy();
      expect(screen.getByLabelText(/Posisi awal/i)).toBeTruthy();
      expect(screen.getByLabelText(/Plugboard/i)).toBeTruthy();
    });
    // Reflector adalah dropdown (Radix Select), bukan input teks biasa.
    expect(screen.getByText("Reflector")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /Reflector/i })).toBeTruthy();
  });

  it("Hill menampilkan kolom matriks kunci", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await pilihCipher(user, "Hill");

    await waitFor(() => expect(screen.getByLabelText(/Matriks kunci/i)).toBeTruthy());
  });
});
