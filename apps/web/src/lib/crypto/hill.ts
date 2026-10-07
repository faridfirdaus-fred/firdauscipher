/**
 * hill.ts — Hill Cipher (f).
 *
 * Blok berukuran n (n = 2 atau 3, lihat §7 Q6). Kunci = matriks n×n yang
 * determinannya koprima 26 supaya punya invers mod 26.
 * Padding blok terakhir memakai filler 'X' (S09).
 */

import { Matrix, assertSquare, charToNum, detMod, invertMatrixMod, matMulMod, mod, numToChar, sanitize26 } from "./core";

export const HILL_FILLER = "X";

/** Parse matriks kunci dari teks: "6,24,1;13,16,10;20,17,15" atau "6 24 1 / 13 16 10 / 20 17 15". */
export function parseMatrix(text: string): Matrix {
  const rows = text
    .split(/[;\n/]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  const matrix = rows.map((row, ri) =>
    row
      .split(/[\s,]+/)
      .filter((t) => t.length > 0)
      .map((t, ci) => {
        const n = Number(t);
        if (!Number.isInteger(n)) {
          throw new Error(
            `Elemen matriks baris ${ri + 1} kolom ${ci + 1} bukan bilangan bulat: "${t}". ` +
              `Isi dengan angka, mis. "3,3;2,5".`,
          );
        }
        return mod(n, 26);
      }),
  );
  validateHillKey(matrix);
  return matrix;
}

/** Validasi matriks kunci Hill; pesan error menyebut nilai determinan (S09). */
export function validateHillKey(matrix: Matrix): void {
  assertSquare(matrix);
  const n = matrix.length;
  if (n !== 2 && n !== 3) {
    const shape = matrix.map((row) => row.length).join("×");
    throw new Error(
      `Ukuran matriks Hill harus 2×2 atau 3×3, bukan ${shape}. ` +
        `Contoh 2×2: "3,3;2,5". Contoh 3×3: "6,24,1;13,16,10;20,17,15".`,
    );
  }
  const det = detMod(matrix, 26);
  if (det % 2 === 0 || det % 13 === 0) {
    throw new Error(
      `Matriks tidak bisa dipakai: det = ${det}, gcd(${det}, 26) ≠ 1. ` +
        `Ciphertext tidak akan bisa didekripsi (matriks singular mod 26).`,
    );
  }
}

/** Hill — enkripsi. */
export function encryptHill(plaintext: string, matrix: Matrix): string {
  validateHillKey(matrix);
  const n = matrix.length;
  let p = sanitize26(plaintext);
  if (p.length === 0) throw new Error("Plaintext tidak punya huruf A-Z.");
  while (p.length % n !== 0) p += HILL_FILLER;

  let out = "";
  for (let i = 0; i < p.length; i += n) {
    const block = p.slice(i, i + n).split("").map(charToNum);
    const col: Matrix = block.map((v) => [v]); // vektor kolom n×1
    const res = matMulMod(matrix, col, 26);
    for (let r = 0; r < n; r++) out += numToChar(res[r][0]);
  }
  return out.toLowerCase();
}

/** Hill — dekripsi. */
export function decryptHill(ciphertext: string, matrix: Matrix): string {
  validateHillKey(matrix);
  const n = matrix.length;
  const c = sanitize26(ciphertext);
  if (c.length % n !== 0) {
    throw new Error(`Panjang ciphertext (${c.length}) bukan kelipatan ukuran blok (${n}).`);
  }
  const inv = invertMatrixMod(matrix, 26);
  let out = "";
  for (let i = 0; i < c.length; i += n) {
    const block = c.slice(i, i + n).split("").map(charToNum);
    const col: Matrix = block.map((v) => [v]);
    const res = matMulMod(inv, col, 26);
    for (let r = 0; r < n; r++) out += numToChar(res[r][0]);
  }
  return out.toLowerCase();
}
