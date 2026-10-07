import { describe, expect, it } from "vitest";

import { decryptEnigma, encryptEnigma, EnigmaMachine } from "./enigma";

const STANDARD = {
  rotors: ["I", "II", "III"] as [string, string, string],
  reflector: "B",
  ring: "AAA",
  position: "AAA",
  plugboard: "",
};

describe("Enigma (bonus h)", () => {
  it("AAAAA dengan rotor I-II-III, reflector B, ring AAA, pos AAA -> BDZGO", () => {
    expect(encryptEnigma("AAAAA", STANDARD)).toBe("bdzgo");
  });

  it("round-trip mengembalikan plaintext", () => {
    const pt = "HELLOENIGMA";
    const ct = encryptEnigma(pt, STANDARD);
    expect(decryptEnigma(ct, STANDARD).toUpperCase()).toBe(pt);
  });

  it("double-stepping rotor tengah terjadi", () => {
    // Double-step: rotor TENGAH tepat di notch-nya (E untuk rotor II)
    // -> rotor tengah DAN rotor kiri berputar bersamaan.
    // Posisi AEA -> kiri A->B, tengah E->F, kanan A->B.
    const m = new EnigmaMachine({ ...STANDARD, position: "AEA" });
    m.process("A");
    expect(m.position).toBe("BFB");

    // Rotor kanan di notch (V = notch rotor III) tapi tengah belum:
    // hanya rotor tengah yang berputar, rotor kiri diam.
    const m2 = new EnigmaMachine({ ...STANDARD, position: "ADV" });
    m2.process("A");
    expect(m2.position).toBe("AEW");

    // Rotor kanan belum di notch: hanya rotor kanan yang berputar.
    const m3 = new EnigmaMachine({ ...STANDARD, position: "ADU" });
    m3.process("A");
    expect(m3.position).toBe("ADV");
  });

  it("plugboard mengubah hasil", () => {
    const withPlug = { ...STANDARD, plugboard: "AB CD" };
    expect(encryptEnigma("AAAAA", withPlug)).not.toBe(encryptEnigma("AAAAA", STANDARD));
  });

  it("plugboard tetap involutif (round-trip benar)", () => {
    const cfg = { ...STANDARD, plugboard: "AB CD EF" };
    const ct = encryptEnigma("KRIPTOGRAFI", cfg);
    expect(decryptEnigma(ct, cfg).toUpperCase()).toBe("KRIPTOGRAFI");
  });

  it("ring setting mengubah hasil", () => {
    expect(encryptEnigma("AAAAA", { ...STANDARD, ring: "BBB" })).not.toBe(
      encryptEnigma("AAAAA", STANDARD),
    );
  });

  it("posisi awal mengubah hasil", () => {
    expect(encryptEnigma("AAAAA", { ...STANDARD, position: "BBB" })).not.toBe(
      encryptEnigma("AAAAA", STANDARD),
    );
  });

  it("rotor tidak dikenal -> error jelas", () => {
    expect(() => encryptEnigma("A", { ...STANDARD, rotors: ["I", "IX", "III"] })).toThrow(
      /Rotor "IX" tidak dikenal/,
    );
  });

  it("ring setting bukan 3 huruf -> error", () => {
    expect(() => encryptEnigma("A", { ...STANDARD, ring: "AA" })).toThrow(/harus 3 huruf/);
  });

  it("plugboard tidak valid -> error", () => {
    expect(() => encryptEnigma("A", { ...STANDARD, plugboard: "AA" })).toThrow(/huruf yang sama/);
    expect(() => encryptEnigma("A", { ...STANDARD, plugboard: "ABC" })).toThrow(/tidak valid/);
  });

  it("membuang non-alfabet", () => {
    expect(encryptEnigma("A-A A", STANDARD)).toBe(encryptEnigma("AAA", STANDARD));
  });
});
