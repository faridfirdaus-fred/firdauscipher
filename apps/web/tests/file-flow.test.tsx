// @vitest-environment jsdom
/**
 * file-flow.test.tsx — uji alur file lengkap lewat GUI (S13–S15, Sp8, Sp9).
 *
 * Klaim utama tugas: file apa pun (termasuk biner dengan header) dienkripsi
 * menjadi `.dat`, lalu didekripsi kembali dan hasilnya byte-identical.
 *
 * Catatan desain yang ikut diuji: tombol "Enkripsi & Unduh" langsung mengunduh,
 * dan ada juga tombol "Unduh <nama>" untuk mengunduh ulang hasil terakhir.
 * Unduhan ditangkap di level Blob supaya byte yang benar-benar ditulis bisa
 * diperiksa, bukan hanya tampilan di layar.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FilePanel } from "@/components/file-panel";

let downloads: Array<{ name: string; bytes: Uint8Array }> = [];
let lastBlob: Uint8Array | null = null;

beforeEach(() => {
  downloads = [];
  lastBlob = null;

  // jsdom belum punya createObjectURL; kita simpan byte blob-nya.
  vi.stubGlobal("URL", {
    createObjectURL: (b: unknown) => {
      const bytes = (b as { _bytes?: Uint8Array })._bytes;
      if (bytes) lastBlob = bytes;
      return "blob:mock";
    },
    revokeObjectURL: () => {},
  });

  // Blob tiruan yang menyimpan byte-nya supaya bisa diperiksa.
  const RealBlob = globalThis.Blob;
  vi.stubGlobal(
    "Blob",
    class extends RealBlob {
      _bytes: Uint8Array;
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        const first = parts[0];
        this._bytes =
          first instanceof Uint8Array
            ? first
            : first instanceof ArrayBuffer
              ? new Uint8Array(first)
              : new TextEncoder().encode(String(first ?? ""));
      }
    },
  );

  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (lastBlob) downloads.push({ name: this.download, bytes: lastBlob });
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Uint8Array -> BlobPart tanpa keluhan tipe ArrayBufferLike. */
const asBlobPart = (b: Uint8Array): BlobPart =>
  b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

const upload = async (user: ReturnType<typeof userEvent.setup>, sel: string, file: File) => {
  await user.upload(document.querySelector(sel) as HTMLInputElement, file);
};

/** PNG asli: biner, ada byte NUL di header. */
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
]);

describe("Sp8/Sp9 — file biner: enkripsi .dat lalu dekripsi harus byte-identical", () => {
  for (const slug of ["ext-vigenere", "super", "columnar"]) {
    it(`${slug}: PNG -> .dat -> PNG byte-identik`, async () => {
      const user = userEvent.setup();
      render(<FilePanel slug={slug} />);

      // ---------- ENKRIPSI ----------
      await upload(user, "#file-input", new File([PNG], "gambar.png", { type: "image/png" }));
      await waitFor(() => expect(screen.getByText(/gambar\.png/)).toBeTruthy());

      await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));
      await waitFor(() =>
        expect(screen.getByTestId("file-result-name").textContent).toBe("gambar.png.dat"),
      );

      // Ambil byte .dat lewat tombol unduh ulang (unduhan deterministik).
      downloads = [];
      await user.click(screen.getByRole("button", { name: /Unduh gambar\.png\.dat/i }));
      expect(downloads).toHaveLength(1);
      const dat = downloads[0].bytes;
      expect(downloads[0].name).toBe("gambar.png.dat");
      expect(new TextDecoder().decode(dat.slice(0, 4)), "envelope KRI1").toBe("KRI1");
      // Ciphertext harus berbeda dari plaintext (bukti benar-benar dienkripsi).
      expect(Array.from(dat.slice(10, 10 + PNG.length))).not.toEqual(Array.from(PNG));

      // ---------- DEKRIPSI ----------
      await user.click(screen.getByRole("tab", { name: /Dekripsi File/i }));
      await upload(user, "#dat-input", new File([asBlobPart(dat)], "gambar.png.dat", { type: "application/octet-stream" }));
      await waitFor(() => expect(screen.getByText(/gambar\.png\.dat/)).toBeTruthy());

      await user.click(screen.getByRole("button", { name: /Dekripsi & Unduh File Asli/i }));
      await waitFor(
        () => expect(screen.getByTestId("file-result-name").textContent).toBe("gambar.png"),
        { timeout: 3000 },
      );

      downloads = [];
      await user.click(screen.getByRole("button", { name: /Unduh gambar\.png$/i }));
      expect(downloads).toHaveLength(1);
      expect(downloads[0].name, "nama & ekstensi asli dipulihkan (Sp9)").toBe("gambar.png");
      expect(Array.from(downloads[0].bytes), "byte harus identik (Sp8)").toEqual(Array.from(PNG));
    });
  }
});

describe("Sp9 — metadata & kunci dipulihkan dari header .dat", () => {
  it("data.db -> data.db.dat -> data.db, 256 byte berbeda semua", async () => {
    const user = userEvent.setup();
    render(<FilePanel slug="ext-vigenere" />);

    const db = new Uint8Array(256);
    for (let i = 0; i < 256; i++) db[i] = i;

    await upload(user, "#file-input", new File([db], "data.db", { type: "application/x-sqlite3" }));
    await waitFor(() => expect(screen.getByText(/data\.db/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));

    await waitFor(() => expect(screen.getByTestId("file-result-name").textContent).toBe("data.db.dat"));
    const header = screen.getByTestId("file-result-header").textContent ?? "";
    expect(header).toMatch(/Nama asli\s*:\s*data\.db/);
    expect(header).toMatch(/Ekstensi\s*:\s*db/);
    expect(header).toMatch(/Ukuran asli\s*:\s*256 byte/);

    downloads = [];
    await user.click(screen.getByRole("button", { name: /Unduh data\.db\.dat/i }));
    const dat = downloads[0].bytes;

    await user.click(screen.getByRole("tab", { name: /Dekripsi File/i }));
    await upload(user, "#dat-input", new File([asBlobPart(dat)], "data.db.dat", { type: "application/octet-stream" }));
    await waitFor(() => expect(screen.getByText(/data\.db\.dat/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Dekripsi & Unduh File Asli/i }));
    await waitFor(() => expect(screen.getByTestId("file-result-name").textContent).toBe("data.db"));

    downloads = [];
    await user.click(screen.getByRole("button", { name: /Unduh data\.db$/i }));
    expect(downloads[0].name).toBe("data.db");
    expect(Array.from(downloads[0].bytes)).toEqual(Array.from(db));
  });

  it("Affine: dekripsi .dat tanpa mengetik ulang a/b (kunci dari header)", async () => {
    const user = userEvent.setup();
    render(<FilePanel slug="affine" />);

    const data = new TextEncoder().encode("PESAN RAHASIA AFFINE");
    await upload(user, "#file-input", new File([data], "pesan.txt", { type: "text/plain" }));
    await waitFor(() => expect(screen.getByText(/pesan\.txt/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Enkripsi & Unduh/i }));
    await waitFor(() => expect(screen.getByTestId("file-result-name").textContent).toBe("pesan.txt.dat"));

    const header = screen.getByTestId("file-result-header").textContent ?? "";
    expect(header, "a & b tersimpan di header").toMatch(/"a"\s*:\s*"5"/);
    expect(header).toMatch(/"b"\s*:\s*"8"/);

    downloads = [];
    await user.click(screen.getByRole("button", { name: /Unduh pesan\.txt\.dat/i }));
    const dat = downloads[0].bytes;

    // Panel dekripsi tidak punya kolom a/b — kuncinya harus dari header.
    await user.click(screen.getByRole("tab", { name: /Dekripsi File/i }));
    expect(screen.queryByLabelText(/koefisien a/i)).toBeNull();
    await upload(user, "#dat-input", new File([asBlobPart(dat)], "pesan.txt.dat", { type: "application/octet-stream" }));
    await waitFor(() => expect(screen.getByText(/pesan\.txt\.dat/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Dekripsi & Unduh File Asli/i }));
    await waitFor(() => expect(screen.getByTestId("file-result-name").textContent).toBe("pesan.txt"));

    downloads = [];
    await user.click(screen.getByRole("button", { name: /Unduh pesan\.txt$/i }));
    // Affine hanya memproses A-Z, jadi spasi hilang (Sp2) — ini memang
    // perilaku yang diminta soal, dan UI memberi peringatan tentang itu.
    expect(new TextDecoder().decode(downloads[0].bytes)).toBe("pesanrahasiaaffine");
  });
});
