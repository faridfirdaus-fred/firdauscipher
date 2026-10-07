// @vitest-environment jsdom
/**
 * ui.test.tsx — uji interaksi GUI nyata dengan Testing Library (S16, S17).
 *
 * Lingkungan jsdom diminta khusus di file ini; `vitest.config.ts` default
 * memakai `node` supaya crypto core teruji tanpa DOM (§3.1 aturan 5).
 *
 * Komponen React benar-benar dirender, tombol benar-benar diklik, dan hasilnya
 * diperiksa terhadap nilai yang sudah diverifikasi test vector. jsdom tidak
 * punya Worker, jadi jalur fallback `useCipherWorker` (main thread) ikut teruji.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilePanel } from "@/components/file-panel";
import { TextPanel } from "@/components/text-panel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const output = () => screen.getByTestId("result-output") as HTMLTextAreaElement;
/** Semua pesan Alert (peringatan/error) sebagai satu string. */
const alerts = () => screen.queryAllByRole("alert").map((n) => n.textContent ?? "").join(" | ");

describe("TextPanel — enkripsi/dekripsi teks lewat GUI", () => {
  it("Auto-Key Vigenere: ATTACKATDAWN + QUEENLY -> QNXEPVYTWTWP (vektor buku)", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="autokey" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "ATTACKATDAWN");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("qnxepvytwtwp"));
  });

  it("Vigenere standard: ATTACKATDAWN + LEMON -> LXFOPVEFRNHR (vektor buku)", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="vigenere" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "ATTACKATDAWN");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("lxfopvefrnhr"));
  });

  it("semua cipher kata-sandi langsung bisa dipakai tanpa mengisi kunci (regresi)", async () => {
    // Bug yang dicegah: field tanpa defaultValue membuat form error saat
    // tombol Enkripsi diklik tanpa menyentuh kunci.
    const user = userEvent.setup();
    for (const slug of ["vigenere", "autokey", "ext-vigenere", "playfair"]) {
      cleanup();
      render(<TextPanel slug={slug} />);
      await user.type(screen.getByLabelText(/Plaintext/i), "SERANG");
      await user.click(screen.getByRole("button", { name: "Enkripsi" }));
      await waitFor(() => expect(alerts()).not.toMatch(/wajib|kosong|harus/i));
    }
  });

  it("Affine: default a=5 b=8, AFFINECIPHER -> ihhwvcswfrcp", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="affine" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "AFFINECIPHER");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("ihhwvcswfrcp"));
  });

  it("Playfair: MONARCHY + INSTRUMENTS -> gatlmzclrqxa", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="playfair" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "INSTRUMENTS");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("gatlmzclrqxa"));
  });

  it("Hill: matriks 2x2 diketik lewat GUI, HELP -> hiat", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="hill" />);

    const matrix = screen.getByLabelText(/Matriks kunci/i);
    await user.clear(matrix);
    await user.type(matrix, "3,3;2,5");

    await user.type(screen.getByLabelText(/Plaintext/i), "HELP");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("hiat"));
  });

  it("Hill: matriks 3x3 default, ACT -> poh", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="hill" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "ACT");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("poh"));
  });

  it("Enigma: kunci default -> AAAAA menjadi bdzgo", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="enigma" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "AAAAA");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(output().value).toBe("bdzgo"));
  });

  it("menampilkan peringatan saat non-alfabet dibuang (Sp2)", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="vigenere" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "SERANG SUBUH, SEKALI! 05:00");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(alerts()).toMatch(/non-alfabet/i));
  });

  it("Extended Vigenere menandai hasil sebagai base64 (Sp4)", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="ext-vigenere" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "Halo");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(screen.getByTestId("result-kind").textContent).toMatch(/base64/i));
  });

  it("Tombol Tukar memindahkan hasil ke input dan mengganti arah", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="affine" />);

    await user.type(screen.getByLabelText(/Plaintext/i), "AFFINECIPHER");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));
    await waitFor(() => expect(output().value).toBe("ihhwvcswfrcp"));

    await user.click(screen.getByRole("button", { name: /Tukar/i }));

    await waitFor(() => {
      const input = screen.getByLabelText(/Ciphertext/i) as HTMLTextAreaElement;
      expect(input.value).toBe("ihhwvcswfrcp");
    });
  });

  it("dekripsi mengembalikan plaintext asli (Enigma, auto-key, Affine)", async () => {
    const user = userEvent.setup();
    for (const [slug, plain, cipherText] of [
      ["enigma", "AAAAA", "bdzgo"],
      ["autokey", "ATTACKATDAWN", "qnxepvytwtwp"],
      ["affine", "AFFINECIPHER", "ihhwvcswfrcp"],
    ] as const) {
      cleanup();
      render(<TextPanel slug={slug} />);
      await user.type(screen.getByLabelText(/Plaintext/i), plain);
      await user.click(screen.getByRole("button", { name: "Enkripsi" }));
      await waitFor(() => expect(output().value).toBe(cipherText));
      await user.click(screen.getByRole("button", { name: /Tukar/i }));
      await user.click(screen.getByRole("button", { name: "Dekripsi" }));
      await waitFor(() => expect(output().value).toBe(plain.toLowerCase()));
    }
  });

  it("validasi kunci Hill: matriks singular ditolak dengan pesan det", async () => {
    const user = userEvent.setup();
    render(<TextPanel slug="hill" />);

    const matrix = screen.getByLabelText(/Matriks kunci/i);
    await user.clear(matrix);
    await user.type(matrix, "1,2;2,4"); // det = 0

    await user.type(screen.getByLabelText(/Plaintext/i), "TEST");
    await user.click(screen.getByRole("button", { name: "Enkripsi" }));

    await waitFor(() => expect(alerts()).toMatch(/det|determinan/i));
  });
});

describe("FilePanel — alur file .dat lewat GUI", () => {
  it("tombol enkripsi nonaktif sebelum file dipilih (cegah error)", async () => {
    render(<FilePanel slug="ext-vigenere" />);

    const button = screen.getByRole("button", { name: /Enkripsi & Unduh/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(alerts()).toBe("");
  });

  it("file TEKS -> .dat dengan header lengkap (nama, ekstensi, mode binary)", async () => {
    const user = userEvent.setup();
    render(<FilePanel slug="ext-vigenere" />);

    const file = new File([new TextEncoder().encode("Halo FirdausCipher!")], "catatan.txt", {
      type: "text/plain",
    });
    await user.upload(document.querySelector("#file-input") as HTMLInputElement, file);
    await waitFor(() => expect(screen.getByText(/catatan\.txt/)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));

    await waitFor(() => {
      const header = screen.getByTestId("file-result-header").textContent ?? "";
      expect(header).toMatch(/Nama asli\s*:\s*catatan\.txt/);
      expect(header).toMatch(/Ekstensi\s*:\s*txt/);
      expect(header).toMatch(/Mode payload\s*:\s*binary/);
      expect(header).toMatch(/Ukuran asli\s*:\s*19 byte/);
      expect(screen.getByTestId("file-result-name").textContent).toBe("catatan.txt.dat");
      expect(screen.getByTestId("file-warnings").textContent).toBe("");
    });
  });

  it("file BINER (PNG) dengan Ext Vigenere: mode binary, tanpa peringatan", async () => {
    const user = userEvent.setup();
    render(<FilePanel slug="ext-vigenere" />);

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 13, 1, 2, 3, 4]);
    const file = new File([png], "gambar.png", { type: "image/png" });
    await user.upload(document.querySelector("#file-input") as HTMLInputElement, file);
    await waitFor(() => expect(screen.getByText(/gambar\.png/)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));

    await waitFor(() => {
      const header = screen.getByTestId("file-result-header").textContent ?? "";
      expect(header).toMatch(/Mode payload\s*:\s*binary/);
      expect(header).toMatch(/Ukuran asli\s*:\s*12 byte/);
      expect(screen.getByTestId("file-result-name").textContent).toBe("gambar.png.dat");
    });
  });

  it("memberi PERINGATAN KERAS saat cipher 26 huruf dipakai pada file biner", async () => {
    const user = userEvent.setup();
    render(<FilePanel slug="vigenere" />);

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 13, 1, 2, 3, 4]);
    const file = new File([png], "gambar.png", { type: "image/png" });
    await user.upload(document.querySelector("#file-input") as HTMLInputElement, file);
    await waitFor(() => expect(screen.getByText(/gambar\.png/)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));

    await waitFor(() => {
      expect(screen.getByTestId("file-warnings").textContent).toMatch(/TIDAK BISA direstorasi/i);
    });
  });
});
