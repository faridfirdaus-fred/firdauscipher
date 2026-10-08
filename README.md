# FirdausCipher

Lab cipher klasik berbasis web — **Project UTS Kriptografi**.

Delapan cipher klasik (a–h) dalam satu antarmuka web, untuk **teks** maupun **file
biner** (teks, gambar, database, audio, video). Crypto berjalan **100% di sisi
klien** (TypeScript), dengan **implementasi Ruby kedua** sebagai REST API untuk
pembuktian silang hasil antar-bahasa pemrograman.

> Dokumen ini adalah **README utama** (cara menjalankan dari nol). README
> per-aplikasi: [`apps/web/README.md`](apps/web/README.md) ·
> [`apps/api/README.md`](apps/api/README.md).

---

## Daftar isi

- [Fitur](#fitur)
- [Daftar cipher](#daftar-cipher)
- [Arsitektur](#arsitektur)
- [Prasyarat](#prasyarat)
- [Menjalankan dari nol](#menjalankan-dari-nol)
- [Demo cepat (satu perintah)](#demo-cepat-satu-perintah)
- [Cara memakai aplikasi](#cara-memakai-aplikasi)
- [Menjalankan pengujian](#menjalankan-pengujian)
- [Bukti & laporan](#bukti--laporan)
- [Struktur repositori](#struktur-repositori)
- [Pemecahan masalah](#pemecahan-masalah)

---

## Fitur

| Fitur | Keterangan |
|---|---|
| **8 cipher klasik** | Vigenere (a), Auto-Key (b), Extended Vigenere 256 ASCII (c), Playfair (d), Affine (e), Hill (f), Super Enkripsi (g), Enigma (h) |
| **Mode teks** | Hanya huruf A–Z yang diproses (spasi & tanda baca dilewati, dengan pemberitahuan) |
| **Mode file** | Byte-per-byte, mendukung semua jenis file sampai **100 MB** |
| **Envelope `.dat`** | Hasil enkripsi file dibungkus format **KRI1** (magic + version + header JSON) sehingga bisa didekripsi kembali kapan saja |
| **Enkripsi & dekripsi** | Kedua arah untuk semua cipher |
| **Implementasi ganda** | TypeScript (frontend) **dan** Ruby (REST API) — hasilnya dibuktikan identik |
| **Privasi** | Tidak ada data yang dikirim ke server saat memakai aplikasi web; seluruh proses di browser |

---

## Daftar cipher

Huruf mengikuti penomoran soal UTS.

| # | Cipher | Jenis | Parameter | Contoh |
|---|---|---|---|---|
| **a** | Vigenere Standard | 26 huruf | Kunci (teks) | `SERANG SUBUH SEKALI` + `LEMON` → `didoarwgphswqynwm` |
| **b** | Auto-Key Vigenere | 26 huruf | Kunci (teks) | keystream = kunci + plaintext |
| **c** | Extended Vigenere (256 ASCII) | biner | Kunci (teks) | semua byte 0–255, termasuk `0x00` |
| **d** | Playfair | 26 huruf | Kunci (teks) | matriks 5×5, I/J digabung, filler `X` |
| **e** | Affine | 26 huruf | `a` (12 nilai koprima), `b` | `E(x) = (a·x + b) mod 26` |
| **f** | Hill | 26 huruf | Matriks (2×2 atau 3×3) | `ACT` + `[[6,24,1],[13,16,10],[20,17,15]]` → `poh` |
| **g** | Super Enkripsi | biner | Kunci 1 + Kunci 2 | Vigenere 256 **+** Transposisi Kolom |
| **h** | Enigma (Bonus) | 26 huruf | Rotor, reflector, ring, posisi, plugboard | 3 rotor `I,II,III`, reflector `B` |

**Catatan penomoran.** Transposisi Kolom **tidak** diberi huruf sendiri karena
merupakan tahap ke-2 dari Super Enkripsi (soal poin g). Di antarmuka ia tampil
sebagai *"Transposisi Kolom (bagian g)"*, sehingga setiap huruf a–h dipakai
tepat satu cipher.

---

## Arsitektur

```
apps/web/   Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 4
            -> seluruh logika cipher (src/lib/crypto/*), Web Worker, GUI
            -> deploy: static assets (crypto client-side)

apps/api/   Ruby 3.3 + Sinatra
            -> port kedua semua cipher (lib/firdaus_cipher/*) + REST API + GUI mini
            -> deploy: server Ruby

packages/   vectors/  27 test vector bersama (dipakai TS & Ruby)
            testfiles/ 5 file uji wajib (teks, gambar, database, audio, video)
```

**Mengapa dua implementasi?** Agar hasil dapat **dibuktikan**, bukan sekadar
diklaim: `pnpm cross-verify` menjalankan 27 vektor di **TypeScript** dan **Ruby**
lalu membandingkannya dengan **vektor acuan** (dibuat terpisah dengan Python).
Tiga kolom harus sama — sehingga tidak mungkin kedua implementasi "sama-sama salah".

---

## Prasyarat

| Perangkat | Versi diuji | Cek |
|---|---|---|
| **Node.js** | v24.19.0 (min. 20) | `node -v` |
| **pnpm** | 12.4.2 (min. 10) | `pnpm -v` |
| **Ruby** | 3.3.8 | `ruby -v` |
| **Bundler** | 2.5.22 | `bundle -v` |

Hanya **Node.js + pnpm** yang dibutuhkan untuk memakai aplikasi web. Ruby
diperlukan hanya untuk menjalankan/menguji backend.

### Bisa jalan offline (tanpa internet)?

**Ya — sepenuhnya offline**, setelah dependensi terpasang sekali. Tidak ada
CDN, tidak ada panggilan API luar, tidak ada font Google: seluruh kriptografi
dihitung di browser/Node sendiri, dan halaman memakai font sistem.

| Tahap | Butuh internet? |
|---|---|
| `pnpm install` (sekali di awal) | **Ya** (unduh paket) |
| `pnpm build`, `pnpm dev`, `pnpm api` | **Tidak** |
| Memakai aplikasi (enkripsi/dekripsi, mode file) | **Tidak** |
| `pnpm demo`, `pnpm test`, `pnpm cross-verify` | **Tidak** |

Sudah diuji dengan jaringan dimatikan (`bwrap --unshare-net`): build sukses,
aplikasi melayani halaman (HTTP 200) dan enkripsi Vigenere menghasilkan
`didoarwgphswqynwm` tanpa satu pun permintaan keluar. Cocok untuk demo di
kelas tanpa wifi.

> **Catatan (S31):** sebelumnya aplikasi memakai `next/font/google` (Geist)
> sehingga `pnpm build` **gagal** tanpa internet. Sudah diganti ke font sistem
> agar aman saat demo offline.

---

## Menjalankan dari nol

### 1. Pasang dependensi JavaScript

```bash
git clone <url-repo> firdauscipher
cd firdauscipher
pnpm install
```

> Jika pnpm memperingatkan build script diblokir, jalankan `pnpm approve-builds --all -y`.
> Konfigurasi `allowBuilds` sudah tersedia di `pnpm-workspace.yaml`.

### 2. Jalankan aplikasi web (frontend)

```bash
pnpm dev
```

Buka **<http://localhost:3000>**. Aplikasi langsung bisa dipakai — tidak
memerlukan backend, karena seluruh proses cipher berjalan di browser.

### 3. (Opsional) Jalankan REST API Ruby

```bash
cd apps/api
bundle config set --local without "production lint"
bundle install
```

```bash
cd ../..            # kembali ke root
pnpm api            # -> http://127.0.0.1:9292
```

Cek: <http://127.0.0.1:9292/health> → `{"status":"ok",...}`
GUI mini: <http://127.0.0.1:9292/>

> **Catatan.** Di lokal API memakai **WEBrick** (murni Ruby) lewat
> `apps/api/bin/server`, sehingga tidak butuh compiler/`ruby-dev`. Gem `puma`
> dan `rubocop` ada di grup `production`/`lint` dan sengaja dilewati di lokal;
> di server produksi `bundle config` di atas tidak dipakai sehingga `puma`
> ikut terpasang.

---

## Demo cepat (satu perintah)

Ingin langsung melihat programnya bekerja, tanpa membuka browser? Jalankan:

```bash
pnpm demo
```

Perintah ini memanggil **kode yang sama** dengan antarmuka web
(`apps/web/src/lib/crypto`) dan mencetak bukti ke terminal — **tanpa server,
tanpa internet**:

1. **9 cipher mode teks** — enkripsi lalu dekripsi balik, menampilkan teks,
   kunci, cipherteks, dan hasil dekripsi.
2. **Mode file (biner)** — `contoh.png`, `contoh.sqlite`, `contoh.wav`
   dienkripsi, dibungkus `.dat`, lalu didekripsi; **SHA-256 sebelum vs sesudah
   harus identik**.
3. **27 vektor acuan resmi** — semua kasus di
   `packages/vectors/vectors.json` harus cocok.

Contoh keluaran (dipotong):

```text
OK    | a) Vigenere Standard
        teks     : SERANG SUBUH SEKALI
        kunci    : {"key":"LEMON"}
        cipher   : didoarwgphswqynwm
        dekripsi : serangsubuhsekali  (persis)
...
Ringkasan bagian 1: 9/9 cipher berhasil enkripsi+dekripsi.
Ringkasan bagian 3: 27/27 kasus cocok.

==============================================================================
SEMUA LULUS — 9 cipher (teks) + 27 vektor acuan.
==============================================================================
```

| Perintah | Kegunaan |
|---|---|
| `pnpm demo` | Demo lengkap (bagian 1–3) |
| `pnpm demo -- --ringkas` | Versi singkat (lewati bagian 2) |
| `cd apps/web && pnpm demo` | Sama, dijalankan dari folder frontend |

Skrip ini **keluar dengan kode 1** kalau ada satu saja pemeriksaan yang gagal,
jadi bisa dipakai sebagai pemeriksaan cepat sebelum presentasi atau di CI.

> **Untuk demo di kelas:** jalankan `pnpm demo` (bukti hitam-putih di terminal),
> lalu `pnpm start` dan buka <http://localhost:3000> untuk menunjukkan
> antarmukanya. Keduanya jalan tanpa wifi.

---

## Cara memakai aplikasi

1. **Pilih cipher** dari dropdown di bagian atas (a–h).
2. **Pilih mode**: **Mode Teks** atau **Mode File**.
3. Isi **kunci/parameter** (nilai default sudah terisi contoh).
4. **Mode Teks** — tempel plaintext → klik **Enkripsi** (atau **Dekripsi**).
   Hasil muncul di kotak hasil dan bisa disalin.
5. **Mode File** — pilih file apa pun → klik **Enkripsi & Unduh .dat**.
   Untuk mengembalikan, buka tab **Dekripsi File (.dat)**, pilih file `.dat`,
   lalu **Dekripsi & Unduh File Asli**.

**Cipher mana untuk file?** Gunakan cipher **biner** (c, g) untuk file seperti
gambar/audio/video/database. Cipher **26 huruf** (a, b, d, e, f, h) hanya
memproses huruf dan **akan merusak file biner** — itu perilaku yang benar,
bukan bug.

### Format file `.dat`

Hasil enkripsi file dibungkus envelope **KRI1** agar nama asli, tipe MIME, dan
cipher-nya ikut tersimpan:

```
[0..3]   magic "KRI1"   [4] version   [5] cipher   [6..9] hdrLen (LE)
[10..]   header JSON (UTF-8)   [..] payload ciphertext
```

Rincian lengkap: [`docs/format-file.md`](docs/format-file.md).

### REST API (Ruby)

| Metode | Rute | Keterangan |
|---|---|---|
| `GET` | `/health` | status server |
| `GET` | `/api/ciphers` | daftar cipher + parameter |
| `POST` | `/api/encrypt` | enkripsi teks/biner |
| `POST` | `/api/decrypt` | dekripsi teks/biner |
| `POST` | `/api/encrypt-file` | enkripsi file → `.dat` (base64) |
| `POST` | `/api/decrypt-file` | dekripsi `.dat` → file asli |

Contoh:

```bash
curl -s http://127.0.0.1:9292/api/encrypt \
  -H 'Content-Type: application/json' \
  -d '{"cipher":"vigenere","input":"U0VSQU5HIFNVQlVIIFNFS0FMSSA=","key":"LEMON","mode":"text"}'
# {"output":"ZGlkb2Fyd2dwaHN3cXlud20=","meta":{...}}
```

`input`/`output` memakai **base64** agar byte biner aman lewat JSON.
Dokumentasi rinci: [`apps/api/README.md`](apps/api/README.md).

---

## Menjalankan pengujian

```bash
# sekaligus (typecheck + tes web + spec Ruby)
pnpm verify
```

Atau terpisah:

```bash
pnpm typecheck      # TypeScript
pnpm lint           # ESLint
pnpm test           # Vitest  (254 tes)
pnpm api:test       # RSpec   (127 contoh)

# demo cepat (satu perintah, jalan offline)
pnpm demo

# bukti lintas-implementasi & alur file
cd apps/web
pnpm cross-verify   # 27 vektor: TypeScript == Ruby == vektor acuan
pnpm roundtrip      # 5 kategori file -> byte-identik setelah enkripsi+dekripsi
pnpm screenshots    # ambil screenshot antarmuka (butuh dev server hidup)
```

| Perintah | Hasil yang diharapkan |
|---|---|
| `pnpm demo` | **SEMUA LULUS** (9 cipher + 27 vektor) |
| `pnpm test` | 254 tes lulus |
| `pnpm api:test` | 127 contoh, 0 kegagalan |
| `pnpm cross-verify` | **27/27 identik** (enkripsi & dekripsi) |
| `pnpm roundtrip` | **15/15 byte-identik** (5 kategori × 3 cipher biner) |

---

## Bukti & laporan

| Isi | Lokasi |
|---|---|
| Laporan UTS (PDF) | `laporan/laporan-uts-kriptografi.pdf` *(disusun pada langkah S29)* |
| Screenshot antarmuka (R1) | `laporan/screenshot/ui-*.png`, `file-*.png` |
| Tabel bukti cross-verify TS↔Ruby | `laporan/uji/cross-verify.md` |
| Hasil uji file 5 kategori (R2) | `laporan/uji-file/roundtrip.json` |
| Rencana kerja & log progres | `docs/PLAN.md` |
| Spesifikasi format `.dat` | `docs/format-file.md` |

---

## Struktur repositori

```
firdauscipher/
├── apps/
│   ├── web/                 Next.js 15 — GUI + semua cipher (TypeScript)
│   │   ├── src/lib/crypto/  core.ts, vigenere.ts, playfair.ts, ... (11 modul)
│   │   ├── src/components/  panel teks, panel file, pemilih cipher
│   │   ├── scripts/         cross-verify.ts, roundtrip-test.ts, screenshots.ts
│   │   └── tests/           tes integrasi UI
│   └── api/                 Ruby Sinatra — REST API + GUI mini
│       ├── lib/firdaus_cipher/  port Ruby semua cipher
│       ├── spec/                RSpec (127 contoh)
│       └── bin/server           server lokal (WEBrick)
├── packages/
│   ├── vectors/             vectors.json (27 kasus) + generate.py (acuan)
│   └── testfiles/           contoh.txt/.png/.sqlite/.wav/.mp4
├── docs/                    PLAN.md, format-file.md
└── laporan/                 laporan PDF, screenshot, bukti uji
```

---

## Pemecahan masalah

| Masalah | Penyebab & solusi |
|---|---|
| `bundle: command not found` | Ubuntu memasang `bundle3.3`. Buat symlink: `ln -sf /usr/bin/bundle3.3 ~/.local/bin/bundle` (dan `bundler3.3` → `bundler`). |
| Gem gagal dikompilasi (`puma`, `prism`) | Butuh `ruby-dev`. Di lokal lewati saja: `bundle config set --local without "production lint"`. |
| Halaman web **HTTP 500** | `pnpm build` dan `pnpm dev` memakai folder `.next` yang sama. Hentikan dev, jalankan `rm -rf apps/web/.next`, lalu `pnpm dev` lagi. |
| Hasil mode teks "kehilangan" spasi | Cipher 26 huruf memang hanya memproses A–Z; spasi/tanda baca dilewati dan ada pemberitahuan. Gunakan cipher biner untuk mempertahankan byte apa adanya. |
| File hasil `.dat` tidak bisa dibuka | `.dat` adalah **envelope terenkripsi**, bukan file aslinya. Dekripsi dulu lewat tab **Dekripsi File (.dat)** dengan kunci yang sama. |
| `pnpm screenshots` gagal: Chromium tidak ditemukan | Pasang browser: `npx playwright install chromium`, atau set `CHROME_PATH` ke binary Chrome/Chromium yang ada. |

---

## Lisensi & konteks akademik

Dibuat untuk **UTS mata kuliah Kriptografi** (Semester 7). Kode ditulis sendiri,
tanpa duplikasi karya orang lain (sesuai aturan anti-plagiarisme soal UTS).
