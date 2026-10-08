import { describe, expect, it } from "vitest";
import { CIPHERS, cipherLabel, cipherLabelWithLetter, getCipher } from "./index";

/**
 * Tes registry cipher — mengunci aturan penomoran huruf soal.
 *
 * Konteks: registry punya 9 entri, tetapi soal hanya menetapkan huruf a–h.
 * Transposisi Kolom adalah tahap 2 Super Enkripsi (soal poin g), jadi ia
 * BUKAN item berhuruf sendiri. Dulu keduanya berlabel "g" sehingga UI
 * menampilkan dua cipher berhuruf g.
 *
 * Huruf soal TIDAK dipakai di antarmuka: `cipherLabel` hanya mengembalikan
 * nama, sedangkan `cipherLabelWithLetter` (khusus halaman /docs) yang
 * menambahkan hurufnya.
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
    expect(cipherLabelWithLetter(columnar)).toBe("Transposisi Kolom (bagian g)");

    const superC = getCipher("super");
    expect(superC.componentOf).toBeUndefined();
    expect(cipherLabelWithLetter(superC)).toBe("g) Super Enkripsi");
  });

  it("cipherLabel (untuk UI) mengembalikan nama saja, tanpa huruf soal", () => {
    for (const c of CIPHERS) {
      expect(cipherLabel(c)).toBe(c.name);
      expect(cipherLabel(c)).not.toMatch(/^[a-h]\)/);
      expect(cipherLabel(c)).not.toMatch(/bagian [a-h]/);
    }
  });

  it("cipherLabelWithLetter (untuk /docs) memberi awalan huruf hanya pada cipher berhuruf", () => {
    for (const c of CIPHERS) {
      if (c.componentOf) {
        expect(cipherLabelWithLetter(c)).toBe(`${c.name} (bagian ${c.componentOf})`);
        expect(cipherLabelWithLetter(c)).not.toMatch(/^[a-h]\)/);
      } else {
        expect(cipherLabelWithLetter(c)).toBe(`${c.letter}) ${c.name}`);
      }
    }
  });
});
