import { describe, expect, it } from "vitest";

import { formatBytes, getExtension, hexPreview, looksLikeText } from "./file-utils";

describe("file-utils", () => {
  describe("looksLikeText", () => {
    it("teks ASCII -> true", () => {
      expect(looksLikeText(new TextEncoder().encode("Halo, ini teks biasa.\n"))).toBe(true);
    });

    it("byte NUL -> false (biner)", () => {
      expect(looksLikeText(new Uint8Array([72, 0, 105]))).toBe(false);
    });

    it("header PNG -> false", () => {
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
      expect(looksLikeText(png)).toBe(false);
    });

    it("byte kosong -> true", () => {
      expect(looksLikeText(new Uint8Array(0))).toBe(true);
    });

    it("byte acak -> false", () => {
      const rand = new Uint8Array(256);
      for (let i = 0; i < 256; i++) rand[i] = (i * 91 + 7) % 256;
      expect(looksLikeText(rand)).toBe(false);
    });
  });

  describe("getExtension", () => {
    it("mengambil ekstensi huruf kecil", () => {
      expect(getExtension("Gambar.JPG")).toBe("jpg");
      expect(getExtension("data.sqlite")).toBe("sqlite");
    });

    it("tanpa ekstensi -> string kosong", () => {
      expect(getExtension("README")).toBe("");
      expect(getExtension(".gitignore")).toBe("");
    });
  });

  describe("hexPreview", () => {
    it("menampilkan 64 byte pertama sebagai hex berjarak", () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      expect(hexPreview(bytes)).toBe("89 50 4e 47");
    });

    it("membatasi jumlah byte", () => {
      const bytes = new Uint8Array(200).fill(0xab);
      expect(hexPreview(bytes).split(" ")).toHaveLength(64);
    });
  });

  describe("formatBytes", () => {
    it("memformat satuan", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(2048)).toBe("2.0 KB");
      expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
    });
  });
});
