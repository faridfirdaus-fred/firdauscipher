/**
 * vectors.test.ts — jalankan semua test vectors bersama (S04) di implementasi TS.
 *
 * Sumber kebenaran: `packages/vectors/vectors.json`, dibuat oleh implementasi
 * referensi Python (`packages/vectors/generate.py`) yang ditulis INDEPENDEN
 * dari kode TS/Ruby. Kalau tes ini gagal, implementasi TS yang salah.
 *
 * S22 menjalankan file vektor yang sama di Ruby (`apps/api/spec/vectors_spec.rb`).
 */

import { describe, expect, it } from "vitest";

import vectors from "../../../packages/vectors/vectors.json";
import { fromBase64, toBase64, utf8ToBytes } from "@/lib/crypto/core";
import { runCipher, type CipherParams } from "@/lib/crypto";

interface VectorCase {
  id: string;
  cipher: string;
  mode: "text" | "binary";
  params: Record<string, unknown>;
  plaintext: string;
  ciphertext: string;
  note: string;
  source: string;
}

const cases = vectors.cases as unknown as VectorCase[];

/**
 * Cipher yang plaintext-nya bisa dipulihkan PERSIS (tanpa filler).
 * Playfair & Hill menyisipkan filler X yang tidak bisa dibedakan dari plaintext
 * asli, jadi untuk keduanya properti yang diuji adalah re-enkripsi (di bawah).
 */
const EXACT_RECOVERY = new Set(["vigenere", "autokey", "affine", "enigma"]);

/** Normalisasi params JSON -> string seperti yang dipakai GUI. */
function paramsFor(c: VectorCase): CipherParams {
  const out: CipherParams = {};
  for (const [k, v] of Object.entries(c.params)) {
    if (k === "matrix") {
      out[k] = (v as number[][]).map((row) => row.join(",")).join(";");
    } else if (Array.isArray(v)) {
      out[k] = v.join(",");
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

function toBytes(value: string, mode: "text" | "binary"): Uint8Array {
  return mode === "binary" ? fromBase64(value) : utf8ToBytes(value);
}

function fromBytes(value: Uint8Array, mode: "text" | "binary"): string {
  return mode === "binary" ? toBase64(value) : new TextDecoder().decode(value);
}

describe("Test vectors bersama (S04) — implementasi TS", () => {
  it("memuat vektor untuk semua cipher", () => {
    const byCipher = new Set(cases.map((c) => c.cipher));
    expect(byCipher).toEqual(
      new Set([
        "vigenere",
        "autokey",
        "ext-vigenere",
        "playfair",
        "affine",
        "hill",
        "columnar",
        "super",
        "enigma",
      ]),
    );
    // Minimal 3 kasus per cipher (syarat S04).
    for (const cipher of byCipher) {
      expect(cases.filter((c) => c.cipher === cipher).length).toBeGreaterThanOrEqual(3);
    }
  });

  describe.each(cases.map((c) => [c.id, c] as const))("%s", (id, c) => {
    it("enkripsi cocok dengan vektor referensi", () => {
      const out = runCipher(c.cipher, "encrypt", toBytes(c.plaintext, c.mode), paramsFor(c));
      expect(fromBytes(out, c.mode)).toBe(c.ciphertext);
    });

    it("dekripsi berhasil dipulihkan", () => {
      const ctBytes = toBytes(c.ciphertext, c.mode);
      const decrypted = runCipher(c.cipher, "decrypt", ctBytes, paramsFor(c));

      if (c.mode === "binary") {
        // Cipher biner: hasil dekripsi berisi padding 0x00 dari transposisi
        // kolom. Di aplikasi, panjang asli diambil dari header envelope
        // (`size`). Di sini kita pangkas dengan panjang plaintext vektor.
        const ptLen = toBytes(c.plaintext, c.mode).length;
        const trimmed = decrypted.slice(0, ptLen);
        expect(fromBytes(trimmed, c.mode)).toBe(c.plaintext);
        return;
      }

      const back = fromBytes(decrypted, c.mode);

      // Properti eksak untuk semua cipher teks: enkripsi ulang hasil dekripsi
      // harus menghasilkan ciphertext yang sama persis.
      const reencrypted = runCipher(c.cipher, "encrypt", decrypted, paramsFor(c));
      expect(fromBytes(reencrypted, c.mode)).toBe(c.ciphertext);

      // Cipher tanpa filler juga harus memulihkan plaintext persis.
      if (EXACT_RECOVERY.has(c.cipher)) {
        const clean = c.plaintext.toUpperCase().replace(/[^A-Z]/g, "");
        expect(back.toUpperCase()).toBe(clean);
      }
    });
  });
});
