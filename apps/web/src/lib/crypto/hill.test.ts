import { describe, expect, it } from "vitest";

import { decryptHill, encryptHill, parseMatrix, validateHillKey } from "./hill";

const KEY3 = [
  [6, 24, 1],
  [13, 16, 10],
  [20, 17, 15],
];

describe("Hill (f)", () => {
  it("kunci 3x3 standar, ACT -> POH", () => {
    expect(encryptHill("ACT", KEY3)).toBe("poh");
  });

  it("round-trip dengan kunci 3x3", () => {
    const pt = "ATTACKATDAWN";
    const ct = encryptHill(pt, KEY3);
    // Panjang kelipatan 3 -> tanpa filler tambahan
    expect(ct).toHaveLength(12);
    expect(decryptHill(ct, KEY3).toUpperCase()).toBe(pt);
  });

  it("padding filler X kalau panjang bukan kelipatan n", () => {
    // "HELLO" (5 huruf) -> 6 huruf dengan filler X
    const ct = encryptHill("HELLO", KEY3);
    expect(ct).toHaveLength(6);
    expect(decryptHill(ct, KEY3).toUpperCase()).toBe("HELLOX");
  });

  it("kunci 2x2 jalan", () => {
    const key2 = [
      [3, 3],
      [2, 5],
    ];
    const ct = encryptHill("HELP", key2);
    expect(ct).toHaveLength(4);
    expect(decryptHill(ct, key2).toUpperCase()).toBe("HELP");
  });

  it("matriks singular ditolak dengan pesan menyebut det", () => {
    const singular = [
      [1, 2],
      [3, 4],
    ];
    expect(() => validateHillKey(singular)).toThrow(/det = 24/);
    expect(() => encryptHill("HELLO", singular)).toThrow(/tidak akan bisa didekripsi/);
  });

  it("matriks singular (det kelipatan 13) ditolak", () => {
    expect(() => validateHillKey([[1, 1], [1, 14]])).toThrow(/gcd/);
  });

  it("ukuran selain 2x2 / 3x3 ditolak", () => {
    expect(() => validateHillKey([[1]])).toThrow(/harus 2×2 atau 3×3/);
  });

  it("parseMatrix dari teks", () => {
    expect(parseMatrix("6,24,1;13,16,10;20,17,15")).toEqual(KEY3);
    expect(parseMatrix("6 24 1 / 13 16 10 / 20 17 15")).toEqual(KEY3);
  });

  it("parseMatrix menolak elemen non-angka", () => {
    expect(() => parseMatrix("a,b;c,d")).toThrow(/bukan bilangan bulat/);
  });
});
