/**
 * validation.test.ts — validasi kunci, pesan error, dan alur .dat (S14, S17).
 *
 * PLAN S17: "input invalid (key kosong, a bukan koprima 26, matriks singular,
 * key bukan alfabet) → error jelas, app tidak crash" dan "pesan error menyebut
 * apa dan kenapa". Tes ini mengunci perilaku itu, plus dokumentasi perilaku
 * padding yang memang bagian dari desain (Sp2/Sp5).
 */

import { describe, expect, it } from "vitest";

import { buildTextDat, runFileDecrypt } from "./cipher-runner";
import { CIPHERS, getCipher, runCipher } from "./crypto";
import { getExtension, looksLikeText } from "./file-utils";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);

/** Panggil cipher dan ambil pesan error (atau null kalau berhasil). */
function errOf(slug: string, params: Record<string, string>): string | null {
  try {
    runCipher(slug, "encrypt", enc("SERANG SUBUH"), params);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const emptyParams = (slug: string) =>
  Object.fromEntries(CIPHERS.find((c) => c.slug === slug)!.keyFields.map((f) => [f.name, ""]));

describe("S17 — kunci kosong ditolak dengan pesan yang berguna", () => {
  for (const c of CIPHERS.filter((x) => x.slug !== "enigma")) {
    it(`${c.slug}: kunci kosong -> error jelas, bukan crash`, () => {
      const msg = errOf(c.slug, emptyParams(c.slug));
      expect(msg, `${c.slug} seharusnya menolak kunci kosong`).toBeTruthy();
      expect(msg!.length).toBeGreaterThan(10);
      expect(msg).toMatch(/wajib diisi/i);
    });
  }

  it("enigma punya konfigurasi default, jadi tetap jalan tanpa mengisi apa pun", () => {
    expect(errOf("enigma", emptyParams("enigma"))).toBeNull();
  });
});

describe("S17 — Affine: a tidak koprima 26 ditolak dengan penjelasan gcd", () => {
  it("a=4 -> pesan menyebut gcd(4,26)=2 dan ≠ 1", () => {
    const msg = errOf("affine", { a: "4", b: "8" });
    expect(msg).toMatch(/gcd\(4,\s*26\)\s*=\s*2/);
    expect(msg).toMatch(/≠\s*1/);
  });

  it("a=13 -> gcd(13,26)=13", () => {
    expect(errOf("affine", { a: "13", b: "0" })).toMatch(/gcd\(13,\s*26\)\s*=\s*13/);
  });

  it("b di luar 0..25 ditolak", () => {
    expect(errOf("affine", { a: "5", b: "12345" })).toMatch(/b\s*=\s*12345.*0 dan 25/);
  });
});

describe("S17 — Hill: matriks tidak valid ditolak dengan sebab yang tepat", () => {
  it("matriks singular (det=0) ditolak dan menyebut determinan", () => {
    expect(errOf("hill", { matrix: "1,2;2,4" })).toMatch(/det = 0.*gcd\(0,\s*26\)/);
  });

  it("matriks tidak persegi ditolak dan menyebut baris mana yang salah", () => {
    const msg = errOf("hill", { matrix: "1,2,3;4,5,6" });
    // Pesannya menyebut bentuk aslinya (baris 1 berisi 3, jumlah baris 2),
    // bukan "1x1" atau "2x2" yang menyesatkan seperti sebelumnya.
    expect(msg).toMatch(/baris 1 berisi 3 elemen/);
    expect(msg).toMatch(/2×2 atau 3×3/);
  });

  it("satu baris berisi 3 elemen ditolak sebagai bukan 2x2/3x3", () => {
    const msg = errOf("hill", { matrix: "1,2,3" });
    expect(msg).toMatch(/baris 1 berisi 3 elemen/);
  });

  it("elemen bukan angka ditolak dan menyebut baris/kolomnya", () => {
    const msg = errOf("hill", { matrix: "1,2;x,4" });
    expect(msg).toMatch(/baris 2 kolom 1/);
    expect(msg).toMatch(/bukan bilangan bulat/);
  });
});

describe("S17 — cipher 26 huruf menolak kunci tanpa huruf A-Z", () => {
  for (const slug of ["vigenere", "autokey", "playfair", "columnar"]) {
    it(`${slug}: kunci "12345" ditolak dengan penjelasan`, () => {
      const msg = errOf(slug, { key: "12345" })!;
      expect(msg).toMatch(/huruf A-Z/i);
      // Pesan harus menyebut nama field apa adanya, bukan "Kunci Kunci"
      // (regresi: label diteruskan ganda sehingga terbaca "Kunci Kunci untuk ...").
      expect(msg).not.toMatch(/Kunci\s+Kunci/i);
      expect(msg).toMatch(/Kunci "key"/);
    });
  }

  it("super: kunci 2 (kolom) tanpa huruf ditolak", () => {
    const msg = errOf("super", { key1: "kunci", key2: "12345" })!;
    expect(msg).toMatch(/huruf A-Z/i);
    expect(msg).not.toMatch(/Kunci\s+Kunci/i);
    expect(msg, "menyebut field key2 supaya pemakai tahu kolom mana").toMatch(/Kunci "key2"/);
  });
});

describe("S17 — Enigma: konfigurasi tidak valid ditolak", () => {
  it("rotor tidak dikenal ditolak + menyebut rotor yang tersedia", () => {
    const msg = errOf("enigma", { rotors: "IX,II,III", reflector: "B", ring: "AAA", position: "AAA" });
    expect(msg).toMatch(/Rotor/i);
    expect(msg).toMatch(/I, II, III/);
  });

  it("posisi bukan huruf ditolak", () => {
    const msg = errOf("enigma", { rotors: "I,II,III", reflector: "B", ring: "AAA", position: "123" });
    expect(msg).toBeTruthy();
  });

  it("plugboard salah format ditolak", () => {
    const msg = errOf("enigma", {
      rotors: "I,II,III", reflector: "B", ring: "AAA", position: "AAA", plugboard: "AB CD E",
    });
    expect(msg).toBeTruthy();
  });
});

describe("S17 — aplikasi tidak crash: semua cipher round-trip dengan kunci valid", () => {
  it("cipher 26 huruf: dekripsi mengembalikan bentuk ternormalisasi (Sp2/Sp5)", () => {
    // Cipher 26 huruf membuang non-alfabet, jadi hasilnya huruf kecil semua —
    // ini memang perilaku yang diminta soal, bukan bug.
    const cases: Array<[string, Record<string, string>, string]> = [
      ["vigenere", { key: "LEMON" }, "serangsubuh"],
      ["autokey", { key: "QUEENLY" }, "serangsubuh"],
      ["affine", { a: "5", b: "8" }, "serangsubuh"],
      // Transposisi kolom bekerja pada BYTE (bukan alfabet), jadi spasi ikut
      // terbawa dan hasilnya kembali persis seperti semula.
      ["columnar", { key: "ZEBRAS" }, "SERANG SUBUH"],
      // Playfair menambah filler X pada digraph kembar / ganjil (Sp5)
      ["playfair", { key: "MONARCHY" }, "serangsubuhx"],
      // Hill mem-padding blok terakhir dengan X (S09)
      ["hill", { matrix: "3,3;2,5" }, "serangsubuhx"],
    ];
    for (const [slug, params, expected] of cases) {
      const ct = runCipher(slug, "encrypt", enc("SERANG SUBUH"), params);
      const pt = runCipher(slug, "decrypt", ct, params);
      expect(dec(pt), `${slug} round-trip`).toBe(expected);
    }
  });

  it("cipher biner: byte biner round-trip persis", () => {
    const binary = new Uint8Array([0, 1, 2, 255, 128, 0, 65, 10, 13, 0]);
    const ct = runCipher("ext-vigenere", "encrypt", binary, { key: "RAHASIA" });
    const pt = runCipher("ext-vigenere", "decrypt", ct, { key: "RAHASIA" });
    expect(Array.from(pt)).toEqual(Array.from(binary));
  });

  it("Super Enkripsi: byte round-trip persis kalau panjang asli diberikan (S11)", () => {
    const binary = new Uint8Array([0, 1, 2, 255, 128, 0, 65, 10, 13, 0]);
    const params = { key1: "RAHASIA", key2: "ZEBRAS" };
    const ct = runCipher("super", "encrypt", binary, params);
    // Kolom mem-padding kelipatan panjang kunci; envelope menyimpan panjang
    // asli supaya bisa dipangkas. Di sini kita tiru perilaku itu manual.
    const padded = runCipher("super", "decrypt", ct, params);
    expect(padded.length % 6).toBe(0);
    expect(Array.from(padded.slice(0, binary.length))).toEqual(Array.from(binary));
  });
});

describe("S14 — alur teks -> .dat -> dekripsi (Sp6, Sp9)", () => {
  it("ciphertext teks dibungkus .dat, lalu didekripsi tanpa mengetik ulang kunci", () => {
    const cipher = getCipher("vigenere")!;
    const params = { key: "LEMON" };
    const plaintext = enc("SERANG SUBUH");
    const cipherBytes = runCipher("vigenere", "encrypt", plaintext, params);

    const { dat, fileName } = buildTextDat(
      "vigenere",
      cipher.id,
      params,
      plaintext,
      cipherBytes,
      cipher.isAlpha,
      "pesan.txt",
    );
    expect(fileName).toBe("pesan.txt.dat");

    const back = runFileDecrypt(dat);
    expect(back.cipherName).toBe("vigenere");
    expect(back.header.name).toBe("pesan.txt");
    expect(back.header.ext).toBe("txt");
    expect(back.header.params).toEqual({ key: "LEMON" });
    expect(dec(back.restored)).toBe("serangsubuh");
  });

  it("cipher biner: .dat memulihkan byte persis", () => {
    const cipher = getCipher("ext-vigenere")!;
    const params = { key: "RAHASIA" };
    const original = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 1, 255]);
    const cipherBytes = runCipher("ext-vigenere", "encrypt", original, params);

    const { dat } = buildTextDat("ext-vigenere", cipher.id, params, original, cipherBytes, false, "gambar.png");
    const back = runFileDecrypt(dat);
    expect(Array.from(back.restored)).toEqual(Array.from(original));
    expect(back.fileName).toBe("gambar.png");
  });
});

describe("deteksi teks vs biner (dipakai untuk peringatan file)", () => {
  it("teks biasa -> true, ada NUL -> false", () => {
    expect(looksLikeText(enc("Halo dunia\nbaris dua"))).toBe(true);
    expect(looksLikeText(new Uint8Array([0x89, 0x50, 0, 0, 1]))).toBe(false);
  });

  it("ekstensi diambil dengan benar (Sp9)", () => {
    expect(getExtension("gambar.jpg")).toBe("jpg");
    expect(getExtension("arsip.tar.gz")).toBe("gz");
    expect(getExtension("tanpa-ekstensi")).toBe("");
  });
});
