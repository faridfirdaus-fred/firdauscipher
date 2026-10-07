/**
 * columnar.ts — Transposisi Kolom (bagian dari g).
 *
 * Operasi pada BYTE (bukan hanya alfabet) supaya bisa dipakai untuk
 * Super Enkripsi file biner (S11). Padding blok akhir = byte 0x00,
 * dan panjang asli disimpan di header envelope supaya bisa dipangkas balik.
 *
 * Skema (dikunci):
 *   - Urutan kolom ditentukan dengan mengurutkan huruf kunci (A<B<...),
 *     seri dipecah oleh posisi kolom (stabil).
 *   - Enkripsi : tulis plaintext baris-per-baris, baca kolom-per-kolom
 *                mengikuti urutan kunci.
 *   - Dekripsi : kebalikannya.
 */

/** Urutan kolom hasil sortir kunci, mis. "ZEBRAS" -> [4,3,1,0,5,2]. */
export function columnOrder(key: string): number[] {
  const chars = [...key].map((ch, i) => ({ ch: ch.toUpperCase(), i }));
  if (chars.length === 0) throw new Error("Kunci transposisi kolom kosong.");
  chars.sort((a, b) => (a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : a.i - b.i));
  return chars.map((c) => c.i);
}

/** Transposisi kolom — enkripsi byte. */
export function encryptColumnar(bytes: Uint8Array, key: string): Uint8Array {
  const nCols = [...key].length;
  if (nCols === 0) throw new Error("Kunci transposisi kolom kosong.");
  if (bytes.length === 0) return new Uint8Array(0);

  const nRows = Math.ceil(bytes.length / nCols);
  const total = nRows * nCols;
  const padded = new Uint8Array(total);
  padded.set(bytes, 0); // sisa diisi 0x00

  const order = columnOrder(key);
  const out = new Uint8Array(total);
  let o = 0;
  for (const col of order) {
    for (let r = 0; r < nRows; r++) out[o++] = padded[r * nCols + col];
  }
  return out;
}

/** Transposisi kolom — dekripsi byte. */
export function decryptColumnar(bytes: Uint8Array, key: string): Uint8Array {
  const nCols = [...key].length;
  if (nCols === 0) throw new Error("Kunci transposisi kolom kosong.");
  if (bytes.length === 0) return new Uint8Array(0);
  if (bytes.length % nCols !== 0) {
    throw new Error(
      `Panjang data (${bytes.length}) bukan kelipatan panjang kunci (${nCols}). ` +
        `File mungkin rusak atau kuncinya salah.`,
    );
  }

  const nRows = bytes.length / nCols;
  const order = columnOrder(key);
  const grid = new Uint8Array(bytes.length);
  let o = 0;
  for (const col of order) {
    for (let r = 0; r < nRows; r++) grid[r * nCols + col] = bytes[o++];
  }
  return grid;
}
