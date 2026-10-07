import { describe, expect, it } from "vitest";

import { decryptAutoKey, decryptVigenere, encryptAutoKey, encryptVigenere } from "./vigenere";

describe("Vigenere standard (a)", () => {
  it("ATTACKATDAWN + LEMON -> LXFOPVEFRNHR (vektor klasik)", () => {
    expect(encryptVigenere("ATTACKATDAWN", "LEMON")).toBe("lxfopvefrnhr");
  });

  it("ATTACKATDAWN + QUEENLY -> QNXEPVYXEAA (kunci lebih panjang dari plaintext)", () => {
    // NB: QNXEPVYTWTWP adalah hasil AUTO-KEY, bukan Vigenere standard.
    expect(encryptVigenere("ATTACKATDAWN", "QUEENLY")).toBe("qnxepvyjxeaa");
  });

  it("round-trip mengembalikan plaintext (huruf besar)", () => {
    const plain = "ATTACKATDAWN";
    const ct = encryptVigenere(plain, "LEMON");
    expect(decryptVigenere(ct, "LEMON").toUpperCase()).toBe(plain);
  });

  it("membuang non-alfabet (Sp2)", () => {
    expect(encryptVigenere("Attack at dawn!", "LEMON")).toBe("lxfopvefrnhr");
  });

  it("kunci lebih panjang dari plaintext", () => {
    expect(decryptVigenere(encryptVigenere("HI", "LEMON"), "LEMON").toUpperCase()).toBe("HI");
  });

  it("kunci kosong -> error jelas", () => {
    expect(() => encryptVigenere("HELLO", "")).toThrow(/Kunci kosong/);
    expect(() => encryptVigenere("HELLO", "123")).toThrow(/Kunci kosong/);
  });

  it("plaintext kosong -> hasil kosong", () => {
    expect(encryptVigenere("", "LEMON")).toBe("");
  });
});

describe("Auto-Key Vigenere (b)", () => {
  it("ATTACKATDAWN + QUEENLY -> QNXEPVYTWTWP (vektor klasik)", () => {
    // Auto-key dengan kunci QUEENLY pada ATTACKATDAWN menghasilkan QNXEPVYTWTWP.
    expect(encryptAutoKey("ATTACKATDAWN", "QUEENLY")).toBe("qnxepvytwtwp");
  });

  it("dekripsi sekuensial mengembalikan plaintext", () => {
    const plain = "ATTACKATDAWN";
    const ct = encryptAutoKey(plain, "QUEENLY");
    expect(decryptAutoKey(ct, "QUEENLY").toUpperCase()).toBe(plain);
  });

  it("round-trip untuk plaintext panjang (kunci > plaintext tidak masalah)", () => {
    const plain = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG";
    const ct = encryptAutoKey(plain, "KEY");
    expect(decryptAutoKey(ct, "KEY").toUpperCase()).toBe(plain);
  });

  it("kunci kosong -> error", () => {
    expect(() => encryptAutoKey("HELLO", "")).toThrow(/Kunci kosong/);
  });
});
