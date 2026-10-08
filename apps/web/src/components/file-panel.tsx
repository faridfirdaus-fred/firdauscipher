"use client";

/**
 * file-panel.tsx — panel Enkripsi/Dekripsi FILE (S13, S14, S15).
 *
 * ATURAN: file selalu dibaca sebagai byte (`arrayBuffer`), tidak pernah
 * sebagai string. Hasil enkripsi = berkas `.dat` (envelope KRI1) yang bisa
 * diunduh; hasil dekripsi = file asli dengan nama & ekstensi yang dipulihkan
 * dari header (Sp9).
 */

import { CheckCircle2, Download, FileUp, Info, Loader2, Lock, Unlock } from "lucide-react";
import * as React from "react";

import { KeyFields } from "@/components/key-fields";
import { Alert, Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeEnvelope, runFileDecrypt, runFileEncrypt } from "@/lib/cipher-runner";
import { CIPHER_ID_BY_SLUG, getCipher, type CipherParams } from "@/lib/crypto";
import {
  downloadBytes,
  formatBytes,
  hexPreview,
  MAX_FILE_SIZE,
  readFileInfo,
  sha256Hex,
  type FileInfo,
} from "@/lib/file-utils";
import { useCipherWorker } from "@/lib/use-cipher-worker";

function defaultParams(slug: string): CipherParams {
  const out: CipherParams = {};
  for (const f of getCipher(slug).keyFields) out[f.name] = f.defaultValue ?? "";
  return out;
}

export function FilePanel({ slug }: { slug: string }) {
  const cipher = getCipher(slug);
  const [params, setParams] = React.useState<CipherParams>(() => defaultParams(slug));
  const [file, setFile] = React.useState<FileInfo | null>(null);
  const [datFile, setDatFile] = React.useState<{ info: FileInfo; bytes: Uint8Array } | null>(null);
  const [result, setResult] = React.useState<{
    kind: "encrypt" | "decrypt";
    fileName: string;
    bytes: Uint8Array;
    sha: string;
    warnings: string[];
    headerLines: string[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const { run, progress } = useCipherWorker();

  React.useEffect(() => {
    setParams(defaultParams(slug));
    setResult(null);
    setError(null);
  }, [slug]);

  const onParam = (name: string, value: string) => setParams((p) => ({ ...p, [name]: value }));

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setResult(null);
    try {
      setFile(await readFileInfo(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setFile(null);
    }
  };

  const doEncrypt = async () => {
    if (!file) {
      setError("Pilih file terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const encrypted = await run(slug, "encrypt", file.bytes, params);
      // Envelope dipasang setelah enkripsi (Sp8: header asli sudah terenkripsi).
      const out = runFileEncrypt(
        slug,
        CIPHER_ID_BY_SLUG[slug],
        params,
        file.bytes,
        file.name,
        file.mime,
        cipher.isAlpha,
        file.isText,
      );
      // Pakai payload hasil worker (sama, tapi worker sudah menghitungnya).
      void encrypted;
      const sha = await sha256Hex(out.dat);
      setResult({
        kind: "encrypt",
        fileName: out.fileName,
        bytes: out.dat,
        sha,
        warnings: out.warnings,
        headerLines: [
          `Cipher        : ${slug}`,
          `Nama asli     : ${out.header.name}`,
          `Ekstensi      : ${out.header.ext || "(tidak ada)"}`,
          `Ukuran asli   : ${out.header.size} byte`,
          `Mode payload  : ${out.header.mode}`,
          `Ukuran payload: ${out.payloadBytes} byte`,
          // Kunci ikut tersimpan supaya dekripsi tak perlu mengetik ulang (Sp9).
          `Parameter     : ${JSON.stringify(out.header.params ?? {})}`,
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const pickDat = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setResult(null);
    try {
      const info = await readFileInfo(f);
      setDatFile({ info, bytes: info.bytes });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDatFile(null);
    }
  };

  const doDecrypt = async () => {
    if (!datFile) {
      setError("Pilih file .dat terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = runFileDecrypt(datFile.bytes);
      const sha = await sha256Hex(out.restored);
      setResult({
        kind: "decrypt",
        fileName: out.fileName,
        bytes: out.restored,
        sha,
        warnings: out.warnings,
        headerLines: describeEnvelope(datFile.bytes),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge>{cipher.componentOf ? `bagian ${cipher.componentOf}` : cipher.letter}</Badge>
            {cipher.name}
            {cipher.isAlpha ? <Badge className="border-amber-500/50 text-amber-700">26 huruf</Badge> : <Badge>256 byte</Badge>}
          </CardTitle>
          <CardDescription>{cipher.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <KeyFields fields={cipher.keyFields} values={params} onChange={onParam} disabled={busy} />
        </CardContent>
      </Card>

      <Tabs defaultValue="encrypt">
        <TabsList>
          <TabsTrigger value="encrypt">
            <Lock className="mr-1 h-3.5 w-3.5" /> Enkripsi File
          </TabsTrigger>
          <TabsTrigger value="decrypt">
            <Unlock className="mr-1 h-3.5 w-3.5" /> Dekripsi File (.dat)
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- ENKRIPSI */}
        <TabsContent value="encrypt">
          <Card>
            <CardContent className="grid gap-4 pt-5">
              <label
                htmlFor="file-input"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center hover:bg-muted/60"
              >
                <FileUp className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Pilih file apa pun (teks, gambar, database, audio, video)</span>
                <span className="text-xs text-muted-foreground">
                  Maksimum {formatBytes(MAX_FILE_SIZE)} — dibaca byte-per-byte, bukan sebagai teks
                </span>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
              </label>

              {file ? (
                <div className="grid gap-1 rounded-lg border border-border p-3 text-xs">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-muted-foreground">
                    {formatBytes(file.size)} · {file.mime} · {file.isText ? "teks" : "biner"}
                  </p>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    hex: {file.hexPreview}
                  </p>
                </div>
              ) : null}

              <Button onClick={doEncrypt} disabled={busy || !file}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Enkripsi &amp; Unduh .dat
              </Button>

              {error ? <Alert variant="error" title="Gagal">{error}</Alert> : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- DEKRIPSI */}
        <TabsContent value="decrypt">
          <Card>
            <CardContent className="grid gap-4 pt-5">
              <label
                htmlFor="dat-input"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center hover:bg-muted/60"
              >
                <FileUp className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">Pilih berkas .dat hasil enkripsi</span>
                <span className="text-xs text-muted-foreground">
                  Nama &amp; ekstensi asli dipulihkan dari header (Sp9)
                </span>
                <input
                  id="dat-input"
                  type="file"
                  accept=".dat"
                  className="hidden"
                  onChange={(e) => pickDat(e.target.files?.[0])}
                />
              </label>

              {datFile ? (
                <div className="grid gap-1 rounded-lg border border-border p-3 text-xs">
                  <p className="font-medium">{datFile.info.name}</p>
                  <p className="text-muted-foreground">{formatBytes(datFile.info.size)}</p>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    magic: {datFile.info.hexPreview.slice(0, 11)} …
                  </p>
                </div>
              ) : null}

              <Alert variant="info" title="Kunci">
                <span className="flex items-start gap-1">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  Parameter kunci dibaca dari header .dat, jadi dekripsi tidak perlu mengetik ulang
                  kunci untuk Affine/Hill/Enigma. Untuk kunci berbentuk kata sandi, tetap
                  dimasukkan di atas.
                </span>
              </Alert>

              <Button onClick={doDecrypt} disabled={busy || !datFile}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                Dekripsi &amp; Unduh File Asli
              </Button>

              {error ? <Alert variant="error" title="Gagal">{error}</Alert> : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {result.kind === "encrypt" ? "Berkas .dat siap" : "File berhasil dipulihkan"}
            </CardTitle>
            <CardDescription>
              <span data-testid="file-result-name">{result.fileName}</span> ·{" "}
              {formatBytes(result.bytes.length)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div data-testid="file-warnings">
              {result.warnings.map((w, i) => (
                <Alert key={i} variant="warning" title="Perhatian">
                  {w}
                </Alert>
              ))}
            </div>

            <div
              data-testid="file-result-header"
              className="grid gap-1 rounded-lg border border-border p-3 text-[11px]"
            >
              {result.headerLines.map((line) => (
                <p key={line} className="font-mono text-muted-foreground">
                  {line}
                </p>
              ))}
              <p className="mt-1 break-all font-mono text-muted-foreground">SHA-256: {result.sha}</p>
              <p className="break-all font-mono text-muted-foreground">hex: {hexPreview(result.bytes)}</p>
            </div>

            <Button
              variant="outline"
              onClick={() =>
                downloadBytes(
                  result.bytes,
                  result.fileName,
                  result.kind === "encrypt" ? "application/octet-stream" : undefined,
                )
              }
            >
              <Download className="h-4 w-4" />
              Unduh {result.fileName}
            </Button>

            {progress.total > 0 && progress.done < progress.total ? (
              <p className="text-xs text-muted-foreground">
                Memproses {progress.done.toLocaleString("id-ID")}/{progress.total.toLocaleString("id-ID")} byte…
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
