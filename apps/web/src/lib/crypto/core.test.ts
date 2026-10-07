import { describe, expect, it } from "vitest";

import {
  bytesToHex,
  bytesToLatin1,
  detMod,
  fromBase64,
  gcd,
  invertMatrixMod,
  latin1ToBytes,
  mod,
  modInverse,
  numToChar,
  padBlock,
  sanitize26,
  toBase64,
} from "./core";

describe("sanitize26", () => {
  it("membuang non-alfabet dan mengubah ke huruf besar", () => {
    expect(sanitize26("Hello, World! 123")).toBe("HELLOWORLD");
  });

  it("mempertahankan hanya A-Z", () => {
    expect(sanitize26("a-b_c.d")).toBe("ABCD");
  });

  it("string tanpa huruf -> string kosong", () => {
    expect(sanitize26("123 !?@")).toBe("");
  });
});

describe("mod", () => {
  it("selalu non-negatif", () => {
    expect(mod(-1, 26)).toBe(25);
    expect(mod(-27, 26)).toBe(25);
    expect(mod(27, 26)).toBe(1);
  });
});

describe("gcd", () => {
  it("menghitung fpb", () => {
    expect(gcd(4, 26)).toBe(2);
    expect(gcd(5, 26)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
  });
});

describe("modInverse", () => {
  // 12 nilai a yang valid untuk modulus 26.
  const valid = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

  it.each(valid)("modInverse(%i, 26) menghasilkan invers yang benar", (a) => {
    const inv = modInverse(a, 26);
    expect(mod(a * inv, 26)).toBe(1);
  });

  it("melempar error kalau gcd(a, 26) != 1", () => {
    expect(() => modInverse(2, 26)).toThrow(/gcd\(2, 26\) = 2/);
    expect(() => modInverse(4, 26)).toThrow(/tidak ada invers/);
    expect(() => modInverse(13, 26)).toThrow(/tidak ada invers/);
    expect(() => modInverse(0, 26)).toThrow(/tidak ada invers/);
  });
});

describe("base64", () => {
  it("round-trip byte acak 0-255", () => {
    const bytes = new Uint8Array(1000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });

  it("cocok dengan referensi btoa untuk teks ASCII", () => {
    const s = "FirdausCipher!";
    const bytes = latin1ToBytes(s);
    expect(toBase64(bytes)).toBe(btoa(s));
  });

  it("mengabaikan karakter non-base64", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    expect(fromBase64(toBase64(bytes) + "\n ")).toEqual(bytes);
  });

  it("panjang 0, 1, 2 byte (kasus padding)", () => {
    for (const len of [0, 1, 2, 3, 4]) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = 200 + i;
      expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    }
  });
});

describe("konversi byte", () => {
  it("latin1 round-trip termasuk byte 0x00 dan 0xFF", () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 254, 255]);
    expect(latin1ToBytes(bytesToLatin1(bytes))).toEqual(bytes);
  });

  it("bytesToHex", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});

describe("matriks", () => {
  it("detMod matriks 2x2", () => {
    expect(detMod([[1, 2], [3, 4]], 26)).toBe(mod(-2, 26));
  });

  it("detMod matriks 3x3 kunci Hill standar", () => {
    expect(detMod([[6, 24, 1], [13, 16, 10], [20, 17, 15]], 26)).toBe(25);
  });

  it("invertMatrixMod menghasilkan identitas saat dikalikan", () => {
    const m = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
    const inv = invertMatrixMod(m, 26);
    // A * A^-1 harus jadi matriks identitas mod 26
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) sum += m[i][k] * inv[k][j];
        expect(mod(sum, 26)).toBe(i === j ? 1 : 0);
      }
    }
  });

  it("invertMatrixMod melempar error menyebut det kalau singular", () => {
    expect(() => invertMatrixMod([[1, 2], [3, 4]], 26)).toThrow(/det = 24/);
  });
});

describe("padBlock", () => {
  it("menambah filler sampai kelipatan n", () => {
    const padded = padBlock(new Uint8Array([1, 2, 3]), 2, 88);
    expect(Array.from(padded)).toEqual([1, 2, 3, 88]);
  });

  it("tidak menambah apa pun kalau sudah kelipatan", () => {
    const padded = padBlock(new Uint8Array([1, 2, 3, 4]), 2);
    expect(Array.from(padded)).toEqual([1, 2, 3, 4]);
  });
});

describe("numToChar", () => {
  it("membungkus modulo 26", () => {
    expect(numToChar(0)).toBe("A");
    expect(numToChar(25)).toBe("Z");
    expect(numToChar(26)).toBe("A");
    expect(numToChar(-1)).toBe("Z");
  });
});
