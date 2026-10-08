import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CIPHERS, cipherLabelWithLetter } from "@/lib/crypto";
import { GITHUB_USER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cara pakai - FirdausCipher",
  description: "Panduan singkat memakai FirdausCipher: mode teks, mode file, dan daftar cipher.",
};

/** Tabel pemetaan huruf soal -> cipher, dipakai di halaman ini. */
function CipherTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Soal</th>
            <th className="py-2 pr-4 font-medium">Cipher</th>
            <th className="py-2 font-medium">Input</th>
          </tr>
        </thead>
        <tbody>
          {CIPHERS.map((c) => (
            <tr key={c.slug} className="border-b border-border/60">
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                {c.componentOf ? `${c.componentOf} (tahap 2)` : c.letter}
              </td>
              <td className="py-2 pr-4">
                {cipherLabelWithLetter(c)}
              </td>
              <td className="py-2 text-muted-foreground">
                {c.isAlpha ? "huruf A-Z" : "semua byte (0-255)"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cara pakai</h1>
        <p className="text-sm text-muted-foreground">
          Panduan singkat, dari memilih cipher sampai menyimpan hasil.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Langkah singkat</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid list-decimal gap-2 pl-5 text-sm">
            <li>
              Pilih cipher pada daftar di{" "}
              <Link href="/" className="font-medium underline underline-offset-4">
                halaman utama
              </Link>
              .
            </li>
            <li>
              Pilih <strong>Mode Teks</strong> untuk pesan atau <strong>Mode File</strong>{" "}
              untuk berkas biner.
            </li>
            <li>Isi kunci. Nilai contoh sudah terisi, bisa langsung dijalankan.</li>
            <li>
              Masukkan data, lalu tekan <strong>Enkripsi</strong> atau <strong>Dekripsi</strong>.
            </li>
            <li>Salin hasilnya, atau unduh sebagai berkas.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mode teks dan mode file</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>
            <strong>Mode Teks</strong> memproses huruf A-Z. Spasi, angka, dan tanda
            baca dibuang, dan aplikasi memberi tahu berapa karakter yang dibuang.
          </p>
          <p>
            <strong>Mode File</strong> membaca berkas byte per byte, jadi berlaku untuk
            teks, gambar, basis data, audio, dan video. Hasil enkripsi berupa berkas{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.dat</code> yang
            menyimpan nama asli, tipe, dan kunci, sehingga bisa dikembalikan utuh.
          </p>
          <p className="text-muted-foreground">
            Untuk berkas biner, pakai cipher yang memproses semua byte: Extended
            Vigenere, Super Enkripsi, atau Transposisi Kolom. Cipher huruf A-Z akan
            merusak berkas biner, dan itu memang perilaku yang benar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar cipher</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Huruf pada kolom &ldquo;Soal&rdquo; hanya untuk mencocokkan dengan lembar
            soal. Di antarmuka, cipher ditampilkan dengan namanya saja.
          </p>
          <CipherTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            Seluruh perhitungan berjalan di peramban, tanpa mengirim data ke server,
            dan aplikasi bisa dipakai tanpa koneksi internet.
          </p>
          <p className="text-muted-foreground">
            Kode sumber:{" "}
            <a
              href={`https://github.com/${GITHUB_USER}/firdauscipher`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {GITHUB_USER}/firdauscipher
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
