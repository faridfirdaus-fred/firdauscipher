import { describe, expect, it } from "vitest";
import { CIPHERS, cipherLabel, getCipher } from "./index";

/**
 * Tes registry cipher — mengunci aturan penomoran huruf soal.
 *
 * Konteks: registry punya 9 entri, tetapi soal hanya menetapkan huruf a–h.
 * Transposisi Kolom adalah tahap 2 Super Enkripsi (soal poin g), jadi ia
 * BUKAN item berhuruf sendiri. Dulu keduanya berlabel "g" sehingga UI
 * menampilkan dua cipher berhuruf g.
 */
describe("registry cipher", () => {
  it("setiap huruf soal a–h dipakai tepat satu cipher berhuruf", () => {
    const berhuruf = CIPHERS.filter((c) => !c.componentOf);
    const huruf = berhuruf.map((c) => c.letter);

    expect(huruf).toHaveLength(8);
    expect(new Set(huruf).size).toBe(huruf.length); // tidak ada huruf ganda
    expect([...huruf].sort()).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("Transposisi Kolom ditandai bagian g, Super Enkripsi tetap g", () => {
    const columnar = getCipher("columnar");
    expect(columnar.componentOf).toBe("g");
    expect(cipherLabel(columnar)).toBe("Transposisi Kolom (bagian g)");

    const superC = getCipher("super");
    expect(superC.componentOf).toBeUndefined();
    expect(cipherLabel(superC)).toBe("g) Super Enkripsi");
  });

  it("cipherLabel memberi awalan huruf hanya pada cipher berhuruf", () => {
    for (const c of CIPHERS) {
      if (c.componentOf) {
        expect(cipherLabel(c)).toBe(`${c.name} (bagian ${c.componentOf})`);
        expect(cipherLabel(c)).not.toMatch(/^[a-h]\)/);
      } else {
        expect(cipherLabel(c)).toBe(`${c.letter}) ${c.name}`);
      }
    }
  });
});
