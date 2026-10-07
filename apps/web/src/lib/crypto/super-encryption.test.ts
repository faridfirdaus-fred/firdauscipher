import { describe, expect, it } from "vitest";

import { encryptColumnar } from "./columnar";
import { encryptExtVigenere } from "./extended-vigenere";
import { superDecrypt, superEncrypt } from "./super-encryption";

function pseudoRandomBytes(n: number, seed = 999): Uint8Array {
  const out = new Uint8Array(n);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out[i] = s % 256;
  }
  return out;
}

describe("Super Enkripsi (g)", () => {
  it("round-trip byte acak berhasil (dengan panjang asli)", () => {
    const data = pseudoRandomBytes(5000);
    const ct = superEncrypt(data, "kunci-vigenere", "ZEBRAS");
    const back = superDecrypt(ct, "kunci-vigenere", "ZEBRAS", data.length);
    expect(back).toEqual(data);
  });

  it("urutan enkripsi = Extended Vigenere lalu Transposisi Kolom", () => {
    const data = pseudoRandomBytes(64);
    const expected = encryptColumnar(encryptExtVigenere(data, "k1"), "k2");
    expect(superEncrypt(data, "k1", "k2")).toEqual(expected);
  });

  it("ciphertext beda dari hasil tiap cipher tunggal", () => {
    const data = pseudoRandomBytes(128);
    const ct = superEncrypt(data, "k1", "k2");
    expect(ct).not.toEqual(encryptExtVigenere(data, "k1"));
    expect(ct).not.toEqual(encryptColumnar(data, "k2"));
  });

  it("kunci salah -> hasil dekripsi tidak sama dengan plaintext", () => {
    const data = pseudoRandomBytes(200);
    const ct = superEncrypt(data, "k1", "k2");
    const wrong = superDecrypt(ct, "salah", "k2", data.length);
    expect(wrong).not.toEqual(data);
  });

  it("kunci kosong -> error jelas", () => {
    expect(() => superEncrypt(pseudoRandomBytes(10), "", "k2")).toThrow(/Kunci 1/);
    expect(() => superEncrypt(pseudoRandomBytes(10), "k1", "")).toThrow(/Kunci 2/);
  });

  it("panjang asli lebih besar dari hasil -> error jelas", () => {
    const ct = superEncrypt(pseudoRandomBytes(10), "k1", "k2");
    expect(() => superDecrypt(ct, "k1", "k2", 9999)).toThrow(/Panjang asli/);
  });
});
