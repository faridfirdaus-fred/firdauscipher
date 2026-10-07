/**
 * playfair.ts — Playfair Cipher (d).
 *
 * Matriks 5×5, huruf I/J DIGABUNG jadi I, filler 'X', pasangan kembar
 * disisipkan filler, panjang ganjil ditambah filler di akhir (S07).
 *
 * Aturan: baris sama -> geser kanan/kiri; kolom sama -> geser bawah/atas;
 * selain itu tukar sudut persegi panjang.
 */

import { sanitize26 } from "./core";

export const PLAYFAIR_FILLER = "X";

/** Susun key square 5×5 (25 huruf, I/J digabung). */
export function buildKeySquare(key: string): string[][] {
  const seen = new Set<string>();
  const seq: string[] = [];
  // I dan J dianggap sama -> pakai I.
  const push = (ch: string) => {
    const c = ch === "J" ? "I" : ch;
    if (!seen.has(c)) {
      seen.add(c);
      seq.push(c);
    }
  };
  for (const ch of sanitize26(key)) push(ch);
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") push(ch);

  const square: string[][] = [];
  for (let r = 0; r < 5; r++) square.push(seq.slice(r * 5, r * 5 + 5));
  return square;
}

function findPos(square: string[][], ch: string): [number, number] {
  const c = ch === "J" ? "I" : ch;
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 5; k++) {
      if (square[r][k] === c) return [r, k];
    }
  }
  throw new Error(`Huruf "${ch}" tidak ada di key square`);
}

/** Bentuk digraph: buang non-alfabet, sisipkan filler untuk pasangan kembar, pastikan genap. */
function makeDigraphs(text: string): string[] {
  const clean = sanitize26(text).replace(/J/g, "I");
  const chars: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = clean[i];
    const b = clean[i + 1];
    if (b === undefined) {
      chars.push(a, PLAYFAIR_FILLER);
      i += 1;
    } else if (a === b) {
      chars.push(a, PLAYFAIR_FILLER);
      i += 1;
    } else {
      chars.push(a, b);
      i += 2;
    }
  }
  const pairs: string[] = [];
  for (let k = 0; k < chars.length; k += 2) pairs.push(chars[k] + chars[k + 1]);
  return pairs;
}

/** Playfair — enkripsi. */
export function encryptPlayfair(plaintext: string, key: string): string {
  const square = buildKeySquare(key);
  let out = "";
  for (const pair of makeDigraphs(plaintext)) {
    const [r1, c1] = findPos(square, pair[0]);
    const [r2, c2] = findPos(square, pair[1]);
    if (r1 === r2) {
      out += square[r1][(c1 + 1) % 5] + square[r2][(c2 + 1) % 5];
    } else if (c1 === c2) {
      out += square[(r1 + 1) % 5][c1] + square[(r2 + 1) % 5][c2];
    } else {
      out += square[r1][c2] + square[r2][c1];
    }
  }
  return out.toLowerCase();
}

/** Playfair — dekripsi. */
export function decryptPlayfair(ciphertext: string, key: string): string {
  const square = buildKeySquare(key);
  const clean = sanitize26(ciphertext).replace(/J/g, "I");
  if (clean.length % 2 !== 0) {
    throw new Error(`Panjang ciphertext Playfair harus genap (sekarang ${clean.length}).`);
  }
  let out = "";
  for (let i = 0; i < clean.length; i += 2) {
    const [r1, c1] = findPos(square, clean[i]);
    const [r2, c2] = findPos(square, clean[i + 1]);
    if (r1 === r2) {
      out += square[r1][(c1 + 4) % 5] + square[r2][(c2 + 4) % 5];
    } else if (c1 === c2) {
      out += square[(r1 + 4) % 5][c1] + square[(r2 + 4) % 5][c2];
    } else {
      out += square[r1][c2] + square[r2][c1];
    }
  }
  return out.toLowerCase();
}
