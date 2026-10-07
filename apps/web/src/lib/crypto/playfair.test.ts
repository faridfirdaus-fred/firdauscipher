import { describe, expect, it } from "vitest";

import { buildKeySquare, decryptPlayfair, encryptPlayfair } from "./playfair";

describe("Playfair (d)", () => {
  it("buildKeySquare MONARCHY sesuai matriks baku", () => {
    expect(buildKeySquare("MONARCHY")).toEqual([
      ["M", "O", "N", "A", "R"],
      ["C", "H", "Y", "B", "D"],
      ["E", "F", "G", "I", "K"],
      ["L", "P", "Q", "S", "T"],
      ["U", "V", "W", "X", "Z"],
    ]);
  });

  it("I dan J digabung jadi I", () => {
    const square = buildKeySquare("JALAN");
    const flat = square.flat();
    expect(flat).toContain("I");
    expect(flat).not.toContain("J");
    expect(flat).toHaveLength(25);
  });

  it("MONARCHY + INSTRUMENTS -> GATLMZCLRQXA", () => {
    expect(encryptPlayfair("INSTRUMENTS", "MONARCHY")).toBe("gatlmzclrqxa");
  });

  it("panjang ciphertext selalu genap", () => {
    for (const pt of ["A", "AB", "ABC", "ATTACK", "HELLOWORLD"]) {
      expect(encryptPlayfair(pt, "MONARCHY").length % 2).toBe(0);
    }
  });

  it("round-trip mengembalikan plaintext (tanpa filler di akhir)", () => {
    const pt = "ATTACKATDAWN";
    const ct = encryptPlayfair(pt, "MONARCHY");
    const back = decryptPlayfair(ct, "MONARCHY").toUpperCase();
    // Panjang sama & tidak ada filler tambahan di akhir.
    expect(back).toBe(pt);
  });

  it("pasangan huruf kembar disisipkan filler X", () => {
    // "BALLOON" -> BA LX LO ON
    const ct = encryptPlayfair("BALLOON", "MONARCHY");
    expect(ct).toHaveLength(8);
    expect(decryptPlayfair(ct, "MONARCHY").toUpperCase()).toBe("BALXLOON");
  });

  it("kunci kosong tetap jalan (key square alfabet biasa)", () => {
    expect(encryptPlayfair("HELLO", "")).toBe("kcnvmp");
  });
});
