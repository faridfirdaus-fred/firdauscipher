# FirdausCipher — Web (frontend)

Antarmuka web FirdausCipher: 8 cipher klasik untuk **mode teks** dan **mode file**.
Dibangun dengan **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 4**,
seluruh proses cipher berjalan **di sisi klien** (tidak ada data yang dikirim ke
server saat memakai aplikasi).

> README utama (cara menjalankan dari nol): [`../../README.md`](../../README.md)

---

## Menjalankan

```bash
# dari root repositori (monorepo pnpm)
pnpm install
pnpm dev                       # http://localhost:3000
```

Atau dari folder ini:

```bash
pnpm dev                       # dev server
pnpm build                     # build produksi
pnpm start                     # jalankan hasil build
```

> **Jangan** menjalankan `pnpm build` dan `pnpm dev` bersamaan — keduanya
> memakai folder `.next` yang sama sehingga dev server bisa error 500.
> Jika terjadi: hentikan dev, `rm -rf .next`, lalu `pnpm dev` lagi.

---

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | dev server (Turbopack) |
| `pnpm build` | build produksi |
| `pnpm start` | jalankan hasil build |
| `pnpm typecheck` | cek tipe TypeScript (`tsc --noEmit`) |
| `pnpm lint` | ESLint |
| `pnpm test` | tes unit & integrasi (Vitest) |
| `pnpm test:coverage` | tes + laporan cakupan |
| `pnpm roundtrip` | uji 5 kategori file → byte-identik setelah enkripsi+dekripsi |
| `pnpm cross-verify` | bandingkan hasil TS ↔ Ruby ↔ vektor acuan |
| `pnpm screenshots` | ambil screenshot antarmuka tiap cipher |

---

## Susunan kode

```
src/
├── app/
│   ├── page.tsx            halaman utama: pilih cipher → mode → jalankan
│   └── layout.tsx          kerangka & metadata
├── components/
│   ├── cipher-selector.tsx pemilih cipher (a–h)
│   ├── mode-panel.tsx      tab "Mode Teks" / "Mode File"
│   ├── text-panel.tsx      panel enkripsi/dekripsi teks
│   ├── file-panel.tsx      panel enkripsi/dekripsi file (.dat)
│   ├── key-fields.tsx      kolom parameter dinamis per cipher
│   └── ui/                 komponen dasar (button, card, tabs, select, alert)
└── lib/
    ├── crypto/             LOGIKA CIPHER (inti aplikasi)
    │   ├── index.ts        registry CIPHERS + runCipher() + cipherLabel()
    │   ├── core.ts         sanitize26, mod, modInverse, matriks, base64
    │   ├── envelope.ts     format file .dat (magic KRI1)
    │   ├── vigenere.ts     a) Vigenere + b) Auto-Key
    │   ├── extended-vigenere.ts   c) Extended Vigenere 256 ASCII
    │   ├── playfair.ts     d) Playfair
    │   ├── affine.ts       e) Affine
    │   ├── hill.ts         f) Hill (2×2 & 3×3)
    │   ├── super-encryption.ts    g) Super Enkripsi
    │   ├── columnar.ts     Transposisi Kolom (bagian dari g)
    │   └── enigma.ts       h) Enigma (Bonus)
    ├── cipher-runner.ts    alur enkripsi/dekripsi FILE (pakai envelope)
    ├── worker-client.ts    pemanggil Web Worker
    ├── cipher.worker.ts    worker: jalankan cipher tanpa membekukan UI
    ├── use-cipher-worker.ts  hook React pembungkus worker-client
    └── file-utils.ts       validasi & baca file (batas 100 MB)
```

**Poin penting:** `src/lib/crypto/index.ts` adalah satu-satunya sumber kebenaran
daftar cipher. Untuk menambah cipher, tambahkan entri di `CIPHERS` — dropdown,
badge, dan validasi ikut menyesuaikan otomatis (label dibuat oleh `cipherLabel()`,
jangan di-hardcode di komponen).

---

## Cara kerja

1. `page.tsx` menyimpan cipher terpilih, menampilkan `mode-panel.tsx`.
2. Panel teks/file memanggil `worker-client.ts` → `cipher.worker.ts` (lewat hook
   `use-cipher-worker.ts`) agar perhitungan berat tidak membekukan antarmuka.
3. Worker memanggil `runCipher()` di `src/lib/crypto/index.ts`, yang memilih
   modul cipher sesuai slug.
4. Untuk **file**, `cipher-runner.ts` membungkus hasilnya ke envelope `.dat`
   (magic `KRI1`) sehingga nama asli, MIME, dan cipher tersimpan dan file bisa
   didekripsi kembali.

Cipher **26 huruf** (a, b, d, e, f, h) hanya memproses huruf A–Z — memakai cipher
ini pada file biner **akan merusak file**, dan itu perilaku yang benar. Gunakan
cipher **biner** (c, g) untuk file.

---

## Pengujian

```bash
pnpm typecheck && pnpm lint && pnpm test     # 254 tes, 19 file
pnpm cross-verify                            # 27/27 identik dengan Ruby
pnpm roundtrip                               # 15/15 byte-identik (5 kategori)
```

`cross-verify` dan `roundtrip` menulis bukti ke `../../laporan/uji*` sehingga
bisa langsung dilampirkan di laporan.

`pnpm screenshots` memerlukan **dev server hidup** dan Chromium. Jika Chromium
tidak ditemukan, jalankan `npx playwright install chromium` atau set
`CHROME_PATH` ke binary Chrome/Chromium yang ada.
