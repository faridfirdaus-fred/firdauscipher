import { describe, expect, it } from "vitest";

import { decryptAffine, encryptAffine, isValidA, VALID_A } from "./affine";

describe("Affine (e)", () => {
  it("a=5, b=8, AFFINECIPHER -> IHHWVCSWFRCP", () => {
    expect(encryptAffine("AFFINECIPHER", 5, 8)).toBe("ihhwvcswfrcp");
  });

  it("round-trip mengembalikan plaintext", () => {
    const pt = "AFFINECIPHER";
    expect(decryptAffine(encryptAffine(pt, 5, 8), 5, 8).toUpperCase()).toBe(pt);
  });

  it("a=4 ditolak dengan pesan menyebut gcd", () => {
    expect(() => encryptAffine("HELLO", 4, 8)).toThrow(/gcd\(4, 26\) = 2/);
  });

  it("a=13 ditolak", () => {
    expect(() => encryptAffine("HELLO", 13, 0)).toThrow(/tidak valid/);
  });

  it("semua 12 nilai a valid bisa dipakai bolak-balik", () => {
    for (const a of VALID_A) {
      const ct = encryptAffine("KRIPTOGRAFI", a, 3);
      expect(decryptAffine(ct, a, 3).toUpperCase()).toBe("KRIPTOGRAFI");
    }
  });

  it("isValidA benar untuk 12 nilai valid", () => {
    for (const a of VALID_A) expect(isValidA(a)).toBe(true);
    for (const a of [0, 2, 4, 6, 13, 26]) expect(isValidA(a)).toBe(false);
  });

  it("b di luar 0-25 ditolak", () => {
    expect(() => encryptAffine("HELLO", 5, 26)).toThrow(/b = 26/);
  });

  it("membuang non-alfabet", () => {
    expect(encryptAffine("Affine Cipher!", 5, 8)).toBe("ihhwvcswfrcp");
  });
});
