"use client";

/**
 * page.tsx — halaman utama FirdausCipher (S16).
 *
 * Satu halaman: pilih cipher -> pilih mode (teks/file) -> jalankan.
 * Semua cipher diambil dari registry sehingga tidak ada logika khusus
 * per cipher di sini.
 */

import { Github, ShieldCheck } from "lucide-react";
import * as React from "react";

import { CipherSelector } from "@/components/cipher-selector";
import { ModePanel } from "@/components/mode-panel";
import { Badge } from "@/components/ui/feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CIPHERS, getCipher, cipherLabel } from "@/lib/crypto";

export default function Home() {
  const [slug, setSlug] = React.useState(CIPHERS[0].slug);
  const cipher = getCipher(slug);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">FirdausCipher</h1>
          <Badge className="border-emerald-500/50 text-emerald-700">
            {CIPHERS.filter((c) => !c.componentOf).length} cipher
          </Badge>
          <Badge>tanpa library cipher pihak ketiga</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Lab cipher klasik berbasis web untuk Tugas Besar Kriptografi. Semua cipher
          diimplementasikan dari nol — tanpa memakai library enkripsi pihak ketiga.
          Mendukung <strong>mode teks</strong> (huruf A-Z) dan <strong>mode file</strong>{" "}
          (semua 256 nilai byte, termasuk gambar, database, audio, dan video).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Pilih cipher</CardTitle>
          <CardDescription>
            {cipherLabel(cipher)} — {cipher.mode === "binary" ? "memproses semua byte (256 nilai)" : "hanya huruf A-Z (26 huruf)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <CipherSelector value={slug} onChange={setSlug} />

          <div className="flex flex-wrap gap-1.5">
            {CIPHERS.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSlug(c.slug)}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  c.slug === slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {cipherLabel(c)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">2. Jalankan</h2>
        <ModePanel slug={slug} />
      </section>

      <footer className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Data diproses 100% di browser Anda — tidak ada file yang dikirim ke server.
        </p>
        <p className="flex items-center gap-1.5">
          <Github className="h-3.5 w-3.5" />
          FirdausCipher · Tugas Besar Kriptografi · {CIPHERS.filter((c) => !c.componentOf).length} cipher (a–h) + {CIPHERS.filter((c) => c.componentOf).length} tahap internal, dari registry tunggal
        </p>
      </footer>
    </main>
  );
}
