"use client";

/**
 * page.tsx — halaman utama FirdausCipher.
 *
 * Semua langkah ada dalam SATU kartu: pilih cipher, pilih mode, isi kunci,
 * masukkan data, lalu jalankan. Tidak ada dropdown dan tidak ada badge: daftar
 * cipher berupa chip yang semuanya terlihat sekaligus.
 *
 * Cipher diambil dari registry sehingga tidak ada logika khusus per cipher.
 */

import * as React from "react";

import { CipherPicker } from "@/components/cipher-picker";
import { ModePanel } from "@/components/mode-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CIPHERS, getCipher } from "@/lib/crypto";

export default function Home() {
  const [slug, setSlug] = React.useState(CIPHERS[0].slug);
  const cipher = getCipher(slug);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Enkripsi &amp; dekripsi cipher klasik
        </h1>
        <p className="text-sm text-muted-foreground">
          Pilih cipher, pilih mode, isi kunci, lalu jalankan. Semua perhitungan
          terjadi di perangkat Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih cipher dan jalankan</CardTitle>
          <CardDescription>
            Cipher terpilih: <span className="font-medium text-foreground">{cipher.name}</span>
            {cipher.isAlpha
              ? " (memproses huruf A-Z saja)"
              : " (memproses semua nilai byte, 0-255)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <CipherPicker value={slug} onChange={setSlug} />
            <p className="text-sm text-muted-foreground">{cipher.description}</p>
          </div>

          <ModePanel slug={slug} />
        </CardContent>
      </Card>
    </div>
  );
}
