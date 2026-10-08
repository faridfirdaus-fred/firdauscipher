# FirdausCipher — API (Ruby)

Implementasi **Ruby kedua** dari semua cipher FirdausCipher, plus **REST API**
dan **GUI mini** (ERB). Dibangun dengan **Ruby 3.3 + Sinatra 4**.

Fungsinya bukan menggantikan frontend, melainkan **membuktikan** hasil: seluruh
cipher ditulis ulang dalam bahasa berbeda, lalu hasilnya dibandingkan
byte-per-byte dengan TypeScript dan dengan vektor acuan (Python).

> README utama (cara menjalankan dari nol): [`../../README.md`](../../README.md)

---

## Menjalankan

```bash
cd apps/api
bundle config set --local without "production lint"   # lokal: lewati puma & rubocop
bundle install

bundle exec ruby bin/server        # http://127.0.0.1:9292
PORT=3000 bundle exec ruby bin/server   # port lain
```

Dari root repositori bisa juga:

```bash
pnpm api            # sama dengan bundle exec ruby bin/server
```

Cek:

```bash
curl -s http://127.0.0.1:9292/health
# {"status":"ok","service":"firdauscipher-api","ruby":"3.3.8","version":1}
```

- **GUI mini:** <http://127.0.0.1:9292/>
- **Daftar cipher:** <http://127.0.0.1:9292/api/ciphers>

> **Mengapa WEBrick?** `bin/server` memakai WEBrick (murni Ruby) agar lokal tidak
> perlu compiler/`ruby-dev`. Di server produksi, `puma` dipakai dan `bundle config`
> di atas tidak diterapkan.

---

## Rute

| Metode | Rute | Body / keterangan |
|---|---|---|
| `GET` | `/health` | status server |
| `GET` | `/api/ciphers` | daftar cipher + parameter + `label` siap tampil |
| `POST` | `/api/encrypt` | `{ cipher, input(base64), mode, key \| params }` |
| `POST` | `/api/decrypt` | idem |
| `POST` | `/api/encrypt-file` | `{ cipher, name, mime, input(base64), key \| params }` → `.dat` |
| `POST` | `/api/decrypt-file` | `{ cipher, input(base64 .dat), key \| params }` → file asli |
| `GET` | `/` | GUI mini |
| `POST` | `/gui` | aksi GUI mini |
| `OPTIONS` | `*` | preflight CORS |

`input`/`output` memakai **base64** supaya byte biner (termasuk `0x00`) aman
lewat JSON. `mode` bernilai `text` (hanya huruf A–Z) atau `binary` (semua byte).
Jika `mode` tidak diisi, nilainya mengikuti sifat cipher (`isAlpha`).

### Contoh

```bash
# enkripsi teks
curl -s http://127.0.0.1:9292/api/encrypt \
  -H 'Content-Type: application/json' \
  -d '{"cipher":"vigenere","input":"U0VSQU5HIFNVQlVIIFNFS0FMSQ==","key":"LEMON","mode":"text"}'
```

```json
{
  "output": "ZGlkb2Fyd2dwaHN3cXlud20=",
  "meta": {
    "cipher": "vigenere",
    "cipherId": 1,
    "name": "Vigenere Standard",
    "direction": "encrypt",
    "mode": "text",
    "isAlpha": true,
    "inputBytes": 19,
    "outputBytes": 17,
    "inputText": "SERANG SUBUH SEKALI",
    "outputText": "didoarwgphswqynwm"
  }
}
```

```bash
# dekripsi kembali -> "serangsubuhsekali"
# (mode teks hanya memproses A-Z, jadi spasi & huruf besar TIDAK dikembalikan)
curl -s http://127.0.0.1:9292/api/decrypt \
  -H 'Content-Type: application/json' \
  -d '{"cipher":"vigenere","input":"ZGlkb2Fyd2dwaHN3cXlud20=","key":"LEMON","mode":"text"}'
```

> **Perilaku mode teks.** Cipher 26 huruf membuang semua karakter non-alfabet
> sebelum memproses, sehingga hasil dekripsi berupa huruf kecil tanpa spasi
> (`serangsubuhsekali`, bukan `SERANG SUBUH SEKALI`). Ini sesuai spesifikasi
> cipher klasik. Gunakan **mode biner** jika ingin byte apa adanya dipertahankan.

Error dikembalikan sebagai JSON dengan status 400:

```json
{ "error": "bad_request", "message": "Field \"cipher\" wajib diisi." }
```

---

## Susunan kode

```
apps/api/
├── app.rb                     rute Sinatra + CORS + GUI mini
├── bin/
│   ├── server                 server lokal (WEBrick)
│   └── cross_cli.rb           CLI: baca JSON dari stdin, jalankan cipher (dipakai cross-verify)
├── lib/firdaus_cipher/
│   ├── ciphers.rb             registry cipher_defs + run_cipher() (paritas index.ts)
│   ├── core.rb                sanitize26, mod, modInverse, matriks, base64
│   ├── envelope.rb            format file .dat (magic KRI1) + tabel CIPHER_IDS
│   ├── vigenere.rb            a) Vigenere + b) Auto-Key
│   ├── extended_vigenere.rb   c) Extended Vigenere 256 ASCII
│   ├── playfair.rb            d) Playfair
│   ├── affine.rb              e) Affine
│   ├── hill.rb                f) Hill
│   ├── super_encryption.rb    g) Super Enkripsi
│   ├── columnar.rb            Transposisi Kolom (bagian dari g)
│   └── enigma.rb              h) Enigma (Bonus)
├── spec/                      RSpec — 127 contoh
└── views/                     GUI mini (ERB)
```

`lib/firdaus_cipher/ciphers.rb` adalah cerminan `src/lib/crypto/index.ts`:
daftar cipher, huruf, mode, dan `label` harus sama persis di kedua sisi. Cipher
komponen (Transposisi Kolom) ditandai `component_of:` supaya tidak ada dua cipher
berlabel huruf yang sama — lihat catatan #21 di `docs/PLAN.md`.

---

## Pengujian

```bash
bundle exec rspec                       # 127 contoh
bundle exec rubocop                     # gaya kode (gem grup "lint")
```

Atau dari root: `pnpm api:test`.

| Berkas spec | Cakupan |
|---|---|
| `core_spec.rb` | utilitas inti (sanitize, mod, matriks, base64) |
| `vectors_spec.rb` | 27 test vector dijalankan di Ruby |
| `app_spec.rb` | rute REST API + daftar cipher |
| `cross_spec.rb` | paritas hasil dengan TypeScript |
| `file_flow_spec.rb` | alur file `.dat` (enkripsi → dekripsi byte-identik) |

Bukti lintas-implementasi (dijalankan dari sisi web):

```bash
cd ../web && pnpm cross-verify       # 27/27 identik (TS == Ruby == acuan)
```

---

## Catatan

- **CORS** — origin diatur lewat env `ALLOWED_ORIGIN` (default `*`).
- **Mode teks vs biner** — cipher 26 huruf hanya memproses A–Z; memakainya pada
  file biner akan merusak file (perilaku benar). Untuk file gunakan cipher biner
  (c, g).
- **Bundler** — jika `bundle: command not found`, lihat bagian *Shims bundler*
  di [README utama](../../README.md#pemecahan-masalah).
