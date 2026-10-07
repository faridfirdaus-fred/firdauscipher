# Format File `.dat` — Envelope FirdausCipher (KRI1)

> **Status: DIBEKUKAN (S03).** Jangan ubah tata letak byte di bawah tanpa
> memperbarui `apps/web/src/lib/crypto/envelope.ts`, `docs/PLAN.md`, dan
> menaikkan nomor `version`.

## 1. Tata letak byte

```
offset    ukuran   isi
--------  -------  ------------------------------------------------------------
[0..3]    4        magic  : "KRI1"              (ASCII, huruf besar)
[4]       1        version: 0x01
[5]       1        cipher : 1 byte enum (lihat tabel §3)
[6..9]    4        hdrLen : uint32 LITTLE-ENDIAN (panjang blok header)
[10..]    hdrLen   header : JSON UTF-8
[..]      sisa     payload: byte ciphertext
```

* Semua multi-byte integer memakai **little-endian**.
* `hdrLen` = panjang blok header saja (tidak termasuk magic/version/cipher/hdrLen).
* `payload` mulai di offset `10 + hdrLen` dan berlanjut sampai akhir file.

## 2. Blok header (JSON UTF-8)

```jsonc
{
  "name": "gambar.jpg",     // nama file plaintext asli (Sp9)
  "ext": "jpg",             // ekstensi tanpa titik -> auto-restore ekstensi
  "mime": "image/jpeg",     // MIME type hasil deteksi/File API
  "size": 204815,           // ukuran plaintext ASLI dalam byte (sebelum enkripsi)
  "mode": "binary",         // "binary" | "base64-text"
  "params": { "key": "..." },// parameter kunci yang dipakai (opsional)
  "fromText": false         // true kalau sumbernya teks yang diketik, bukan file
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `name` | ✅ | Nama file asli. Untuk teks ketikan dipakai `teks.txt`. |
| `ext` | ✅ | Ekstensi tanpa titik. Dipakai memulihkan nama file saat dekripsi. |
| `mime` | ✅ | MIME type. Fallback `application/octet-stream`. |
| `size` | ✅ | Panjang plaintext asli. **Wajib** untuk memangkas padding 0x00 dari Transposisi Kolom (S11). |
| `mode` | ✅ | Cara membaca `payload` (lihat §4). |
| `params` | ❌ | Parameter cipher (mis. `{"a":5,"b":8}` Affine, `{"matrix":[[...]]}` Hill, konfigurasi Enigma). Dipakai agar dekripsi bisa dilakukan tanpa mengetik ulang kunci non-teks. |
| `fromText` | ❌ | Menandai sumber teks ketikan. |

## 3. Enum cipher (byte ke-5)

| Nilai | Cipher | Huruf soal |
|---|---|---|
| 1 | Vigenere standard | a |
| 2 | Auto-Key Vigenere | b |
| 3 | Extended Vigenere (256 ASCII) | c |
| 4 | Playfair | d |
| 5 | Affine | e |
| 6 | Hill | f |
| 7 | Super Enkripsi | g |
| 8 | Enigma | h |
| 9 | Transposisi Kolom (ekstensi) | bagian dari g |

Nilai `0` dan `≥10` tidak dipakai. Nilai `9` adalah ekstensi tambahan
(Transposisi Kolom berdiri sendiri) — membaca file lama tidak terpengaruh
karena hanya nilai baru yang ditambahkan. Konstanta ada di `CipherId`
(`envelope.ts`).

## 4. Mode payload

| `mode` | Isi `payload` | Dipakai oleh |
|---|---|---|
| `binary` | byte ciphertext mentah | Extended Vigenere (c), Transposisi Kolom, Super Enkripsi (g) |
| `base64-text` | byte ASCII dari ciphertext huruf | Vigenere (a), Auto-Key (b), Playfair (d), Affine (e), Hill (f), Enigma (h) |

**Kenapa `base64-text`?** Cipher 26 huruf membuang semua non-alfabet (Sp2), jadi
file biner **tidak akan bisa dipulihkan**. Mode ini menandai bahwa payload
memang hanya teks huruf. Kalau pengguna memaksa cipher 26 huruf pada file biner,
UI menampilkan peringatan (lihat §10 no.6 di `PLAN.md`).

**Base64 hanya untuk tampilan (Sp4).** Di dalam `.dat`, payload disimpan sebagai
byte mentah — kecuali mode `base64-text` di mana byte-nya memang huruf ASCII.

## 5. Nama file `.dat`

Default: `<nama-asli>.<ext>.dat` → `gambar.jpg` menjadi `gambar.jpg.dat`.
Dekripsi memulihkan `name` + `ext` dari header sehingga hasilnya kembali
`gambar.jpg` yang bisa dibuka viewer gambar (Sp9, S14).

## 6. Hubungan dengan spesifikasi soal

| Spesifikasi | Bagaimana dipenuhi |
|---|---|
| Sp4 — base64 untuk tampilan | Payload disimpan sebagai byte, bukan string base64 (kecuali mode teks). |
| Sp8 — semua byte plaintext ikut terenkripsi | Envelope `KRI1` ditambahkan **setelah** enkripsi, jadi header file asli sudah ikut terenkripsi di dalam payload. |
| Sp9 — restore ekstensi asli | `name` + `ext` disimpan di header. |
| Sp10 — tanpa library cipher pihak ketiga | Parsing envelope memakai `DataView`/`TextEncoder` bawaan. |

## 7. Contoh nyata (hexdump)

Envelope untuk `contoh.txt` (12 byte) dengan Vigenere:

```
4B 52 49 31            K R I 1        magic
01                     .              version 1
01                     .              cipher = 1 (vigenere)
5A 00 00 00            90 00 00 00    hdrLen = 90 (little-endian)
7B 22 6E 61 6D 65 ...  {"name"...     header JSON
<byte ciphertext>                     payload
```

## 8. Error yang mungkin muncul

| Pesan | Penyebab |
|---|---|
| `File terlalu pendek untuk format KRI1 (.dat)` | File < 10 byte. |
| `Bukan file .dat FirdausCipher: magic = "...."` | Bukan file `.dat` kita. |
| `Versi envelope tidak didukung: N` | File dibuat versi lebih baru. |
| `Header envelope rusak (hdrLen melebihi ukuran file)` | File terpotong. |
| `Header envelope bukan JSON valid` | File rusak / dimodifikasi. |
