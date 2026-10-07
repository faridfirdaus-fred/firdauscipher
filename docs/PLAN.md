# TODO — FirdausCipher (Project UTS Kriptografi)

> **Status file:** DRAFT v4 — keputusan utama sudah terkunci, menunggu ACC final
> **Dibuat:** 2026-10-07 · **Revisi:** v4 (deadline 9 Okt 2026, tim = sendiri, jadwal & prioritas P0–P4, hapus draft v1)
> **⏰ DEADLINE: 9 OKTOBER 2026** — sisa ±2 hari. Lihat §1.1 untuk jadwal & prioritas.
> **Sumber soal:** `Soal UTS Kriptografi 20261.txt` / `.pdf` (folder ini)
> **Dosen:** Ir. Randi Rizal, Ph.D. — Informatika, Universitas Siliwangi

---

## 0. CARA PAKAI FILE INI (baca ini dulu, jangan eksplorasi ulang)

**Untuk AI/agent (OpenCode) yang membaca file ini di sesi berikutnya:**

1. **Baca file ini saja dulu.** Jangan buka source code, jangan `ls` repo, jangan baca soal PDF lagi — semua konteks ada di sini.
2. Cari baris `STATUS: TODO` paling atas → itu langkah aktif berikutnya. Kerjakan **hanya langkah itu**.
3. Setiap step punya: `🔑 Kata kunci` (untuk grep/konteks), `📁 File` (file yang boleh dibuka), `✅ Verifikasi` (perintah + expected output), `🧠 Catatan` (keputusan yang sudah dikunci).
4. Selesai → ubah `- [ ]` → `- [x]` **dan** `STATUS: TODO` → `STATUS: DONE`, lalu **tambahkan 1 baris di §9 Log Progres**.
5. Ragu / butuh keputusan desain baru → tulis di §7 Pertanyaan Terbuka, **jangan improvisasi**.
6. Jangan buka file di luar `📁 File` step aktif, kecuali ada error yang menunjuk ke file lain.
7. **Wajib patuhi §3 Aturan Coding (OpenCode)** — itu aturan yang mengikat seluruh proyek.

**Untuk manusia (Fred):** tandai `[x]` kalau step selesai. Lihat §1 ringkasan cepat, §7 untuk hal yang perlu keputusanmu.

**Konvensi penanda:**

| Penanda | Arti |
|---|---|
| `- [ ]` / `- [x]` | belum / sudah dikerjakan |
| `STATUS: TODO` | belum mulai |
| `STATUS: WIP` | sedang dikerjakan |
| `STATUS: DONE` | selesai **dan** verifikasi lolos |
| `STATUS: BLOCKED` | butuh keputusan/kredensial (catat alasannya) |
| `🔑` | kata kunci untuk retrieval konteks murah |
| `⭐` | langkah kritis untuk nilai (spek wajib / bonus) |
| `🚀` | langkah hosting/deploy |

---

## 1. RINGKASAN PROGRES

| Fase | Step | Isi | Jumlah | Status |
|---|---|---|---|---|
| F0 | S01–S04 | Monorepo + OpenCode rules + skema file + test vectors | 4 | ✅ 3/4 |
| F1 | S05 | Core crypto utils | 1 | ✅ 1/1 |
| F2 | S06–S09 | 5 cipher 26 huruf ⭐ (a, b, d, e, f) | 4 | ✅ 4/4 |
| F3 | S10–S12 | Extended Vigenere, Transposisi, Super enkripsi ⭐ (c, g) | 3 | ✅ 3/3 |
| F4 | S13–S15 | File biner, envelope, round-trip 5 kategori ⭐ | 3 | ✅ 3/3 |
| F5 | S16–S18 | GUI web + validasi kunci + worker | 3 | ✅ 3/3 |
| F6 | S19 | ⭐ BONUS 1 — Enigma | 1 | ✅ 1/1 |
| F7 | S20–S22 | ⭐ BONUS 2 — Ruby (backend) + cross-verify | 3 | ⬜ 0/3 |
| F8 | S23–S26 | 🚀 Hosting: Cloudflare Workers + Render + CI/CD | 4 | ⬜ 0/4 |
| F9 | S27–S31 | QA, README, laporan PDF, kreativitas, paket | 5 | ⬜ 0/5 |
| | | **TOTAL** | **31** | ✅ 12/31 |

**➡️ NEXT ACTION: S02** (P0)

---

## 1.1 JADWAL & PRIORITAS (deadline 9 Okt 2026)

**Hari ini = 7 Okt 2026, sisa ±2 hari.** Kerjakan berurutan P0 → P4. Kalau waktu mepet, **putus dari bawah**, jangan dari atas.

| Prioritas | Isi | Step | Target selesai |
|---|---|---|---|
| **P0 — WAJIB, kerjakan malam ini** | Fondasi + core engine + semua cipher 26 huruf & 256 karakter (spek a–g) | S01–S12 | **7 Okt** |
| **P1 — WAJIB** | File biner + envelope `.dat` + round-trip 5 kategori + GUI + validasi | S13–S17 | **8 Okt pagi** |
| **P2 — WAJIB (bonus & hosting)** | ⭐ Enigma (bonus 1) + ⭐ Ruby backend (bonus 2) + cross-verify + deploy Cloudflare & Render | S19–S26 | **8 Okt malam** |
| **P3 — WAJIB penutup** | QA/test + README + laporan PDF + packaging zip | S27–S29, S31 | **9 Okt pagi** |
| **P4 — NILAI TAMBAH (boleh dilewat)** | Web Worker (S18) + kreativitas/inovasi (S30) | S18, S30 | kalau masih ada waktu |

**Aturan kalau mepet (urut prioritas yang dipertahankan):**
1. Semua cipher a–g jalan benar (teks + file + base64 + save `.dat`) — **tidak boleh gagal**
2. Laporan PDF lengkap (R1–R3) + README — **tidak boleh gagal**
3. ⭐ Bonus 1 Enigma
4. ⭐ Bonus 2 Ruby + hosting
5. Kreativitas/inovasi (R4) + Web Worker

> Kalau P2 tidak selesai, **tetap tulis apa adanya di laporan** (soal: "kalau ada yang tidak selesai, tulis apa adanya") — jangan hilangkan bonus, cukup tandai belum selesai.

---

## 2. KEPUTUSAN TERKUNCI (jangan diubah tanpa ACC ulang)

### 2.1 Nama & struktur

| # | Keputusan | Nilai |
|---|---|---|
| D1 | **Nama produk / monorepo** | **`FirdausCipher`** — repo/folder slug: `firdauscipher` |
| D2 | **Nama app frontend** | **`firdauscipher-web`** (Worker Cloudflare) |
| D3 | **Nama app backend** | **`firdauscipher-api`** (service Render) |
| D4 | **Lokasi monorepo** | `/home/fred-demarco/Development/firdauscipher` ✅ **dikonfirmasi Fred** |
| D5 | **Bentuk repo** | **Monorepo** (pnpm workspaces), 2 app + 1 package bersama |
| D6 | **Manajer paket** | `pnpm` (v12.4.2 tersedia) — **bukan** npm/yarn |
| D7 | **Namespace Ruby** | `FirdausCipher` — folder `apps/api/lib/firdaus_cipher/` (Ruby pakai snake_case) |
| D23 | **Tim** | **Kerja sendiri** (bukan kelompok) ✅ dikonfirmasi |
| D24 | **Deadline** | **9 Oktober 2026** ✅ dikonfirmasi — prioritas P0–P4 di §1.1 |

> **Nama dipilih Fred:** `FirdausCipher` (dari "Firdaus" + cipher). Ejaan resmi memakai **Cipher** (bukan "chiper"). Slug teknis selalu **lowercase**: `firdauscipher`.

### 2.2 Arsitektur & hosting

| # | Keputusan | Nilai |
|---|---|---|
| D8 | **Frontend** | Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn/ui — pola ikut `~/Development/mlfq-simulation-frontend` |
| D9 | **Hosting frontend** | **Cloudflare Workers (Static Assets)** — `output: "export"`, deploy `wrangler deploy` |
| D10 | **Hosting backend** | **Render** (runtime Ruby native) — **dipilih Render, bukan Vercel** |
| D11 | **Alasan Render > Vercel** | Vercel Ruby runtime masih **beta** & hanya untuk file-based `/api/*.rb` (bukan app Sinatra utuh). Render punya `runtime: ruby` native + Blueprint `render.yaml` |
| D12 | **Peran backend** | Backend = **implementasi Ruby** (Bonus 2) yang di-expose sebagai **REST API + GUI mini** → sekaligus jadi service yang diminta |
| D13 | **Crypto di mana?** | Semua cipher **jalan di client (browser)** untuk app utama. Backend hanya untuk bonus Ruby + cross-verify |
| D14 | **Kenapa frontend static export** | Semua crypto murni client-side → tidak butuh server. Static export = paling ringan, gratis 100k req/hari, cepat di edge. Kalau nanti butuh SSR → fallback adapter `@opennextjs/cloudflare` |

### 2.3 Konvensi teknis

| # | Keputusan | Nilai |
|---|---|---|
| D15 | **Bahasa utama** | TypeScript |
| D16 | **Core crypto** | Pure TS, **isomorphic & bebas API Node** (jalan di browser), di `apps/web/src/lib/crypto/` |
| D17 | **Unit test** | Vitest (web) + RSpec (api) |
| D18 | **Envelope file ciphertext** | Ekstensi `.dat`, format `KRI1` + header JSON + payload (detail S03) |
| D19 | **Konvensi huruf** | Proses di UPPERCASE, output ciphertext **lowercase tanpa spasi**, lalu base64 (spek 5) |
| D20 | **Test vectors** | 1 file JSON di `packages/vectors/` dipakai bersama TS & Ruby |
| D21 | **Repo Git** | GitHub, branch `main` = produksi, CI GitHub Actions |
| D22 | **Coding agent** | **OpenCode** — aturan di `AGENTS.md` + `opencode.json` (§3) |

---

## 3. ATURAN CODING (OpenCode) — mengikat seluruh proyek

> Ini yang harus ditulis ke `AGENTS.md` + `opencode.json` di S02. Ringkasan kontraknya:

### 3.1 Aturan wajib
1. **Selalu baca `docs/PLAN.md`** (= symlink ke file TODO ini) sebelum menulis kode. Cari `STATUS: TODO` teratas → kerjakan hanya itu.
2. **Bahasa:** TypeScript strict untuk `apps/web`, Ruby idiomatik untuk `apps/api`. Komentar & commit message boleh Indonesia, identifier **Inggris**.
3. **Jangan install library cipher pihak ketiga.** Semua algoritma ditulis sendiri (aturan dosen anti-plagiarisme). Library yang diizinkan hanya: matriks/modulo/aljabar linier (Sp10), UI, testing, framework.
4. **Paritas 1:1 TS ↔ Ruby.** Setiap fungsi cipher di TS harus punya padanan semantik di Ruby dengan nama & perilaku sama. Diuji lewat `packages/vectors/vectors.json`.
5. **Core crypto bebas platform:** `apps/web/src/lib/crypto/**` **tidak boleh** pakai `Buffer`, `fs`, `process`, `node:*` — harus jalan di browser & Cloudflare Workers runtime.
6. **Jangan ubah** `packages/vectors/vectors.json` tanpa memperbarui kedua implementasi + menjalankan S22 (cross-verify).
7. **Setiap perubahan kode wajib:** (a) `pnpm -w lint`, (b) `pnpm -w test`, (c) tambah 1 baris di §9 Log Progres kalau step selesai.
8. **Commit convention:** Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`), pesan singkat, satu step = satu commit/PR.
9. **Jangan commit secret.** Semua kredensial lewat env var (`.env.local` lokal, dashboard Cloudflare/Render/GitHub Secrets).
10. **Format & lint:** Prettier + ESLint (web), RuboCop (api). Jalankan sebelum commit.

### 3.2 Perintah standar (dipakai OpenCode)
```bash
pnpm install                               # install semua workspace
pnpm --filter firdauscipher-web dev        # jalankan frontend (localhost:3000)
pnpm --filter firdauscipher-web test       # vitest
pnpm -w lint                               # lint semua
cd apps/api && bundle exec puma -p 9292    # jalankan backend Ruby
cd apps/api && bundle exec rspec           # test Ruby
pnpm --filter firdauscipher-web deploy     # wrangler deploy (Cloudflare)
```

### 3.3 Larangan eksplisit
- ❌ Copy-paste kode dari repo/tutorial lain (nilai 0 — aturan dosen R5).
- ❌ Pakai `file.text()` untuk file biner (merusak byte) — pakai `arrayBuffer()`.
- ❌ Pakai `TextDecoder` di jalur enkripsi biner.
- ❌ Hardcode kunci/URL/secret.
- ❌ Commit `node_modules/`, `.next/`, `out/`, `vendor/bundle/`.

---

## 4. KONTEKS SOAL (hasil ekstraksi — tidak perlu buka PDF lagi)

### 4.1 Fitur wajib (a–g) + Bonus (h–i)

| Kode | Fitur | Step |
|---|---|---|
| a | Vigenere standard (26 huruf) | S06 |
| b | Auto-Key Vigenere (26 huruf) | S06 |
| c | Extended Vigenere (256 ASCII) | S10 |
| d | Playfair (26 huruf) | S07 |
| e | Affine (26 huruf) | S08 |
| f | Hill (26 huruf) | S09 |
| g | **Super enkripsi** (Extended Vigenere + transposisi kolom) | S11 + S12 |
| h | ⭐ Bonus 1 — Enigma cipher | S19 |
| i | ⭐ Bonus 2 — Implementasi berbahasa **Ruby** | S20–S22 |

Catatan: key berulang panjang bebas; Playfair matriks 5×5 (I/J digabung); Affine gcd(a,26)=1; Hill determinan koprima 26.

### 4.2 Spesifikasi wajib (1–11) — berlaku ke SEMUA cipher
- **Sp1** Input: file sembarang (teks **maupun biner**) **atau** diketik dari keyboard.
- **Sp2** Cipher 26-huruf: **hanya alfabet** yang dienkripsi; angka/spasi/tanda baca **dibuang** dari plainteks **dan** cipherteks.
- **Sp3** Harus bisa **dekripsi** balik ke plainteks semula.
- **Sp4** Tampilkan pesan (plainteks & cipherteks) di layar dalam **base64**.
- **Sp5** Cipherteks di layar: **tanpa spasi**, **semua huruf kecil** (atau kapital), dalam base64.
- **Sp6** Bisa **simpan cipherteks ke file** (save as / download as **binary file**).
- **Sp7** Kunci diinput pengguna, **panjang bebas**.
- **Sp8** Enkripsi file: baca **setiap byte termasuk header** file. File terenkripsi memang tidak bisa dibuka aplikasi aslinya sampai didekripsi.
- **Sp9** Format file cipherteks bebas (mis. `.dat`). Saat dekripsi, file harus kembali ke **ekstensi/tipe semula** → **boleh menyimpan nama/ekstensi file plaintext di dalam file cipherteks**.
- **Sp10** Boleh pakai library untuk inverse modulo, matriks, aljabar linier.
- **Sp11** Boleh pakai framework apa pun (React, Flask, Rails, …).

### 4.3 ⚠️ ATURAN LAPORAN DARI DOSEN (WAJIB — ini yang dinilai)

> Laporan yang diupload di **Classroom** adalah **file format PDF** yang berisi:

| # | Isi laporan | Step terkait |
|---|---|---|
| R1 | **Tampilan antarmuka program (print screen)** | S29 (ambil screenshot dari hasil S16–S19 & S26) |
| R2 | **Contoh plainteks dan cipherteks** untuk **text, gambar, file database, audio, video** + penjelasannya | S15 (uji file), S29 |
| R3 | **Kode Program** — lengkap dengan **README berisi cara menjalankan program** | S28 (README), S29 |
| R4 | **Kreativitas dan inovasi menjadi nilai tambah** ⭐ | S30 |
| R5 | **Nilai nol (0)** bagi yang **plagiat / duplikasi** dengan program lain | §3.3 (aturan larangan) |

**Implikasi ke rencana:**
- **S15 wajib** menguji 5 kategori file: **teks, gambar, database, audio, video** (bukan cuma "≥5 tipe acak"). Bukti SHA-256 + screenshot disimpan di `laporan/uji-file/`.
- **S28** README wajib ada di **kedua** app dan bisa diikuti dari nol.
- **S30** dikerjakan serius — ini pintu nilai tambah (lihat daftar ide di catatan S30).
- Semua algoritma tulisan sendiri (§3.3) → aman dari R5. Simpan bukti proses (log commit, catatan manual) kalau diminta.

---

## 5. PETA FILE (target akhir)

```
~/Development/firdauscipher/             ← MONOREPO (root)
├── AGENTS.md                            ← S02: aturan OpenCode
├── opencode.json                        ← S02: config OpenCode (instructions)
├── package.json                         ← root scripts (pnpm workspaces)
├── pnpm-workspace.yaml
├── render.yaml                          ← 🚀 S24: blueprint Render (backend Ruby)
├── .github/workflows/ci.yml             ← 🚀 S25: CI/CD
├── .gitignore
├── docs/
│   ├── PLAN.md                          ← symlink ke file TODO ini
│   ├── format-file.md                   ← S03: skema envelope .dat
│   └── arsitektur.md                    ← S26: diagram arsitektur & hosting
├── packages/
│   └── vectors/
│       ├── package.json
│       └── vectors.json                 ← S04: test vectors bersama TS+Ruby
├── apps/
│   ├── web/                             ← FRONTEND (Next.js → Cloudflare Workers)
│   │   ├── wrangler.jsonc               ← 🚀 S23
│   │   ├── next.config.ts               ← output: "export"
│   │   ├── AGENTS.md                    ← S02: aturan khusus app web
│   │   ├── src/app/                     ← S16: halaman (GUI)
│   │   ├── src/components/              ← S16–S17: panel UI
│   │   ├── src/lib/crypto/              ← core cipher (murni TS)
│   │   │   ├── core.ts                  ← S05
│   │   │   ├── vigenere.ts              ← S06 (a + b)
│   │   │   ├── playfair.ts              ← S07
│   │   │   ├── affine.ts                ← S08
│   │   │   ├── hill.ts                  ← S09
│   │   │   ├── extended-vigenere.ts     ← S10
│   │   │   ├── columnar.ts              ← S11
│   │   │   ├── super-encryption.ts      ← S12
│   │   │   ├── enigma.ts                ← S19
│   │   │   ├── envelope.ts              ← S03 / S14
│   │   │   └── index.ts
│   │   ├── src/workers/crypto.worker.ts ← S18
│   │   ├── src/lib/api-client.ts        ← S22: panggil backend Ruby
│   │   ├── scripts/roundtrip-test.ts    ← S15
│   │   └── tests/
│   └── api/                             ← BACKEND (Ruby Sinatra → Render) = BONUS 2
│       ├── Gemfile / Gemfile.lock
│       ├── .ruby-version                ← 3.3.8
│       ├── config.ru
│       ├── app.rb                       ← S21: REST API + GUI mini
│       ├── AGENTS.md
│       ├── lib/firdaus_cipher/*.rb      ← S20–S21: port 1:1 dari TS
│       ├── views/index.erb
│       ├── public/
│       └── spec/
└── (opsional) scripts/                  ← S22 cross-verify

~/Documents/Kuliah/Semester 7/Kriptografi/UTS/
├── TODO.md                              ← file ini
├── Soal UTS Kriptografi 20261.{txt,pdf}
└── laporan/                             ← hasil akhir
    ├── laporan-uts-kriptografi.pdf      ← S29 (WAJIB PDF)
    ├── uji-file/                        ← S15 (5 kategori file + hash)
    ├── uji/                             ← S22 cross-verify, S26 smoke test
    ├── screenshot/                      ← S29
    └── firdauscipher-<nama>-<nim>.zip   ← S31
```

---

## 6. DAFTAR TODO

### FASE F0 — FONDASI & ATURAN

#### S01 — Scaffold monorepo + kedua app
- [x] STATUS: DONE
- 🔑 Kata kunci: monorepo, pnpm workspaces, pnpm-workspace.yaml, next.js 15, typescript, tailwind 4, shadcn, sinatra skeleton, git init, scaffold, firdauscipher
- 📦 Deliverable: monorepo `firdauscipher` dengan `apps/web` (Next.js jalan) + `apps/api` (Sinatra skeleton) + `packages/vectors`
- 📁 File: `firdauscipher/package.json`, `pnpm-workspace.yaml`, `apps/web/**` (hasil scaffold), `apps/api/Gemfile`, `apps/api/app.rb`, `.gitignore`
- ✅ Verifikasi: `pnpm install` sukses; `pnpm --filter firdauscipher-web dev` tampil halaman; `cd apps/api && bundle install && bundle exec ruby app.rb` server jalan
- 🧠 Catatan: Node v24.19.0, npm 12.0.2, pnpm 12.4.2, Ruby 3.3.8, bundler 2.5.22 semua tersedia. Ikuti pola `~/Development/mlfq-simulation-frontend`. `git init` + repo GitHub (D21). Nama paket di `package.json` = `firdauscipher-web` / `firdauscipher-api` (lowercase, wajib untuk pnpm). **Belum** pasang wrangler/render di step ini — itu S23/S24.

#### S02 — Aturan OpenCode (`AGENTS.md` + `opencode.json`)
- [ ] STATUS: TODO
- 🔑 Kata kunci: opencode, AGENTS.md, opencode.json, instructions, project rules, coding convention, per-app agents, docs/PLAN.md, symlink
- 📦 Deliverable: `AGENTS.md` root + `apps/web/AGENTS.md` + `apps/api/AGENTS.md` + `opencode.json` berisi `instructions`
- 📁 File: `AGENTS.md`, `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, `opencode.json`, `docs/PLAN.md`
- ✅ Verifikasi: `opencode.json` valid JSON; jalankan `opencode` di root → aturan terbaca (minta OpenCode menyebut isi `AGENTS.md`)
- 🧠 Catatan — isi minimal:
  - `AGENTS.md` root: tulis **§3 Aturan Coding** apa adanya (10 aturan wajib + perintah standar + larangan).
  - `apps/web/AGENTS.md`: stack Next.js/Tailwind/Vitest, larangan `Buffer`/`fs` di `src/lib/crypto`, cara tambah cipher baru (file + test + vectors).
  - `apps/api/AGENTS.md`: konvensi Ruby, RuboCop, paritas 1:1 dengan TS, cara jalan `puma`/`rspec`.
  - `opencode.json`: `{ "$schema": "...", "instructions": ["AGENTS.md", "docs/PLAN.md", "apps/*/AGENTS.md"] }` → supaya OpenCode **otomatis** baca TODO ini tiap sesi.
  - `docs/PLAN.md` = **symlink** ke file TODO ini (bukan copy) supaya tidak ada dua versi yang beda.

#### S03 — Bekukan skema envelope file `.dat` + konvensi global
- [x] STATUS: DONE
- 🔑 Kata kunci: envelope, magic bytes KRI1, header json, metadata filename, ekstensi asli, offset, little endian, binary format, restore extension
- 📦 Deliverable: `apps/web/src/lib/crypto/envelope.ts` (pack/unpack) + `docs/format-file.md`
- 📁 File: `apps/web/src/lib/crypto/envelope.ts`, `docs/format-file.md`
- ✅ Verifikasi: unit test pack→unpack mengembalikan metadata identik; byte plaintext tetap utuh
- 🧠 Catatan — **format dikunci**:
  ```
  [0..3]   magic  : "KRI1"            (4 byte ASCII)
  [4]      version: 0x01
  [5]      cipher : 1 byte enum (1=vigenere, 2=autokey, 3=extvigenere, 4=playfair,
                                 5=affine, 6=hill, 7=super, 8=enigma)
  [6..9]   hdrLen : uint32 little-endian
  [10..]   header : JSON UTF-8 { name, ext, mime, size, mode, params }
  [..]     payload: byte ciphertext
  ```
  - Semua **byte plaintext termasuk header file aslinya** ikut dienkripsi (Sp8). Envelope `KRI1` adalah lapisan luar yang ditambah **setelah** enkripsi → tidak melanggar Sp8.
  - `ext` + `name` disimpan supaya dekripsi bisa auto-restore ekstensi (Sp9).
  - `mode`: `"binary"` (byte mentah) atau `"base64-text"` (cipher 26-huruf yang membuang non-alfabet).

#### S04 — Test vectors bersama (JSON)
- [x] STATUS: DONE
- 🔑 Kata kunci: test vectors, known answer test, KAT, cross-language, json fixture, expected ciphertext, packages/vectors
- 📦 Deliverable: `packages/vectors/vectors.json` ≥3 kasus per cipher (plaintext, key, ciphertext, arah, catatan)
- 📁 File: `packages/vectors/vectors.json`, `packages/vectors/package.json`
- ✅ Verifikasi: JSON valid; setiap kasus punya `id, cipher, mode, key, plaintext, ciphertext`
- 🧠 Catatan: **satu-satunya sumber kebenaran** untuk S22. Ambil ≥1 kasus dari sumber kredibel (buku/paper) per cipher; sisanya self-generated tapi dibuktikan manual. ⭐ Bukti kuat di laporan.

---

### FASE F1 — CORE ENGINE

#### S05 — `lib/crypto/core.ts` (utils bersama)
- [x] STATUS: DONE
- 🔑 Kata kunci: alphabet 26, strip non-alpha, uppercase, base64 encode/decode, modInverse, extended euclid, matriks determinan, invers matriks mod 26, adjoin, block padding, filler X, byte latin1
- 📦 Deliverable: fungsi murni + unit test lengkap
- 📁 File: `apps/web/src/lib/crypto/core.ts`, `apps/web/src/lib/crypto/core.test.ts`
- ✅ Verifikasi: `pnpm --filter firdauscipher-web test core` lolos; `modInverse(a,26)` benar untuk a ∈ {1,3,5,7,9,11,15,17,19,21,23,25} dan melempar error untuk gcd≠1
- 🧠 Catatan — API dikunci:
  - `sanitize26(text): string` → buang non-alfabet, uppercase
  - `toBase64(bytes)/fromBase64(str)`, `bytesToLatin1/…`
  - `modInverse(a, m)`, `detMod(matrix, 26)`, `invertMatrixMod(matrix, 26)`
  - `padBlock(data, n, filler='X')`
  - **Dilarang** pakai `Buffer`/`fs`/`process` (D16).

---

### FASE F2 — CIPHER 26 HURUF ⭐ (spek a, b, d, e, f)

#### S06 — ⭐ Vigenere standard (a) + Auto-Key (b)
- [x] STATUS: DONE
- 🔑 Kata kunci: vigenere, standard, key repeat, C=(P+K)mod26, auto-key, autokey, keystream, key diikuti plaintext, dekripsi sekuensial, A=0
- 📦 Deliverable: `encryptVigenere/decryptVigenere` + `encryptAutoKey/decryptAutoKey`
- 📁 File: `apps/web/src/lib/crypto/vigenere.ts`, `vigenere.test.ts`
- ✅ Verifikasi: `ATTACKATDAWN`+`LEMON` → `LXFOPVEFRNHR`; `ATTACKATDAWN`+`QUEENLY` → `QNXEPVYTWTWP`; round-trip keduanya == plaintext
- 🧠 Catatan: sanitize dulu (Sp2). Key di-sanitize, key kosong → error. **Auto-key dekripsi wajib sekuensial** (plaintext yang sudah didapat jadi bagian kunci berikutnya) — sumber bug klasik.

#### S07 — ⭐ Playfair Cipher (d)
- [x] STATUS: DONE
- 🔑 Kata kunci: playfair, matriks 5x5, I/J digabung, digraph, filler X, rectangle swap, row shift, column shift
- 📦 Deliverable: `encryptPlayfair` + `decryptPlayfair` + `buildKeySquare(key)`
- 📁 File: `apps/web/src/lib/crypto/playfair.ts`, `playfair.test.ts`
- ✅ Verifikasi: key `MONARCHY`, `INSTRUMENTS` → `GATLMZCLRQXA` (cek vs vectors.json); panjang ciphertext selalu genap
- 🧠 Catatan — dikunci: **I/J digabung jadi I**, filler **X**, pasangan kembar disisipkan filler, panjang ganjil tambah filler di akhir.

#### S08 — ⭐ Affine Cipher (e)
- [x] STATUS: DONE
- 🔑 Kata kunci: affine, E(x)=(ax+b)mod26, D(x)=a^-1(x-b)mod26, gcd(a,26)=1, validasi kunci, 12 nilai a valid
- 📦 Deliverable: `encryptAffine` + `decryptAffine` + validator `a`
- 📁 File: `apps/web/src/lib/crypto/affine.ts`, `affine.test.ts`
- ✅ Verifikasi: a=5,b=8, `AFFINECIPHER` → `IHHWVCSWFRCP`; a=4 ditolak dengan pesan jelas
- 🧠 Catatan: `a` valid = {1,3,5,7,9,11,15,17,19,21,23,25}. UI menolak `a` invalid sebelum proses (dropdown).

#### S09 — ⭐ Hill Cipher (f)
- [x] STATUS: DONE
- 🔑 Kata kunci: hill cipher, matriks kunci nxn, determinan koprima 26, invers matriks mod 26, blok, padding X, perkalian matriks
- 📦 Deliverable: `encryptHill` + `decryptHill` + validator matriks
- 📁 File: `apps/web/src/lib/crypto/hill.ts`, `hill.test.ts`
- ✅ Verifikasi: key `[[6,24,1],[13,16,10],[20,17,15]]` (3×3), `ACT` → `POH`; matriks singular (det gcd 26 ≠1) ditolak
- 🧠 Catatan: ukuran n = 2 atau 3. Padding filler **X**. Validasi determinan koprima 26 **wajib**, pesan error menyebut nilai det-nya.

---

### FASE F3 — CIPHER 256 KARAKTER + SUPER ENKRIPSI ⭐ (spek c, g)

#### S10 — ⭐ Extended Vigenere (c)
- [x] STATUS: DONE
- 🔑 Kata kunci: extended vigenere, 256 ascii, byte 0-255, modulo 256, Uint8Array, biner, tanpa buang karakter
- 📦 Deliverable: `encryptExtVigenere(bytes,key)` + `decryptExtVigenere(bytes,key)`
- 📁 File: `apps/web/src/lib/crypto/extended-vigenere.ts`, `extended-vigenere.test.ts`
- ✅ Verifikasi: round-trip byte acak 0–255 (10 KB `crypto.getRandomValues`) kembali identik
- 🧠 Catatan: **tanpa sanitize** — semua byte termasuk 0x00, 0xFF, dan header file ikut diproses (Sp8). Output biner (`Uint8Array`), base64 hanya untuk tampilan (Sp4).

#### S11 — Transposisi Kolom (bagian dari g)
- [x] STATUS: DONE
- 🔑 Kata kunci: transposisi kolom, columnar transposition, urutan kolom alfabet, padding, baca baris tulis kolom
- 📦 Deliverable: `encryptColumnar` + `decryptColumnar`
- 📁 File: `apps/web/src/lib/crypto/columnar.ts`, `columnar.test.ts`
- ✅ Verifikasi: key `ZEBRAS` pada `WEAREDISCOVEREDFLEEATONCE` menghasilkan permutasi kolom benar (masuk vectors.json)
- 🧠 Catatan: operasi pada **byte** (bukan hanya alfabet) supaya bisa dipakai di super enkripsi file biner. Padding blok akhir byte 0x00 + simpan panjang asli di header envelope.

#### S12 — ⭐ Super Enkripsi (g) = Extended Vigenere + Transposisi Kolom
- [x] STATUS: DONE
- 🔑 Kata kunci: super enkripsi, komposisi cipher, urutan enkripsi, dekripsi kebalikan, key ganda, dua kunci
- 📦 Deliverable: `superEncrypt` + `superDecrypt`
- 📁 File: `apps/web/src/lib/crypto/super-encryption.ts`, `super-encryption.test.ts`
- ✅ Verifikasi: round-trip byte acak berhasil; ciphertext ≠ hasil tiap cipher tunggal
- 🧠 Catatan — **urutan dikunci**: enkripsi = `Extended Vigenere` → `Transposisi Kolom`; dekripsi = `Kolom⁻¹` → `Vigenere⁻¹`. UI sediakan 2 kolom kunci (Kunci 1 = Vigenere, Kunci 2 = Kolom) — §7 Q2.

---

### FASE F4 — FILE BINER & ENVELOPE ⭐ (spek 1, 6, 8, 9)

#### S13 — Input file biner + preview + deteksi tipe
- [x] STATUS: DONE
- 🔑 Kata kunci: input file, File API, ArrayBuffer, Uint8Array, deteksi teks vs biner, preview, drag and drop, size limit
- 📦 Deliverable: komponen input file membaca seluruh byte (termasuk header) + info file
- 📁 File: `apps/web/src/components/FileInput.tsx`, `apps/web/src/lib/file-utils.ts`
- ✅ Verifikasi: upload `.txt`, `.jpg`, `.docx`, `.db`, `.mp3`, `.mp4` → tampil nama, ukuran, tipe; byte count == ukuran file di disk
- 🧠 Catatan: baca `file.arrayBuffer()` (**bukan** `file.text()`). Tampilkan hexdump 64 byte pertama sebagai bukti "header ikut terbaca".

#### S14 — Envelope + tulis `.dat` + restore ekstensi saat dekripsi
- [x] STATUS: DONE
- 🔑 Kata kunci: envelope KRI1, metadata filename, download blob, restore extension, mime type, ciphertext file, save as
- 📦 Deliverable: encrypt file → unduh `.dat`; decrypt `.dat` → unduh file dengan **nama & ekstensi asli**
- 📁 File: `apps/web/src/lib/crypto/envelope.ts`, `apps/web/src/lib/file-utils.ts`, `apps/web/src/components/DownloadButton.tsx`
- ✅ Verifikasi: round-trip `gambar.jpg` → `gambar.jpg.dat` → dekripsi → `gambar.jpg` yang **bisa dibuka viewer gambar**
- 🧠 Catatan: nama file plaintext disimpan di header envelope (Sp9). Nama default `.dat` = `<nama-asli>.<ext>.dat`.

#### S15 — ⭐ Matriks uji round-trip 5 kategori file (WAJIB aturan dosen R2)
- [x] STATUS: DONE
- 🔑 Kata kunci: round-trip test, integritas byte, hash sha256, checksum, teks gambar database audio video, byte-identical, laporan uji
- 📦 Deliverable: skrip/halaman uji + hasil tersimpan di `laporan/uji-file/`
- 📁 File: `apps/web/scripts/roundtrip-test.ts`, `laporan/uji-file/*`
- ✅ Verifikasi: SHA-256 file sebelum vs sesudah enkripsi–dekripsi **identik** untuk **minimal 1 file di setiap kategori**: **teks, gambar, database, audio, video**
- 🧠 Catatan: **ini diminta eksplisit oleh dosen** (§4.3 R2). Simpan screenshot + hash-nya. Contoh: `.txt`, `.jpg`/`.png`, `.db`/`.sqlite`, `.mp3`/`.wav`, `.mp4`. Ini bukti utama klaim "Berhasil" di tabel laporan.

---

### FASE F5 — GUI WEB (spek 1, 4, 5, 6, 7, 11)

#### S16 — Layout GUI + tab per cipher
- [x] STATUS: DONE
- 🔑 Kata kunci: GUI, tab, panel, form key, plaintext, ciphertext, base64, tombol encrypt decrypt save, responsif, dark mode
- 📦 Deliverable: halaman utama dengan 8 tab (a–h) + panel input/output konsisten
- 📁 File: `apps/web/src/app/page.tsx`, `apps/web/src/components/CipherPanel.tsx`, `apps/web/src/components/*`
- ✅ Verifikasi: `pnpm --filter firdauscipher-web dev` → semua tab bisa diklik, tidak ada error console
- 🧠 Catatan: tiap tab punya: **Pilih metode (Enkripsi/Dekripsi)**, **Input mode (Teks/File)**, **Kunci**, **Plaintext/Ciphertext (textarea + tampilan base64)**, **tombol Proses**, **tombol Simpan ciphertext (.dat)**. Referensi tampilan: aes.online-domain-tools.com (disebut di soal).

#### S17 — Alur teks diketik + validasi kunci per cipher
- [x] STATUS: DONE
- 🔑 Kata kunci: validasi input, pesan error, key kosong, matriks hill parse, dropdown affine a, feedback toast
- 📦 Deliverable: validasi & pesan error ramah untuk semua cipher + state loading
- 📁 File: `apps/web/src/components/CipherPanel.tsx`, `apps/web/src/lib/validation.ts`
- ✅ Verifikasi: input invalid (key kosong, `a` bukan koprima 26, matriks singular, key bukan alfabet) → error jelas, app tidak crash
- 🧠 Catatan: pesan error menyebut **apa** dan **kenapa** (mis. "a=4 tidak valid karena gcd(4,26)=2 ≠ 1").

#### S18 — Web Worker + progress untuk file besar
- [x] STATUS: DONE
- 🔑 Kata kunci: web worker, non-blocking UI, progress bar, chunk, file besar, transferable arraybuffer
- 📦 Deliverable: enkripsi/dekripsi file >5 MB tidak membekukan UI
- 📁 File: `apps/web/src/workers/crypto.worker.ts`, `apps/web/src/components/CipherPanel.tsx`
- ✅ Verifikasi: proses file 50 MB → UI tetap responsif, progress bar bergerak, hasil byte-identical
- 🧠 Catatan: tidak diminta eksplisit soal; kalau waktu mepet bisa diturunkan prioritas (§7 Q3). Tapi ini juga poin kreativitas.

---

### FASE F6 — ⭐ BONUS 1

#### S19 — ⭐ Enigma Cipher (bonus h)
- [x] STATUS: DONE
- 🔑 Kata kunci: enigma, rotor I V, rotor wiring, reflector B, ring setting, ringstellung, plugboard, steckerbrett, notch, stepping, double step, 3 rotor
- 📦 Deliverable: `encryptEnigma` + `decryptEnigma` + UI tab + dokumentasi konfigurasi
- 📁 File: `apps/web/src/lib/crypto/enigma.ts`, `enigma.test.ts`, `apps/web/src/components/CipherPanel.tsx`
- ✅ Verifikasi: konfigurasi standar (rotor I-II-III, reflector B, ring AAA, tanpa plugboard, posisi AAA) pada `AAAAA` → `BDZGO`; round-trip == plaintext
- 🧠 Catatan — dikunci: **Enigma I / 3 rotor**, wiring rotor I–V, **reflector B**, **plugboard opsional**, ring setting + posisi awal bisa diatur. **Wajib stepping benar** termasuk *double-stepping* rotor tengah — titik paling sering salah. Kerja pada 26 huruf (sanitize, Sp2). Simpan konfigurasi rotor/ring/plugboard di header envelope untuk dekripsi otomatis.

---

### FASE F7 — ⭐ BONUS 2 (RUBY = BACKEND SERVICE)

#### S20 — Setup proyek Ruby + port core
- [x] STATUS: DONE
- 🔑 Kata kunci: ruby 3.3.8, sinatra, bundler, gemfile, puma, rack, rack-cors, port core, modinverse ruby, matrix ruby, test vectors json, firdauscipher-api
- 📦 Deliverable: `apps/api` jalan + core utils port lengkap
- 📁 File: `apps/api/Gemfile`, `apps/api/.ruby-version`, `apps/api/app.rb`, `apps/api/lib/firdaus_cipher/core.rb`, `apps/api/spec/core_spec.rb`
- ✅ Verifikasi: `bundle exec puma -p 9292` → server jalan (`/health` → 200); `bundle exec rspec` lolos untuk core
- 🧠 Catatan: gem: `sinatra`, `puma`, `rackup`, `rack-cors`, `json`, `rspec`. Jalankan `bundle lock --add-platform x86_64-linux` (Render = Linux). Baca `packages/vectors/vectors.json` yang **sama** (D20).

#### S21 — Port semua cipher + REST API + GUI mini Ruby
- [ ] STATUS: TODO
- 🔑 Kata kunci: ruby vigenere, autokey, playfair, affine, hill, extended vigenere, columnar, super enkripsi, enigma, sinatra routes, erb, api endpoint, base64, upload download, restore ekstensi
- 📦 Deliverable: semua cipher a–h tersedia sebagai **REST API** + **GUI mini** (ERB) di app Ruby
- 📁 File: `apps/api/lib/firdaus_cipher/*.rb`, `apps/api/app.rb`, `apps/api/views/index.erb`, `apps/api/public/`
- ✅ Verifikasi: endpoint `POST /api/encrypt` & `POST /api/decrypt` untuk tiap cipher benar; upload file biner → download `.dat` → dekripsi → file utuh
- 🧠 Catatan — **rute API dikunci**:
  - `GET /health` → `{status:"ok"}`
  - `GET /api/ciphers` → daftar cipher + parameter
  - `POST /api/encrypt` body `{cipher, key, input(base64), mode}` → `{output(base64), meta}`
  - `POST /api/decrypt` idem
  - CORS: `Access-Control-Allow-Origin` dari env `ALLOWED_ORIGIN` (domain Cloudflare Workers).
  - GUI mini ERB cukup 1 halaman dengan form per cipher (membuktikan "GUI berbasis web" untuk bonus 2).

#### S22 — ⭐ Cross-verifikasi TS ↔ Ruby
- [ ] STATUS: TODO
- 🔑 Kata kunci: cross-verification, konsistensi dua bahasa, test vectors, automated comparison, bukti laporan, http compare
- 📦 Deliverable: skrip yang menjalankan semua `vectors.json` di kedua implementasi + laporan hasil
- 📁 File: `apps/web/scripts/cross-verify.ts`, `apps/api/spec/cross_spec.rb`, `laporan/uji/cross-verify.md`
- ✅ Verifikasi: **100%** kasus di `vectors.json` menghasilkan ciphertext identik di TS dan Ruby
- 🧠 Catatan: pembeda nilai bonus 2 — tunjukkan tabel hasilnya di laporan. Jalur otomatis: `apps/web` panggil API Ruby (`apps/web/src/lib/api-client.ts`) lalu bandingkan dengan hasil lokal.

---

### FASE F8 — 🚀 HOSTING & DEPLOY

#### S23 — 🚀 Setup Cloudflare Workers (frontend)
- [ ] STATUS: TODO
- 🔑 Kata kunci: cloudflare workers, static assets, wrangler, wrangler.jsonc, output export, next.js static export, deploy, assets directory, spa fallback
- 📦 Deliverable: frontend ter-deploy di Cloudflare Workers, URL publik hidup
- 📁 File: `apps/web/wrangler.jsonc`, `apps/web/next.config.ts`, `apps/web/package.json`
- ✅ Verifikasi: `pnpm --filter firdauscipher-web build` → folder `out/` terbentuk; `npx wrangler deploy` sukses; buka URL `*.workers.dev` → GUI jalan & enkripsi berfungsi
- 🧠 Catatan — konfigurasi dikunci:
  - `next.config.ts`: `output: "export"`, `images: { unoptimized: true }` (karena tidak ada server image optimizer).
  - `wrangler.jsonc`:
    ```jsonc
    {
      "$schema": "node_modules/wrangler/config-schema.json",
      "name": "firdauscipher-web",
      "compatibility_date": "2026-10-01",
      "assets": {
        "directory": "./out",
        "not_found_handling": "single-page-application"
      }
    }
    ```
  - Perintah deploy: `pnpm --filter firdauscipher-web build && npx wrangler deploy` (dari `apps/web`).
  - Login sekali: `npx wrangler login` (butuh akun Cloudflare — minta Fred, **jangan** tebak kredensial).
  - Env: `NEXT_PUBLIC_API_BASE_URL` = URL backend Render (diisi setelah S24).
  - Fallback kalau butuh SSR: adapter `@opennextjs/cloudflare` (D14).

#### S24 — 🚀 Setup Render (backend Ruby)
- [ ] STATUS: TODO
- 🔑 Kata kunci: render, render.yaml, blueprint, runtime ruby, buildCommand, startCommand, puma, PORT, health check, free tier, cold start, cors
- 📦 Deliverable: backend Ruby ter-deploy di Render, endpoint `/health` & `/api/*` hidup
- 📁 File: `render.yaml`, `apps/api/Gemfile`, `apps/api/config.ru`, `apps/api/app.rb`
- ✅ Verifikasi: `curl https://firdauscipher-api.onrender.com/health` → `{"status":"ok"}`; `curl -X POST .../api/encrypt` menghasilkan ciphertext sama dengan versi TS
- 🧠 Catatan — konfigurasi dikunci:
  ```yaml
  services:
    - type: web
      name: firdauscipher-api
      runtime: ruby
      plan: free
      rootDir: apps/api
      buildCommand: bundle install
      startCommand: bundle exec puma -p $PORT
      healthCheckPath: /health
      envVars:
        - key: RACK_ENV
          value: production
        - key: ALLOWED_ORIGIN
          sync: false        # diisi manual: URL Cloudflare Worker
  ```
  - **Penting:** `puma` harus baca `$PORT` dari Render.
  - Free tier Render **tidur setelah ~15 menit idle** → request pertama lambat (~50 detik). Catat ini di laporan/README (bukan bug).
  - `ALLOWED_ORIGIN` wajib diisi URL Worker dari S23 supaya CORS jalan.

#### S25 — 🚀 CI/CD (GitHub Actions)
- [ ] STATUS: TODO
- 🔑 Kata kunci: github actions, ci, workflow, lint, test, build, wrangler-action, deploy hook, render deploy, secrets
- 📦 Deliverable: `.github/workflows/ci.yml` — lint+test+build kedua app, deploy otomatis saat push ke `main`
- 📁 File: `.github/workflows/ci.yml`, `apps/web/package.json`, `apps/api/Gemfile`
- ✅ Verifikasi: push ke `main` → Actions hijau; frontend ke-deploy ke Workers; backend ke-deploy ke Render (via Deploy Hook)
- 🧠 Catatan — struktur job: (1) `web`: pnpm install → lint → test → build; (2) `api`: `ruby/setup-ruby` (baca `.ruby-version`) → bundle install → rspec; (3) `deploy`: butuh (1)+(2) sukses → `cloudflare/wrangler-action` untuk web + `curl $RENDER_DEPLOY_HOOK` untuk api. Secrets GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `RENDER_DEPLOY_HOOK` (Fred yang isi).

#### S26 — 🚀 Verifikasi produksi + dokumentasi arsitektur
- [ ] STATUS: TODO
- 🔑 Kata kunci: smoke test, production check, cek produksi, custom domain, env config, arsitektur, diagram, uptime
- 📦 Deliverable: `docs/arsitektur.md` (diagram + URL) + hasil smoke test produksi
- 📁 File: `docs/arsitektur.md`, `laporan/uji/smoke-test.md`
- ✅ Verifikasi: dari URL publik — enkripsi teks, upload file `.jpg` → `.dat` → dekripsi → file utuh; cross-verify TS↔Ruby jalan lintas-origin (CORS OK)
- 🧠 Catatan: tulis di `docs/arsitektur.md`: **frontend = Cloudflare Workers (static)**, **backend = Render (Ruby)**, alur data, dan env var. Opsional: custom domain (§7 Q5). Screenshot produksi masuk laporan (R1).

---

### FASE F9 — QA, DOKUMENTASI, LAPORAN, PAKET

#### S27 — Unit test lengkap + matriks uji manual
- [ ] STATUS: TODO
- 🔑 Kata kunci: unit test, coverage, matriks uji, checklist spek, test manual, edge case, plaintext kosong, key panjang 1, unicode
- 📦 Deliverable: coverage core+cipher ≥80% + tabel matriks uji manual (spek 1–11 × cipher a–i)
- 📁 File: `apps/web/tests/*`, `apps/api/spec/*`, `laporan/uji/matriks-uji.md`
- ✅ Verifikasi: `pnpm --filter firdauscipher-web test --coverage` lolos; setiap baris matriks uji punya status ✓/✗ + catatan
- 🧠 Catatan: edge case: plaintext kosong, key 1 huruf, key > panjang plaintext, plaintext tanpa alfabet, file 0 byte, file 1 byte.

#### S28 — README kedua app (WAJIB aturan dosen R3)
- [ ] STATUS: TODO
- 🔑 Kata kunci: readme, cara menjalankan, prerequisites, pnpm install, pnpm dev, test, bundle, rspec, deploy, screenshot, dokumentasi algoritma
- 📦 Deliverable: `README.md` root + `apps/web/README.md` + `apps/api/README.md` — langkah menjalankan dari nol
- 📁 File: `README.md`, `apps/web/README.md`, `apps/api/README.md`
- ✅ Verifikasi: ikuti README dari folder kosong di terminal baru → kedua app jalan tanpa langkah tersembunyi
- 🧠 Catatan: **wajib** (R3). Isi: prasyarat versi Node/Ruby, perintah instalasi, cara pakai tiap cipher, penjelasan format `.dat`, cara deploy, link URL produksi, catatan cold start Render.

#### S29 — Laporan PDF (WAJIB aturan dosen R1–R3)
- [ ] STATUS: TODO
- 🔑 Kata kunci: laporan pdf, screenshot antarmuka, contoh plaintext ciphertext, tabel centang, berhasil kurang berhasil, keterangan, kode program, readme
- 📦 Deliverable: `laporan/laporan-uts-kriptografi.pdf`
- 📁 File: `laporan/*`
- ✅ Verifikasi: PDF memuat **semua** poin R1–R4 + tabel centang a–i terisi jujur
- 🧠 Catatan — isi wajib sesuai §4.3:
  1. **Screenshot antarmuka** tiap cipher (dari app produksi) — R1
  2. **Contoh plaintext & ciphertext** untuk **text, gambar, database, audio, video** + penjelasan — R2 (pakai bukti S15)
  3. **Kode program** + **README cara menjalankan** — R3
  4. **Tabel centang** "Berhasil / Kurang Berhasil / Keterangan" untuk a–i — pakai §8
  5. Tulis jujur bagian yang belum selesai. Jangan klaim "Berhasil" tanpa bukti di S15.

#### S30 — ⭐ Kreativitas & inovasi (nilai tambah — R4)
- [ ] STATUS: TODO
- 🔑 Kata kunci: kreativitas, inovasi, nilai tambah, PWA offline, share link, visualisasi, benchmark, i18n, QR, drag drop, dark mode
- 📦 Deliverable: minimal **3 fitur kreatif** selesai + 1 halaman penjelasan di laporan
- 📁 File: `apps/web/src/components/*`, `laporan/laporan-uts-kriptografi.pdf` (bagian kreativitas)
- ✅ Verifikasi: fitur bisa didemokan; ada screenshot + penjelasan singkat di laporan
- 🧠 Catatan — kandidat (pilih ≥3, urut prioritas):
  1. **PWA / offline-first** (sangat cocok karena static di Cloudflare Workers — app jalan tanpa internet setelah load pertama)
  2. **Visualisasi Enigma** (animasi rotor berputar) & **matriks Hill** (highlight blok perkalian)
  3. **Share link** — hasil enkripsi di-encode ke URL hash (tanpa backend)
  4. **Batch mode** — enkripsi banyak file sekaligus + progress
  5. **Auto-verifikasi** SHA-256 side-by-side sebelum/sesudah
  6. **i18n ID/EN** + dark mode
  7. **Benchmark** kecepatan tiap cipher pada ukuran file berbeda (grafik)
  8. **Drag & drop** + paste gambar dari clipboard
  - Tulis di laporan bagian "Kreativitas & Inovasi" dengan alasan **kenapa** fitur itu berguna.

#### S31 — Packaging & pengumpulan
- [ ] STATUS: TODO
- 🔑 Kata kunci: zip, bundle, pengumpulan, classroom, cek keaslian, plagiarisme, nama file, deadline
- 📦 Deliverable: ZIP berisi kode TS + kode Ruby + laporan PDF + contoh file uji
- 📁 File: `laporan/firdauscipher-<nama>-<nim>.zip`
- ✅ Verifikasi: ekstrak ZIP di folder baru → ikuti README → jalan; ukuran wajar (<100 MB); tidak ada `node_modules`/`.next`/`out`/`vendor`
- 🧠 Catatan: hapus `node_modules`, `.next`, `out`, `vendor/bundle` sebelum zip. Sertakan URL produksi (Cloudflare + Render) di laporan & README. Konfirmasi **deadline Classroom** (§7 Q4).

---

## 7. PERTANYAAN TERBUKA (perlu keputusan Fred)

**✅ Sudah dikonfirmasi:** nama app = **FirdausCipher** (D1–D3, D7) · lokasi monorepo = `~/Development/firdauscipher` (D4) · **kerja sendiri** (D23) · **deadline 9 Okt 2026** (D24) · draft v1 sudah dihapus.

| # | Pertanyaan | Usulan default |
|---|---|---|
| ~~Q1~~ | ~~Lokasi monorepo~~ | ✅ **SELESAI** → `~/Development/firdauscipher` |
| Q2 | Super enkripsi: 2 kolom kunci terpisah atau 1 string dipisah `\|`? | **2 input kunci terpisah** |
| Q3 | Web Worker (S18) dikerjakan atau skip? | **Kerjakan** (poin kreativitas); bisa ditunda kalau mepet |
| ~~Q4~~ | ~~Deadline~~ | ✅ **SELESAI** → **9 Oktober 2026** |
| Q5 | Pakai custom domain untuk Cloudflare Worker / Render? | **Tidak dulu** — `*.workers.dev` & `*.onrender.com` cukup |
| Q6 | Hill cipher dibatasi 2×2 & 3×3? | **Ya** |
| Q7 | Enigma pakai plugboard (Steckerbrett)? | **Ya** (lebih meyakinkan, tapi opsional) |
| Q8 | Backend Ruby: **REST API + GUI mini** atau **API saja**? | **API + GUI mini** — biar "GUI berbasis web" bonus 2 sah |
| Q9 | Akun Cloudflare & Render & GitHub sudah ada? Siapa yang isi kredensial? | **Fred yang login/isi** — agent tidak menebak kredensial |
| ~~Q10~~ | ~~Tim~~ | ✅ **SELESAI** → **kerja sendiri** |
| ~~Q11~~ | ~~Hapus draft v1~~ | ✅ **SELESAI** → sudah dihapus |

---

## 8. MATRIKS UJI (untuk tabel centang laporan — R1–R4)

| No | Spek | Teks | File | Enkripsi | Dekripsi | Base64 | Save .dat | Status | Bukti |
|---|---|---|---|---|---|---|---|---|---|
| 1 | a) Vigenere standard | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 2 | b) Auto-Key Vigenere | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 3 | c) Extended Vigenere | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 4 | d) Playfair | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 5 | e) Affine | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 6 | f) Hill | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 7 | g) Super enkripsi | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 8 | h) ⭐ Enigma (bonus) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |
| 9 | i) ⭐ Ruby (bonus) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ⬜ | |

**Tabel file uji wajib (R2):**

| Kategori | Contoh file | Ukuran | SHA-256 sebelum | SHA-256 sesudah | Status |
|---|---|---|---|---|---|
| Teks | `contoh.txt` | | | | ⬜ |
| Gambar | `contoh.jpg` | | | | ⬜ |
| Database | `contoh.sqlite` | | | | ⬜ |
| Audio | `contoh.mp3` | | | | ⬜ |
| Video | `contoh.mp4` | | | | ⬜ |

---

## 9. LOG PROGRES (append-only, 1 baris per perubahan)

Format: `YYYY-MM-DD HH:MM | STEP | STATUS | catatan singkat`

```
2026-10-07 21:18 | —   | DRAFT  | TODO v1 dibuat (26 step)
2026-10-07 21:28 | —   | DRAFT  | TODO v2: rename app → cipherlab, monorepo + pnpm, hosting CF Workers + Render, aturan OpenCode, aturan laporan dosen (R1–R5)
2026-10-07 21:3x | —   | DRAFT  | TODO v3: nama final → FirdausCipher; perbaiki penomoran step (31 step) & semua cross-reference (R1–R4, peta file, §3)
2026-10-07 23:46 | —   | DRAFT  | TODO v4: deadline 9 Okt 2026, tim = sendiri, lokasi monorepo dikonfirmasi, tambah §1.1 jadwal & prioritas P0–P4, hapus draft v1
2026-10-08 00:10 | S01 | DONE | Scaffold monorepo (pnpm workspaces) + Next.js 15 apps/web + Sinatra apps/api + packages/vectors; verifikasi: pnpm verify hijau, dev server 200, /health 200, rspec 2/2
2026-10-08 00:22 | S03 | DONE | Envelope KRI1: magic+version+cipher+hdrLen(LE)+header JSON+payload; docs/format-file.md; 17 unit test (termasuk 5 kasus error)
2026-10-08 00:22 | S04 | DONE | Test vectors: 27 kasus (3 per cipher) dari packages/vectors/generate.py (referensi Python INDEPENDEN); 55 tes TS hijau (S22 akan pakai file yang sama di Ruby)
2026-10-08 00:22 | S05 | DONE | core.ts: sanitize26, base64 manual (tanpa Buffer), modInverse/extended-euclid, detMod/invertMatrixMod/adjoin, padBlock; 31 unit test; 12 nilai a valid + error gcd
2026-10-08 00:22 | S06 | DONE | vigenere.ts: encryptVigenere/decryptVigenere + encryptAutoKey/decryptAutoKey; verifikasi ATTACKATDAWN+LEMON=lxfopvefrnhr; autokey dekripsi SEKUENSIAL (plaintext jadi bagian kunci berikutnya); 11 tes
2026-10-08 00:22 | S07 | DONE | playfair.ts: buildKeySquare 5x5 (I/J->I), digraph filler X, geser baris/kolom & rectangle swap; MONARCHY/INSTRUMENTS=gatlmzclrqxa; ciphertext selalu genap; 7 tes
2026-10-08 00:22 | S08 | DONE | affine.ts: E(x)=(ax+b)mod26, D pakai a^-1; VALID_A 12 nilai; a=5,b=8 AFFINECIPHER=ihhwvcswfrcp; a=4 ditolak dgn pesan gcd(4,26)=2; 8 tes
2026-10-08 00:22 | S09 | DONE | hill.ts: 2x2 & 3x3, detMod+invertMatrixMod(adjoin), padding filler X, parseMatrix; key standar ACT=poh; matriks singular ditolak dgn pesan det; 9 tes
2026-10-08 00:22 | S10 | DONE | extended-vigenere.ts: byte 0-255 modulo 256, TANPA sanitasi; round-trip 10KB byte acak identik; byte 0x00/0xFF & header PNG ikut diproses; output Uint8Array; 7 tes
2026-10-08 00:22 | S11 | DONE | columnar.ts: operasi pada BYTE, padding 0x00, urutan kolom sortir kunci (seri->posisi); columnOrder ZEBRAS=[4,2,1,3,5,0]; 7 tes
2026-10-08 00:22 | S12 | DONE | super-encryption.ts: enkripsi=ExtVigenere->Kolom, dekripsi=Kolom^-1->Vigenere^-1; 2 kunci terpisah (Q2); round-trip byte acak + beda dari cipher tunggal; 6 tes
2026-10-08 00:22 | S19 | DONE | enigma.ts: Enigma I 3 rotor (I-V), reflector A/B/C, ring setting, posisi awal, plugboard opsional; double-stepping diuji eksplisit (AEA->BFB); AAAAA=bdzgo; 11 tes
2026-10-08 00:43 | S13 | DONE | file-utils.ts: readFileBytes pakai arrayBuffer (+fallback FileReader utk jsdom), looksLikeText (NUL/>10% non-printable), hexPreview 64 byte, MAX_FILE_SIZE 100MB, sha256Hex; 10 unit test
2026-10-08 00:43 | S14 | DONE | envelope KRI1 utk file: enkripsi -> `<nama>.<ext>.dat`, dekripsi memulihkan nama+ekstensi dari header (Sp9) & memangkas padding pakai size; tombol "Simpan .dat" juga di mode TEKS (Sp6)
2026-10-08 00:43 | S15 | DONE | scripts/roundtrip-test.ts: 5 kategori (teks/gambar/database/audio/video) x 4 cipher biner = 15/15 byte-identik; cipher 26 huruf 0/5 (sesuai Sp2); hasil di laporan/uji-file/roundtrip.{json,md}
2026-10-08 00:43 | S16 | DONE | page.tsx + cipher-selector + mode-panel (tab Teks/File) + key-fields otomatis dari registry; 8 cipher a-h bisa dipilih; page.test.tsx membuktikan tidak ada console.error; `next build` sukses
2026-10-08 00:43 | S17 | DONE | pesan error menyebut sebab: gcd(a,26), det matriks, bentuk matriks (assertSquare dulu melaporkan "2x2" utk matriks 2 baris yg kolomnya tak sama -> kini sebut baris & jumlah elemennya), elemen bukan angka + nomor baris/kolom, kunci tanpa huruf A-Z; 31 tes validation.test.ts
2026-10-08 00:43 | S18 | DONE | worker-client.ts (ambang 64KB, fallback main thread) + cipher.worker.ts + use-cipher-worker; 8 tes worker-client.test.ts (ambang, transferable, progress, error, terminate)
2026-10-08 00:43 | FIX  | DONE | Transposisi Kolom (g) satu-satunya field kunci tanpa defaultValue -> form error saat dipakai langsung; kini default "ZEBRAS". Header hasil file juga menampilkan Parameter kunci (bukti Sp9)
2026-10-08 00:43 | FIX  | DONE | Pesan validasi kunci terbaca "Kunci Kunci untuk Vigenere" (label diteruskan ganda) -> kini 'Kunci "key" untuk Vigenere ...'; tes menolak regresi ini
2026-10-08 06:30 | S02 | PART | AGENTS.md root ditulis (10 aturan wajib, perintah standar, Sp1-Sp11, daftar cipher); apps/web & apps/api/AGENTS.md belum (penulisan file instruksi agent diblokir izin)
2026-10-08 06:30 | S20 | DONE | apps/api/lib/firdaus_cipher/core.rb: port lengkap core utils (sanitize26, char/num, mod, modInverse, base64 manual, latin1/utf8/hex, gcd, det/matMul/transpose/cofactor/invert, assertSquare, padBlock); 34 spec lolos; server `/health` -> 200 (webrick lokal, puma grup production); `bundle lock --add-platform x86_64-linux` utk Render; paritas TS<->Ruby diuji 88 kasus IDENTIK + base64 vs referensi Python 45/45
```

---

## 10. CATATAN TEKNIS (jebakan yang sudah diketahui)

1. **Auto-Key dekripsi wajib sekuensial** — kunci huruf ke-n bergantung pada plaintext huruf ke-(n-1) yang baru didapat.
2. **Hill**: ciphertext tidak bisa didekripsi kalau matriks singular mod 26 → validasi det sebelum proses.
3. **Playfair**: pastikan panjang akhir genap & tidak ada pasangan kembar (kalau ada → sisipkan filler X).
4. **Enigma**: *double-stepping* rotor tengah paling sering dilupakan; uji `AAAAA` → `BDZGO`.
5. **Enkripsi file biner**: jangan pakai `TextDecoder`/`file.text()` — merusak byte. Selalu `Uint8Array`/`arrayBuffer()`.
6. **Cipher 26 huruf pada file biner**: secara definisi merusak file (non-alfabet dibuang). Untuk file, pakai Extended Vigenere / Super Enkripsi; kalau user memaksa cipher 26 huruf pada file biner → tampilkan peringatan file tidak akan bisa direstorasi.
7. **Base64 untuk tampilan, bukan penyimpanan**: payload `.dat` disimpan sebagai byte mentah (kecuali cipher 26-huruf → mode `base64-text`).
8. **Envelope `KRI1` adalah lapisan luar** yang ditambah setelah enkripsi → Sp8 tetap terpenuhi.
9. **Jangan install library cipher** pihak ketiga — hanya matriks/modulo (Sp10). Anti-plagiarisme (R5, nilai 0).
10. **Cloudflare Workers + Next.js**: `output: "export"` **tidak mendukung** API routes/dynamic route/`next/image` optimizer. Kalau butuh salah satunya → pakai `@opennextjs/cloudflare`.
11. **Workers static assets**: butuh `wrangler` ≥ 3.99.0; pastikan `compatibility_date` diisi.
12. **Render free tier tidur** setelah idle → request pertama lambat (~50 detik). Bukan bug; tulis di README/laporan.
13. **CORS**: Worker (`*.workers.dev`) dan Render (`*.onrender.com`) beda origin → backend **wajib** kirim header CORS dengan `ALLOWED_ORIGIN` yang benar, dan `OPTIONS` preflight harus dijawab.
14. **`$PORT` Render**: puma/rackup harus bind ke `ENV['PORT']`, bukan 9292 hardcode.
15. **Bundler platform**: jalankan `bundle lock --add-platform x86_64-linux` supaya `Gemfile.lock` valid saat build di Render (mesin lokal bisa beda platform).
16. **OpenCode**: `AGENTS.md` di root terbaca otomatis; `opencode.json` `instructions` untuk file tambahan. Kalau ada `CLAUDE.md` dan `AGENTS.md` bersamaan, **hanya `AGENTS.md`** yang dipakai → jangan taruh aturan hanya di `CLAUDE.md`.
17. **`docs/PLAN.md`**: pakai **symlink** ke file TODO ini, jangan copy → supaya tidak ada dua versi yang beda.
18. **Nama paket pnpm wajib lowercase** → `firdauscipher-web` / `firdauscipher-api` (bukan camelCase), sedangkan nama tampilan produk tetap `FirdausCipher`.
19. **Jangan jalankan `pnpm build` dan `pnpm dev` bersamaan** — keduanya memakai folder `.next` yang sama, sehingga build menghapus `.next/static/development/_buildManifest.js` milik dev server dan halaman jadi **HTTP 500** (error `ENOENT ... _buildManifest.js.tmp.*`). Hentikan dev dulu, atau `rm -rf .next` lalu jalankan ulang dev. Ini bukan bug kode.
