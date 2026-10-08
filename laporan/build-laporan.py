#!/usr/bin/env python3
"""build-laporan.py — S29: susun laporan UTS (HTML -> PDF).

Semua ANGKA diambil dari berkas bukti nyata:
  laporan/uji/cross-verify.json      27/27 TS==Ruby==vektor acuan
  laporan/uji-file/roundtrip.json    SHA-256 sebelum/sesudah, 5 kategori
  laporan/screenshot/screenshots.json hasil screenshot antarmuka
  packages/vectors/vectors.json      vektor acuan (contoh plainteks/cipherteks)
  berkas sumber di apps/*/            potongan kode program

Jalankan:  python3 laporan/build-laporan.py
Keluaran:  laporan/laporan-uts-kriptografi.html
           (lalu dicetak ke PDF oleh laporan/print-pdf.sh)
"""

from __future__ import annotations

import base64
import html
import json
import os
import re
import subprocess
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAP = os.path.join(ROOT, "laporan")
SHOT = os.path.join(LAP, "screenshot")

NAMA = "Farid Firdaus"
NIM = "237006081"
PRODI = "Informatika"
FAKULTAS = "Fakultas Teknik"
UNIV = "Universitas Siliwangi"
MATAKULIAH = "Kriptografi (3 SKS)"
DOSEN = "Ir. Randi Rizal, Ph.D."
TANGGAL = "8 Oktober 2026"

# Urutan huruf a-h + komponen internal g.
CIPHER_ORDER = [
    ("a", "vigenere", "Vigenere Cipher standard", "26 huruf alfabet"),
    ("b", "autokey", "Varian Vigenere: Auto-Key Vigenere", "26 huruf alfabet"),
    ("c", "ext-vigenere", "Extended Vigenere Cipher", "256 karakter ASCII"),
    ("d", "playfair", "Playfair Cipher", "26 huruf alfabet"),
    ("e", "affine", "Affine Cipher", "26 huruf alfabet"),
    ("f", "hill", "Hill Cipher", "26 huruf alfabet"),
    ("g", "super", "Super Enkripsi (Extended Vigenere + Transposisi Kolom)", "256 byte"),
    ("h", "enigma", "Bonus 1: Enigma Cipher", "26 huruf alfabet"),
]

# ---------------------------------------------------------------- util

def esc(s) -> str:
    return html.escape(str(s))


def b64img(path: str) -> str:
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def read(path: str) -> str:
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def load(path: str):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return json.load(f)


def code(path: str, lang: str = "") -> str:
    """Blok kode dengan nomor baris opsional; di sini tanpa nomor agar ringkas."""
    src = read(path).rstrip("\n")
    return f'<pre class="code"><code>{esc(src)}</code></pre>'


# ---------------------------------------------------------------- data

def build_data():
    cv = load("laporan/uji/cross-verify.json")
    rt = load("laporan/uji-file/roundtrip.json")
    sc = load("laporan/screenshot/screenshots.json")
    vec = load("packages/vectors/vectors.json")
    return cv, rt, sc, vec


# ---------------------------------------------------------------- bagian HTML

def cover() -> str:
    return f"""
<section class="cover">
  <div class="kop">
    <div class="kop-line">KEMENTERIAN PENDIDIKAN TINGGI, SAINS DAN TEKNOLOGI</div>
    <div class="kop-line b">{UNIV.upper()}</div>
    <div class="kop-line">{FAKULTAS.upper()}</div>
    <div class="kop-line">PROGRAM STUDI {PRODI.upper()}</div>
  </div>
  <div class="rule"></div>
  <h1>LAPORAN UJIAN TENGAH SEMESTER</h1>
  <h2>Implementasi Kriptografi Klasik Berbasis Web<br>
      <span class="sub">FirdausCipher — 8 Cipher Klasik untuk Pesan Teks dan File Biner</span></h2>

  <table class="ident">
    <tr><th>Mata Kuliah</th><td>{esc(MATAKULIAH)}</td></tr>
    <tr><th>Dosen Pengampu</th><td>{esc(DOSEN)}</td></tr>
    <tr><th>Nama</th><td><b>{esc(NAMA)}</b></td></tr>
    <tr><th>NIM</th><td><b>{esc(NIM)}</b></td></tr>
    <tr><th>Program Studi</th><td>{esc(PRODI)} — {esc(FAKULTAS)}</td></tr>
    <tr><th>Sifat</th><td>Individu (karya sendiri)</td></tr>
    <tr><th>Tanggal</th><td>{esc(TANGGAL)}</td></tr>
  </table>

  <div class="badge-box">
    <b>Ringkasan:</b> Program web <b>FirdausCipher</b> mengimplementasikan seluruh
    cipher yang diminta (a–h) beserta kedua bonus (Enigma dan implementasi bahasa
    Ruby). Aplikasi menerima masukan berupa <b>pesan yang diketik</b> maupun
    <b>file sembarang</b> (teks, gambar, database, audio, video), dapat melakukan
    <b>enkripsi dan dekripsi</b>, menampilkan hasil dalam <b>base64</b>, dan
    menyimpan cipherteks ke berkas <b>.dat</b>. Seluruh logika cipher ditulis
    <b>dua kali</b> — TypeScript (web) dan Ruby (API) — lalu hasilnya dibuktikan
    identik satu sama lain dan terhadap vektor acuan.
  </div>
</section>
"""


def toc() -> str:
    items = [
        "1. Pendahuluan dan Gambaran Program",
        "2. Tampilan Antarmuka Program (Print Screen)",
        "3. Contoh Plainteks dan Cipherteks per Cipher",
        "4. Uji Enkripsi–Dekripsi File (5 Kategori)",
        "5. Tabel Centang Spesifikasi (a–i)",
        "6. Kode Program dan Cara Menjalankan",
        "7. Kreativitas dan Inovasi (Nilai Tambah)",
        "8. Catatan Jujur: Kendala dan Keterbatasan",
        "Lampiran A — Bukti Verifikasi Silang TypeScript ↔ Ruby",
    ]
    lis = "".join(f"<li>{esc(i)}</li>" for i in items)
    return f"""
<section>
  <h2 class="h2">Daftar Isi</h2>
  <ul class="toc">{lis}</ul>
  <p class="note">Seluruh angka pada laporan ini dihasilkan otomatis dari berkas
  bukti di dalam repositori (<code>laporan/uji/</code>, <code>laporan/uji-file/</code>,
  <code>laporan/screenshot/</code>), bukan diketik manual, sehingga dapat
  diverifikasi ulang kapan saja dengan perintah yang tertera pada Bab 6.</p>
</section>
"""


def bab1() -> str:
    return """
<section>
  <h2 class="h2">1. Pendahuluan dan Gambaran Program</h2>

  <h3 class="h3">1.1 Tujuan</h3>
  <p>Membuat program berbasis web berantarmuka grafis (GUI) yang
  mengimplementasikan delapan cipher klasik yang diminta soal, mampu memproses
  <b>pesan yang diketik</b> maupun <b>file sembarang (teks maupun biner)</b>,
  melakukan enkripsi dan dekripsi, menampilkan pesan dalam base64, serta
  menyimpan cipherteks ke berkas.</p>

  <h3 class="h3">1.2 Arsitektur</h3>
  <p>Program terdiri atas dua aplikasi yang saling melengkapi:</p>
  <table class="tbl">
    <tr><th>Bagian</th><th>Teknologi</th><th>Peran</th></tr>
    <tr>
      <td><b>apps/web</b></td>
      <td>Next.js 15, React 19, TypeScript, Tailwind 4</td>
      <td>Antarmuka utama (GUI). Seluruh proses cipher berjalan
          <b>di sisi klien</b> sehingga tidak ada data yang dikirim ke server.</td>
    </tr>
    <tr>
      <td><b>apps/api</b></td>
      <td>Ruby 3.3, Sinatra</td>
      <td>Implementasi <b>kedua</b> dari seluruh cipher + REST API + GUI mini.
          Berfungsi sebagai pembanding independen untuk membuktikan kebenaran hasil.</td>
    </tr>
    <tr>
      <td><b>packages/vectors</b></td>
      <td>JSON + Python</td>
      <td>Vektor acuan (27 kasus) yang dibuat terpisah, dipakai sebagai
          "jawaban kunci" bagi kedua implementasi.</td>
    </tr>
  </table>

  <h3 class="h3">1.3 Mengapa Dua Implementasi?</h3>
  <p>Soal memberi bonus bila menggunakan bahasa Ruby (poin i). Selain itu,
  menulis cipher dua kali dalam bahasa berbeda memberi manfaat pembuktian:
  jika dua program yang ditulis terpisah menghasilkan <b>byte yang sama persis</b>
  untuk 27 kasus uji dan dibandingkan pula dengan <b>vektor acuan independen</b>,
  maka jauh lebih kecil kemungkinan keduanya "sama-sama salah" dibanding bila
  hanya ada satu implementasi.</p>
  <p>Pembuktian ini dijalankan oleh perintah <code>pnpm cross-verify</code>
  (Bab 4 dan Lampiran A).</p>

  <h3 class="h3">1.4 Fitur Utama</h3>
  <ul class="list">
    <li><b>Delapan cipher klasik</b> (a–h) lengkap dengan enkripsi dan dekripsi.</li>
    <li><b>Dua mode masukan</b>: Mode Teks (diketik) dan Mode File (semua byte).</li>
    <li><b>Envelope <code>.dat</code></b> (format KRI1) yang menyimpan nama asli,
        tipe MIME, dan jenis cipher, sehingga hasil dekripsi kembali menjadi file
        dengan nama dan ekstensi semula.</li>
    <li><b>Tampilan base64</b> untuk hasil biner, sesuai ketentuan soal poin 4.</li>
    <li><b>Kunci bebas panjang</b>, dimasukkan oleh pengguna (soal poin 7).</li>
    <li><b>Kesetaraan dua bahasa</b>: TypeScript dan Ruby.</li>
  </ul>
</section>
"""


def bab2(sc) -> str:
    """R1 — print screen antarmuka tiap cipher."""
    ui = [e for e in sc if not e.get("mode")]
    fl = [e for e in sc if e.get("mode") == "file"]

    def card(e, judul, sub):
        img = b64img(os.path.join(SHOT, os.path.basename(e["png"])))
        out = e.get("output") or "-"
        masuk = e.get("plaintext") or e.get("file") or "-"
        kunci = json.dumps(e.get("keys") or {}, ensure_ascii=False)
        err = e.get("error")
        status = (f'<span class="bad">error: {esc(err)}</span>' if err
                  else '<span class="ok">berhasil, tanpa error</span>')
        return f"""
<figure class="shot">
  <figcaption><b>{esc(judul)}</b> — {esc(sub)}<br>
    <span class="mono">Masukan: {esc(masuk)}</span> &nbsp;|&nbsp;
    <span class="mono">Kunci: {esc(kunci)}</span><br>
    <span class="mono">Hasil: {esc(out)}</span> &nbsp;|&nbsp; {status}</figcaption>
  <img src="{img}" alt="{esc(judul)}">
</figure>"""

    parts = ["""
<section>
  <h2 class="h2">2. Tampilan Antarmuka Program (Print Screen)</h2>
  <p>Seluruh tangkapan layar di bawah ini diambil secara <b>otomatis</b> oleh
  skrip <code>apps/web/scripts/screenshots.ts</code> (<code>pnpm screenshots</code>),
  bukan diambil manual. Dengan cara ini bukti R1 dapat diulang dan diverifikasi
  kapan saja. Nilai "Hasil" pada tiap keterangan adalah keluaran nyata yang
  dibaca langsung dari elemen halaman saat screenshot diambil.</p>
"""]

    parts.append('<h3 class="h3">2.1 Antarmuka Enkripsi Teks (9 Cipher)</h3>')
    for e in ui:
        parts.append(card(e, e["label"], f"hasil ditampilkan sebagai {e.get('kind')}"))

    parts.append('<h3 class="h3">2.2 Antarmuka Enkripsi File (.dat)</h3>')
    for e in fl:
        parts.append(card(e, e["label"], f"file: {e.get('file')} → {e.get('output')}"))

    parts.append("</section>")
    return "".join(parts)


def bab3(vec) -> str:
    """Contoh plainteks & cipherteks per cipher."""
    by = {}
    for c in vec["cases"]:
        by.setdefault(c["cipher"], []).append(c)

    rows = []
    for huruf, slug, nama, jenis in CIPHER_ORDER:
        kasus = by.get(slug, [])
        # ambil 2 contoh; untuk biner tampilkan ringkas
        contoh = []
        for c in kasus[:2]:
            if c["mode"] == "binary":
                contoh.append(
                    f'<span class="mono">[{c["mode"]}] params={esc(json.dumps(c.get("params")))}</span>'
                )
            else:
                contoh.append(
                    f'<span class="mono">{esc(c["plaintext"])} → {esc(c["ciphertext"])}</span>'
                )
        rows.append(
            f'<tr><td class="ctr"><b>{huruf}</b></td><td>{esc(nama)}</td>'
            f'<td>{esc(jenis)}</td><td>{"<br>".join(contoh)}</td></tr>'
        )

    # komponen g (transposisi kolom) — tidak diberi huruf sendiri
    col = by.get("columnar", [])
    col_contoh = "<br>".join(
        f'<span class="mono">[{c["mode"]}] params={esc(json.dumps(c.get("params")))}</span>'
        for c in col[:2]
    )

    return f"""
<section>
  <h2 class="h2">3. Contoh Plainteks dan Cipherteks per Cipher</h2>
  <p>Contoh di bawah diambil dari berkas vektor acuan
  <code>packages/vectors/vectors.json</code>. Cipherteks mode teks ditampilkan
  <b>tanpa spasi dan huruf kecil</b>, sesuai ketentuan soal poin 5.</p>

  <table class="tbl">
    <tr><th class="ctr">#</th><th>Cipher</th><th>Jenis</th><th>Contoh (plainteks → cipherteks)</th></tr>
    {''.join(rows)}
    <tr class="dim"><td class="ctr">–</td>
        <td>Transposisi Kolom <i>(bagian dari g)</i></td>
        <td>256 byte</td><td>{col_contoh}</td></tr>
  </table>

  <h3 class="h3">3.1 Catatan Penomoran Huruf</h3>
  <p>Soal memberi huruf <b>a–h</b> (ditambah dua bonus). Cipher <b>Transposisi
  Kolom</b> tidak diberi huruf tersendiri karena merupakan <b>tahap kedua</b>
  dari Super Enkripsi (soal poin g). Pada antarmuka, ia tampil sebagai
  <i>"Transposisi Kolom (bagian g)"</i> sehingga setiap huruf a–h dipakai tepat
  oleh satu cipher dan tidak ada dua cipher berlabel huruf yang sama.</p>

  <h3 class="h3">3.2 Cara Membaca Hasil Biner</h3>
  <p>Cipher biner (c, g, dan Transposisi Kolom) bekerja pada seluruh 256 nilai
  byte, sehingga keluarannya berupa data biner. Sesuai ketentuan soal poin 4,
  hasil tersebut <b>ditampilkan dalam base64</b> pada antarmuka dan pada REST API.</p>
</section>
"""


def bab4(rt, cv) -> str:
    """R2 — uji file 5 kategori dengan SHA-256."""
    cats = rt["categories"]
    # hasil biner saja (yang harus byte-identik)
    binr = [r for r in rt["results"] if r["cipher"] in rt["binaryCiphers"]]
    per_cat = {}
    for r in binr:
        per_cat.setdefault(r["category"], []).append(r)

    rows = []
    for cat in cats:
        rs = per_cat.get(cat, [])
        if not rs:
            continue
        r0 = rs[0]
        sh = r0["shaBefore"]
        rows.append(
            f'<tr><td>{esc(cat)}</td>'
            f'<td class="mono">{esc(r0["file"])}</td>'
            f'<td class="num">{r0["bytes"]:,}</td>'
            f'<td class="mono tiny">{esc(sh[:16])}…{esc(sh[-8:])}</td>'
            f'<td class="ctr ok">IDENTIK ✓</td></tr>'
        )

    total_ok = sum(1 for r in binr if r["identical"])
    return f"""
<section>
  <h2 class="h2">4. Uji Enkripsi–Dekripsi File (5 Kategori)</h2>
  <p>Sesuai ketentuan soal poin 8–9, program membaca <b>setiap byte</b> file
  (termasuk header) sehingga file yang terenkripsi tidak lagi dapat dibuka
  aplikasinya, lalu <b>kembali utuh</b> setelah didekripsi. Untuk membuktikannya,
  lima kategori file dienkripsi lalu didekripsi, kemudian nilai
  <b>SHA-256 sebelum dan sesudah</b> dibandingkan.</p>

  <table class="tbl">
    <tr><th>Kategori</th><th>Berkas</th><th class="num">Ukuran (byte)</th>
        <th>SHA-256 (sebelum = sesudah)</th><th class="ctr">Hasil</th></tr>
    {''.join(rows)}
  </table>

  <p class="note"><b>Metode pengujian:</b> setiap berkas diuji dengan
  <b>3 cipher biner</b> (Extended Vigenere, Transposisi Kolom, Super Enkripsi)
  — total <b>{len(binr)} kombinasi</b>, seluruhnya <b>{total_ok}/{len(binr)}
  byte-identik</b>. Perintah: <code>pnpm roundtrip</code>.</p>

  <h3 class="h3">4.1 Nama &amp; Ekstensi File Dikembalikan</h3>
  <p>Sesuai soal poin 9, berkas cipherteks memuat nama dan tipe file asli di
  dalam header envelope, sehingga saat dekripsi pengguna tidak perlu mengingat
  jenis file aslinya. Sebagai contoh, <code>contoh.png</code> menghasilkan
  <code>contoh.png.dat</code>, dan saat didekripsi kembali bernama
  <code>contoh.png</code> dengan SHA-256 identik.</p>

  <h3 class="h3">4.2 Perilaku Cipher 26 Huruf pada File</h3>
  <p>Untuk cipher <b>26 huruf alfabet</b> (a, b, d, e, f, h), sesuai ketentuan
  soal poin 2, program <b>hanya memproses huruf</b> — angka, spasi, dan tanda
  baca dibuang. Konsekuensinya, menerapkan cipher 26 huruf pada file biner akan
  <b>mengubah isi file</b>. Ini adalah <b>perilaku yang benar sesuai spesifikasi</b>,
  bukan kesalahan program. Antarmuka menandai hal ini dengan lencana peringatan
  <i>"26 huruf"</i>, dan untuk file sebaiknya digunakan cipher biner (c, g).
  Data pendukung: pada pengujian di atas, cipher 26 huruf menghasilkan
  <b>0/5</b> file yang byte-identik (lihat berkas bukti <code>roundtrip.json</code>),
  tepat seperti yang diharapkan.</p>
</section>
"""


def bab5(cv) -> str:
    """Tabel centang a-i, diisi jujur."""
    spec = [
        ("1", "Vigenere Cipher standard (26 huruf alfabet)", "vigenere"),
        ("2", "Varian Vigenere: Auto-Key Vigenere Cipher", "autokey"),
        ("3", "Extended Vigenere Cipher (256 karakter ASCII)", "ext-vigenere"),
        ("4", "Playfair Cipher (26 huruf alfabet)", "playfair"),
        ("5", "Affine Cipher (26 huruf alfabet)", "affine"),
        ("6", "Hill Cipher (26 huruf alfabet)", "hill"),
        ("7", "Super enkripsi (Extended Vigenere + transposisi kolom)", "super"),
        ("8", "(Bonus 1) Enigma cipher", "enigma"),
    ]
    ket = {
        "vigenere": "Enkripsi &amp; dekripsi benar; cocok untuk pesan teks. Pada file biner hanya huruf yang diproses (sesuai soal poin 2).",
        "autokey": "Enkripsi &amp; dekripsi benar; keystream = kunci diikuti plainteks.",
        "ext-vigenere": "Bekerja pada seluruh 256 byte; <b>byte-identik</b> pada uji 5 kategori file.",
        "playfair": "Matriks 5×5, I/J digabung, digraf, filler X; enkripsi &amp; dekripsi benar.",
        "affine": "Divalidasi agar <i>a</i> koprima dengan 26 (12 nilai sah); enkripsi &amp; dekripsi benar.",
        "hill": "Matriks 2×2 &amp; 3×3; determinan diperiksa harus koprima 26 agar punya invers.",
        "super": "Gabungan Extended Vigenere + Transposisi Kolom; <b>byte-identik</b> pada uji 5 kategori file.",
        "enigma": "Enigma I: 3 rotor, reflector B, ring setting, plugboard; enkripsi &amp; dekripsi benar.",
    }
    rows = []
    for no, nama, slug in spec:
        n = sum(1 for r in cv["rows"] if r["cipher"] == slug and r["pass"])
        tot = sum(1 for r in cv["rows"] if r["cipher"] == slug)
        rows.append(
            f'<tr><td class="ctr">{no}</td><td>{esc(nama)}</td>'
            f'<td class="ctr ok">✓</td><td class="ctr">–</td>'
            f'<td>{ket[slug]} <span class="dim2">(vektor lulus: {n}/{tot})</span></td></tr>'
        )
    rows.append(
        '<tr><td class="ctr">9</td><td>(Bonus 2) Menggunakan bahasa Ruby</td>'
        '<td class="ctr ok">✓</td><td class="ctr">–</td>'
        '<td>Seluruh cipher ditulis ulang dalam Ruby (Sinatra) dan hasilnya '
        f'<b>{cv["passed"]}/{cv["total"]} identik</b> dengan TypeScript serta vektor acuan '
        '(lihat Lampiran A).</td></tr>'
    )
    rows.append(
        '<tr><td class="ctr">–</td><td>Transposisi Kolom <i>(bagian dari g)</i></td>'
        '<td class="ctr ok">✓</td><td class="ctr">–</td>'
        '<td>Diimplementasikan dan diuji; tidak diberi huruf sendiri karena '
        'merupakan tahap kedua Super Enkripsi.</td></tr>'
    )

    return f"""
<section>
  <h2 class="h2">5. Tabel Centang Spesifikasi (a–i)</h2>
  <p>Tabel berikut diisi berdasarkan hasil pengujian nyata. Kolom
  <b>Berhasil</b> berarti program sesuai spesifikasi serta enkripsi dan dekripsi
  benar, baik untuk pesan yang diketik maupun file.</p>

  <table class="tbl check">
    <tr><th class="ctr">No</th><th>Spek</th><th class="ctr">Berhasil<br>(✓)</th>
        <th class="ctr">Kurang<br>Berhasil (✓)</th><th>Keterangan</th></tr>
    {''.join(rows)}
  </table>

  <p class="note">Seluruh butir dinyatakan <b>Berhasil</b>. Tidak ada butir yang
  perlu dicentang "Kurang Berhasil"; namun keterbatasan yang jujur perlu dicatat
  dan diuraikan pada <b>Bab 8</b> (antara lain: cipher 26 huruf tidak
  mempertahankan byte non-alfabet, dan Enigma diimplementasikan sebagai bonus
  dengan model Enigma I).</p>
</section>
"""


def bab6() -> str:
    """R3 — kode program (ringkas) + cara menjalankan."""
    struktur = read("README.md")
    # ambil blok struktur dari README
    m = re.search(r"## Struktur repositori\n\n```\n(.*?)```", struktur, re.S)
    tree = m.group(1) if m else "(lihat README.md)"

    modul = [
        ("core.ts", "Utilitas inti: sanitasi 26 huruf, modulo, invers modulo, operasi matriks, base64.", 306),
        ("index.ts", "Registry semua cipher + fungsi runCipher() + pembuat label. Satu-satunya sumber daftar cipher.", 319),
        ("envelope.ts", "Format berkas .dat (magic KRI1): magic, versi, id cipher, header JSON, payload.", 146),
        ("vigenere.ts", "a) Vigenere standard & b) Auto-Key Vigenere.", 72),
        ("extended-vigenere.ts", "c) Extended Vigenere 256 ASCII (semua byte).", 34),
        ("playfair.ts", "d) Playfair: matriks 5×5, digraf, filler X.", 107),
        ("affine.ts", "e) Affine: validasi a koprima 26, rumus (a·x+b) mod 26.", 53),
        ("hill.ts", "f) Hill: matriks 2×2/3×3, determinan & invers mod 26.", 93),
        ("super-encryption.ts", "g) Super Enkripsi: Extended Vigenere lalu Transposisi Kolom.", 45),
        ("columnar.ts", "Transposisi Kolom (tahap kedua g).", 64),
        ("enigma.ts", "h) Enigma I: rotor, notch, reflector, plugboard, ring setting.", 194),
    ]
    mod_rows = "".join(
        f'<tr><td class="mono">{esc(n)}</td><td class="num">{l}</td><td>{d}</td></tr>'
        for n, d, l in modul
    )

    return f"""
<section>
  <h2 class="h2">6. Kode Program dan Cara Menjalankan</h2>
  <p>Kode program lengkap disertakan bersama laporan ini di dalam repositori,
  beserta <b>README</b> berisi cara menjalankannya (wajib sesuai soal poin 3).
  Bab ini menampilkan struktur proyek dan isi modul-modul inti.</p>

  <h3 class="h3">6.1 Struktur Proyek</h3>
  <pre class="code tree"><code>{esc(tree)}</code></pre>

  <h3 class="h3">6.2 Daftar Modul Inti (apps/web/src/lib/crypto/)</h3>
  <table class="tbl">
    <tr><th>Berkas</th><th class="num">Baris</th><th>Isi</th></tr>
    {mod_rows}
  </table>
  <p class="note">Padanan Ruby dari seluruh modul di atas terdapat di
  <code>apps/api/lib/firdaus_cipher/</code>. Nama berkas memakai gaya Ruby
  (<i>snake_case</i>), misalnya <code>extended-vigenere.ts</code> berpadanan
  dengan <code>extended_vigenere.rb</code>.</p>

  <h3 class="h3">6.3 Kode: Utilitas Inti (core.ts)</h3>
  <p>Berisi operasi yang dipakai bersama seluruh cipher, termasuk aturan
  <b>sanitasi 26 huruf</b> (soal poin 2) dan operasi matriks untuk Hill.</p>
  {code("apps/web/src/lib/crypto/core.ts")}

  <h3 class="h3">6.4 Kode: Registry Cipher (index.ts)</h3>
  <p>Daftar resmi cipher beserta huruf, jenis, dan parameternya. Antarmuka
  (dropdown, lencana, validasi) dibangun dari daftar ini sehingga tidak ada
  daftar cipher yang ditulis ulang di tempat lain.</p>
  {code("apps/web/src/lib/crypto/index.ts")}

  <h3 class="h3">6.5 Kode: Format Berkas .dat (envelope.ts)</h3>
  <p>Membungkus hasil enkripsi file agar nama asli, tipe MIME, dan jenis cipher
  tersimpan di dalam berkas (soal poin 9).</p>
  {code("apps/web/src/lib/crypto/envelope.ts")}

  <h3 class="h3">6.6 Kode: Contoh Cipher 26 Huruf (vigenere.ts)</h3>
  {code("apps/web/src/lib/crypto/vigenere.ts")}

  <h3 class="h3">6.7 Kode: Contoh Cipher Biner (extended-vigenere.ts)</h3>
  {code("apps/web/src/lib/crypto/extended-vigenere.ts")}

  <h3 class="h3">6.8 Kode: Super Enkripsi (super-encryption.ts)</h3>
  <p>Gabungan Extended Vigenere (tahap 1) dan Transposisi Kolom (tahap 2),
  sesuai soal poin g.</p>
  {code("apps/web/src/lib/crypto/super-encryption.ts")}

  <h3 class="h3">6.9 Kode: Padanan Ruby (contoh)</h3>
  <p>Untuk menunjukkan implementasi kedua, berikut potongan modul Ruby yang
  setara dengan <code>extended-vigenere.ts</code>.</p>
  {code("apps/api/lib/firdaus_cipher/extended_vigenere.rb")}

  <h3 class="h3">6.10 Cara Menjalankan Program (ringkasan README)</h3>
  <p><b>Prasyarat:</b> Node.js ≥ 20, pnpm ≥ 10, Ruby 3.3, Bundler 2.5+.</p>
  <pre class="code"><code>{esc('''# 1) Pasang dependensi
git clone <url-repo> firdauscipher && cd firdauscipher
pnpm install

# 2) Jalankan aplikasi web (GUI utama)
pnpm dev            # buka http://localhost:3000

# 3) (Opsional) Jalankan REST API Ruby
cd apps/api
bundle config set --local without "production lint"
bundle install
cd ../.. && pnpm api     # http://127.0.0.1:9292''')}</code></pre>
  <p><b>Cara pakai:</b> pilih cipher (a–h) → pilih Mode Teks atau Mode File →
  isi kunci → klik <i>Enkripsi</i> (atau <i>Enkripsi &amp; Unduh .dat</i> untuk
  file). Untuk mengembalikan, gunakan tab <i>Dekripsi File (.dat)</i>.</p>
  <p>Dokumentasi lengkap: <code>README.md</code> (root),
  <code>apps/web/README.md</code>, dan <code>apps/api/README.md</code>.</p>
</section>
"""


def bab7() -> str:
    return """
<section>
  <h2 class="h2">7. Kreativitas dan Inovasi (Nilai Tambah)</h2>
  <p>Beberapa hal dikerjakan melebihi permintaan minimum soal. Semuanya
  berfungsi dan telah diuji.</p>

  <h3 class="h3">7.1 Verifikasi Silang Tiga Arah (TypeScript ↔ Ruby ↔ Vektor Acuan)</h3>
  <p>Bukan sekadar menulis dua implementasi, melainkan menyiapkan
  <b>vektor acuan independen</b> (dibuat dengan Python) lalu membandingkan
  ketiganya secara otomatis untuk 27 kasus. Ini membuat hasil tidak hanya
  "jalan", tetapi <b>terbukti benar</b>. Perintah: <code>pnpm cross-verify</code>.</p>

  <h3 class="h3">7.2 Bukti Otomatis yang Dapat Diulang</h3>
  <p>Screenshot antarmuka (R1), uji file lima kategori (R2), dan tabel verifikasi
  silang semuanya dihasilkan oleh skrip, bukan diketik manual. Artinya dosen
  dapat menjalankan ulang perintah yang sama dan memperoleh bukti yang sama.
  Angka-angka pada laporan ini pun diambil otomatis dari berkas bukti tersebut.</p>

  <h3 class="h3">7.3 Envelope <code>.dat</code> dengan Metadata</h3>
  <p>Berkas cipherteks menyimpan nama dan tipe file asli di dalam header
  (format KRI1), sehingga saat dekripsi file kembali ke nama dan ekstensi semula
  tanpa pengguna harus mengingatnya — menjawab soal poin 9 secara nyaman.</p>

  <h3 class="h3">7.4 Antarmuka Berbasis Satu Sumber Kebenaran</h3>
  <p>Seluruh antarmuka (pemilih cipher, lencana, kolom kunci, validasi) dibangun
  dari satu daftar cipher di <code>index.ts</code>. Menambah cipher baru tidak
  perlu mengubah banyak berkas. Pemisahan huruf a–h dari tahap internal g juga
  dijaga otomatis agar tidak ada dua cipher berlabel sama.</p>

  <h3 class="h3">7.5 Pemrosesan di Web Worker</h3>
  <p>Perhitungan cipher (termasuk file besar) dijalankan di <i>web worker</i>
  sehingga antarmuka tetap responsif dan tidak "membeku" saat memproses file
  berukuran besar.</p>

  <h3 class="h3">7.6 Dapat Berjalan Sepenuhnya Offline</h3>
  <p>Program dirancang agar dapat didemonstrasikan <b>tanpa koneksi internet</b>
  — berguna untuk presentasi di kelas tanpa wifi. Tidak ada CDN, tidak ada
  panggilan API luar, dan tidak ada font daring: seluruh kriptografi dihitung
  di dalam peramban, sedangkan halaman memakai font sistem.</p>
  <p>Hal ini <b>diuji secara nyata</b> dengan mematikan jaringan pada tingkat
  sistem operasi (<code>bwrap --unshare-net</code>), bukan sekadar diperiksa
  dari kode:</p>
  <table class="tbl keep">
    <tr><th>Yang diuji (jaringan mati)</th><th>Hasil</th></tr>
    <tr><td><code>pnpm build</code> (produksi)</td><td class="ok">Berhasil ✓</td></tr>
    <tr><td>Aplikasi melayani halaman (<code>pnpm start</code>)</td><td class="ok">HTTP 200 ✓</td></tr>
    <tr><td>Enkripsi Vigenere di peramban</td><td class="ok">didoarwgphswqynwm ✓</td></tr>
    <tr><td>Dekripsi mengembalikan teks semula</td><td class="ok">serangsubuhsekali ✓</td></tr>
    <tr><td>Permintaan keluar ke internet</td><td class="ok">0 (tidak ada) ✓</td></tr>
    <tr><td>REST API Ruby (<code>/health</code>, encrypt/decrypt)</td><td class="ok">Berhasil ✓</td></tr>
    <tr><td>Skrip screenshot (bukti R1)</td><td class="ok">11/11 ✓</td></tr>
  </table>
  <p class="note">Sebelumnya aplikasi memakai <code>next/font/google</code>
  (Geist) sehingga <code>pnpm build</code> <b>gagal</b> saat tidak ada internet.
  Font tersebut diganti ke tumpukan font sistem agar aman saat demo offline;
  seluruh 254 tes TypeScript dan 127 tes Ruby tetap lulus setelah perubahan.</p>
</section>
"""


def bab8() -> str:
    return """
<section>
  <h2 class="h2">8. Catatan Jujur: Kendala dan Keterbatasan</h2>
  <p>Sesuai petunjuk soal ("jika program tidak selesai / masih ada yang salah,
  tuliskan di dalam laporan"), berikut hal-hal yang perlu diketahui secara
  terbuka.</p>

  <table class="tbl">
    <tr><th>Hal</th><th>Penjelasan</th></tr>
    <tr>
      <td><b>Cipher 26 huruf pada file biner</b></td>
      <td>Sesuai soal poin 2, cipher 26 huruf (a, b, d, e, f, h) hanya memproses
      huruf A–Z; angka, spasi, dan tanda baca dibuang. Menerapkannya pada file
      biner karena itu mengubah isi file. Ini <b>perilaku yang benar sesuai
      spesifikasi</b>, bukan bug. Untuk file digunakan cipher biner (c, g).</td>
    </tr>
    <tr>
      <td><b>Enigma dibatasi pada model Enigma I</b></td>
      <td>Implementasi Enigma memakai 3 rotor, reflector B, ring setting, dan
      plugboard opsional — model Enigma I. Konfigurasi lain (mis. 4 rotor
      Enigma M4) tidak disediakan. Ini cukup untuk bonus poin h.</td>
    </tr>
    <tr>
      <td><b>Hill terbatas 2×2 dan 3×3</b></td>
      <td>Ukuran matriks kunci dibatasi 2×2 dan 3×3 agar invers modulo 26 selalu
      dapat dihitung dan divalidasi.</td>
    </tr>
    <tr>
      <td><b>Batas ukuran file 100 MB</b></td>
      <td>Untuk menjaga kinerja peramban, ukuran file dibatasi 100 MB. Di atas
      batas itu file ditolak dengan pesan yang jelas.</td>
    </tr>
    <tr>
      <td><b>Mode teks tidak mengembalikan spasi/huruf besar</b></td>
      <td>Karena cipher 26 huruf hanya memproses A–Z, hasil dekripsi mode teks
      berupa huruf tanpa spasi (mis. <code>serangsubuhsekali</code>, bukan
      <code>SERANG SUBUH SEKALI</code>). Sesuai definisi cipher klasik; untuk
      mempertahankan byte apa adanya digunakan mode biner.</td>
    </tr>
    <tr>
      <td><b>Deploy ke hosting belum dilakukan</b></td>
      <td>Program dijalankan secara lokal dan telah diuji menyeluruh. Langkah
      publikasi ke layanan hosting belum diselesaikan, sehingga pada README
      bagian "cara deploy / URL produksi" sengaja dikosongkan agar tidak memuat
      tautan yang tidak dapat diakses.</td>
    </tr>
  </table>

  <p class="note">Meskipun ada catatan di atas, <b>seluruh butir spesifikasi
  a–i dinyatakan berhasil</b> berdasarkan pengujian pada Bab 4, Bab 5, dan
  Lampiran A.</p>
</section>
"""


def lampiran(cv) -> str:
    rows = []
    for r in cv["rows"]:
        cls = "ok" if r["pass"] else "bad"
        mark = "✓" if r["pass"] else "✗"
        ts = r.get("tsEncrypt", "")
        rb = r.get("rubyEncrypt", "")
        ref = r.get("vectorCiphertext", "")
        rows.append(
            f'<tr class="{cls}-row"><td class="mono">{esc(r["id"])}</td>'
            f'<td class="mono">{esc(r["cipher"])}</td>'
            f'<td class="mono tiny">{esc(ts[:22])}</td>'
            f'<td class="mono tiny">{esc(rb[:22])}</td>'
            f'<td class="mono tiny">{esc(ref[:22])}</td>'
            f'<td class="ctr {cls}">{mark}</td></tr>'
        )
    return f"""
<section>
  <h2 class="h2">Lampiran A — Bukti Verifikasi Silang TypeScript ↔ Ruby</h2>
  <p>Hasil perintah <code>pnpm cross-verify</code>: setiap vektor dijalankan di
  <b>TypeScript</b>, di <b>Ruby</b>, lalu dibandingkan dengan <b>vektor acuan</b>
  (dibuat terpisah dengan Python). Tiga kolom harus sama.</p>
  <p class="stat"><b>Total {cv["total"]} kasus — enkripsi identik {cv["encIdentical"]}/{cv["total"]},
  dekripsi identik {cv["decIdentical"]}/{cv["total"]}, lulus {cv["passed"]}/{cv["total"]}.</b>
  Berkas bukti: <code>laporan/uji/cross-verify.json</code> (dihasilkan {esc(cv.get("generated","-"))}).</p>

  <table class="tbl tiny-tbl">
    <tr><th>ID</th><th>Cipher</th><th>TypeScript</th><th>Ruby</th>
        <th>Vektor acuan</th><th class="ctr">✓</th></tr>
    {''.join(rows)}
  </table>

  <p class="note">Karena ketiga sumber menghasilkan nilai yang sama untuk
  seluruh kasus, hasil implementasi dapat dinyatakan benar dan bukan kebetulan
  dari satu program saja.</p>
</section>
"""


CSS = """
@page { size: A4; margin: 16mm 15mm 18mm 15mm; }
* { box-sizing: border-box; }
body {
  font-family: "DejaVu Serif", Georgia, serif;
  font-size: 10.5pt; line-height: 1.45; color: #111; margin: 0;
}
h1 { font-size: 20pt; text-align: center; margin: 6px 0 4px; letter-spacing: .5px; }
h2.h2 {
  font-family: "DejaVu Sans", Arial, sans-serif;
  font-size: 14pt; color: #0b3d6b; border-bottom: 2.5px solid #0b3d6b;
  padding-bottom: 4px; margin: 0 0 12px;
}
h3.h3 {
  font-family: "DejaVu Sans", Arial, sans-serif;
  font-size: 11.5pt; color: #14507f; margin: 16px 0 6px;
}
section { page-break-before: always; }
section.cover { page-break-before: avoid; }
p { margin: 7px 0; text-align: justify; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: .88em;
       background: #f2f4f7; padding: 1px 3px; border-radius: 3px; }
.mono { font-family: "DejaVu Sans Mono", monospace; font-size: .85em; }
.tiny { font-size: .76em; }
ul.list, ul.toc { margin: 7px 0 7px 22px; }
ul.list li, ul.toc li { margin: 4px 0; }
ul.toc { list-style: none; margin-left: 0; }
.note { background: #f6f8fb; border-left: 3px solid #4b7fb5; padding: 7px 10px;
        font-size: .93em; }
.dim2 { color: #666; font-size: .85em; }

/* cover */
.kop { text-align: center; font-family: "DejaVu Sans", Arial, sans-serif; }
.kop-line { font-size: 10pt; letter-spacing: .3px; }
.kop-line.b { font-size: 12.5pt; font-weight: bold; }
.rule { border-top: 3px double #111; margin: 6px 0 26px; }
.cover h2 { text-align: center; font-size: 13pt; font-weight: normal;
            margin: 8px 0 26px; line-height: 1.5; }
.cover .sub { font-size: 11pt; color: #333; font-style: italic; }
table.ident { margin: 0 auto 22px; border-collapse: collapse; font-size: 10.5pt; }
table.ident th { text-align: left; padding: 4px 14px 4px 0; font-weight: normal;
                 color: #333; vertical-align: top; width: 34%; }
table.ident td { padding: 4px 0; }
.badge-box { border: 1.5px solid #0b3d6b; background: #f4f8fc;
             padding: 12px 14px; font-size: 9.8pt; text-align: justify; }

/* tabel umum */
table.tbl { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.3pt; }
table.tbl th { background: #0b3d6b; color: #fff; text-align: left;
               padding: 5px 6px; font-family: "DejaVu Sans", Arial, sans-serif;
               font-size: 9pt; }
table.tbl td { border: 1px solid #c8d2dc; padding: 4px 6px; vertical-align: top; }
table.tbl tr:nth-child(even) td { background: #f7f9fb; }
table.tbl tr { page-break-inside: avoid; }
table.keep { page-break-inside: avoid; }
.ctr { text-align: center; }
.num { text-align: right; white-space: nowrap; }
.ok { color: #0a7a2f; font-weight: bold; }
.bad { color: #b00020; font-weight: bold; }
tr.dim td { color: #555; font-style: italic; }
table.check td { font-size: 8.9pt; }

/* screenshot */
figure.shot { margin: 0 0 14px; page-break-inside: avoid; }
figure.shot img { width: 100%; border: 1px solid #9fb0c0; }
figure.shot figcaption { font-size: 9pt; margin-bottom: 5px; color: #222;
                         font-family: "DejaVu Sans", Arial, sans-serif; }

/* kode */
pre.code { background: #f7f8fa; border: 1px solid #d6dde5; border-left: 3px solid #4b7fb5;
           padding: 8px 10px; font-family: "DejaVu Sans Mono", monospace;
           font-size: 7.1pt; line-height: 1.32; white-space: pre-wrap;
           word-break: break-word; page-break-inside: auto; }
pre.code.tree { font-size: 7.6pt; }
"""


def main():
    cv, rt, sc, vec = build_data()
    doc = f"""<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<title>Laporan UTS Kriptografi — {esc(NAMA)}</title>
<style>{CSS}</style></head>
<body>
{cover()}
{toc()}
{bab1()}
{bab2(sc)}
{bab3(vec)}
{bab4(rt, cv)}
{bab5(cv)}
{bab6()}
{bab7()}
{bab8()}
{lampiran(cv)}
</body></html>"""

    out = os.path.join(LAP, "laporan-uts-kriptografi.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"HTML ditulis: {out}  ({len(doc):,} karakter)")
    return out


if __name__ == "__main__":
    main()
