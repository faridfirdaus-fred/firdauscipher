import { describe, expect, it } from "vitest";

import { decryptExtVigenere, encryptExtVigenere } from "./extended-vigenere";

/** Byte acak deterministik (tanpa crypto.getRandomValues supaya test reproducible). */
function pseudoRandomBytes(n: number, seed = 12345): Uint8Array {
  const out = new Uint8Array(n);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out[i] = s % 256;
  }
  return out;
}

describe("Extended Vigenere (c)", () => {
  it("round-trip 10 KB byte acak 0-255 kembali identik", () => {
    const bytes = pseudoRandomBytes(10 * 1024);
    const ct = encryptExtVigenere(bytes, "kunci rahasia");
    expect(ct).not.toEqual(bytes);
    expect(decryptExtVigenere(ct, "kunci rahasia")).toEqual(bytes);
  });

  it("semua nilai byte 0-255 bisa diproses", () => {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    const ct = encryptExtVigenere(all, "K");
    expect(decryptExtVigenere(ct, "K")).toEqual(all);
  });

  it("byte 0x00 dan 0xFF tidak hilang (Sp8)", () => {
    const bytes = new Uint8Array([0, 255, 0, 255]);
    const ct = encryptExtVigenere(bytes, "AB");
    expect(ct).toHaveLength(4);
    expect(decryptExtVigenere(ct, "AB")).toEqual(bytes);
  });

  it("tanpa sanitasi: header file asli ikut diproses", () => {
    // Header PNG: 89 50 4E 47 0D 0A 1A 0A
    const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ct = encryptExtVigenere(header, "KEY");
    expect(ct).not.toEqual(header);
    expect(decryptExtVigenere(ct, "KEY")).toEqual(header);
  });

  it("kunci kosong -> error", () => {
    expect(() => encryptExtVigenere(new Uint8Array([1, 2]), "")).toThrow(/kosong/);
  });

  it("data kosong -> hasil kosong", () => {
    expect(encryptExtVigenere(new Uint8Array(0), "K")).toHaveLength(0);
  });

  it("kunci Uint8Array juga diterima", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const key = new Uint8Array([10, 20]);
    expect(decryptExtVigenere(encryptExtVigenere(bytes, key), key)).toEqual(bytes);
  });
});
