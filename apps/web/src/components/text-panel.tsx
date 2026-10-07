"use client";

/**
 * text-panel.tsx — panel Enkripsi/Dekripsi TEKS (S16, S17).
 *
 * Semua data lewat BYTE (`Uint8Array`), bukan string, supaya cipher 26 huruf
 * dan cipher biner memakai jalur kode yang sama (aturan §3.1 no.4).
 * Untuk cipher biner, hasil ditampilkan sebagai base64 (Sp4) + hex preview.
 */

import { ArrowLeftRight, Copy, Download, Loader2, Wand2 } from "lucide-react";
import * as React from "react";

import { KeyFields } from "@/components/key-fields";
import { Badge, Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { downloadBytes } from "@/lib/file-utils";
import { buildTextDat, runText, type TextResult } from "@/lib/cipher-runner";
import { getCipher, type CipherDef, type CipherParams } from "@/lib/crypto";
import { useCipherWorker } from "@/lib/use-cipher-worker";

function defaultParams(cipher: CipherDef): CipherParams {
  const out: CipherParams = {};
  for (const f of cipher.keyFields) out[f.name] = f.defaultValue ?? "";
  return out;
}

export function TextPanel({ slug }: { slug: string }) {
  const cipher = React.useMemo(() => getCipher(slug), [slug]);
  const [params, setParams] = React.useState<CipherParams>(() => defaultParams(cipher));
  const [input, setInput] = React.useState("");
  const [result, setResult] = React.useState<TextResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState<"encrypt" | "decrypt">("encrypt");
  const [copied, setCopied] = React.useState(false);
  const { run, progress } = useCipherWorker();

  // Reset kunci saat cipher berganti (mis. pindah tab).
  React.useEffect(() => {
    setParams(defaultParams(getCipher(slug)));
    setResult(null);
    setError(null);
  }, [slug]);

  const onParam = (name: string, value: string) =>
    setParams((prev) => ({ ...prev, [name]: value }));

  const execute = async (direction: "encrypt" | "decrypt") => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Validasi + peringatan dikumpulkan dulu lewat runText (sinkron, cepat).
      const preview = runText(slug, direction, input, params, cipher.isAlpha);
      // Untuk data besar, jalankan lewat worker supaya UI tidak beku (S18).
      const bytes = await run(
        slug,
        direction,
        new TextEncoder().encode(input),
        params,
      );
      setResult({ ...preview, bytes });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const swap = () => {
    if (result) {
      setInput(result.display);
      setResult(null);
      setMode(mode === "encrypt" ? "decrypt" : "encrypt");
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Gagal menyalin ke clipboard (izin browser ditolak).");
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge>{cipher.letter}</Badge>
            {cipher.name}
          </CardTitle>
          <CardDescription>{cipher.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <KeyFields fields={cipher.keyFields} values={params} onChange={onParam} disabled={busy} />

          <div className="grid gap-2">
            <Label htmlFor="input-text">
              {mode === "encrypt" ? "Plaintext" : "Ciphertext"}{" "}
              {cipher.isAlpha ? "(hanya huruf A-Z yang diproses)" : "(semua byte)"}
            </Label>
            <Textarea
              id="input-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encrypt"
                  ? cipher.isAlpha
                    ? "SERANG SUBUH SEKALI"
                    : "Teks apa pun, termasuk spasi dan simbol"
                  : "Tempel ciphertext di sini"
              }
              disabled={busy}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => execute("encrypt")} disabled={busy || input.length === 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Enkripsi
            </Button>
            <Button
              variant="secondary"
              onClick={() => execute("decrypt")}
              disabled={busy || input.length === 0}
            >
              Dekripsi
            </Button>
            <Button variant="ghost" onClick={swap} disabled={!result} title="Pakai hasil sebagai input">
              <ArrowLeftRight className="h-4 w-4" />
              Tukar
            </Button>
            {progress.total > 0 && progress.done < progress.total ? (
              <span className="text-xs text-muted-foreground">
                Memproses {progress.done.toLocaleString("id-ID")}/{progress.total.toLocaleString("id-ID")} byte…
              </span>
            ) : null}
          </div>

          {error ? (
            <Alert variant="error" title="Gagal memproses">
              {error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Hasil
              <span data-testid="result-kind">
                {result.isBinary ? <Badge>base64</Badge> : <Badge>teks</Badge>}
              </span>
            </CardTitle>
            <CardDescription>
              {result.bytes.length.toLocaleString("id-ID")} byte keluaran
              {result.isBinary ? " — ditampilkan base64 (Sp4)" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {result.warnings.map((w, i) => (
              <Alert key={i} variant="warning" title="Perhatian">
                {w}
              </Alert>
            ))}

            <Textarea
              value={result.display}
              readOnly
              data-testid="result-output"
              className="min-h-32"
            />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Tersalin!" : "Salin"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadBytes(result.bytes, `hasil-${slug}.txt`)}
              >
                <Download className="h-3.5 w-3.5" />
                Unduh hasil
              </Button>
              <Button
                variant="outline"
                size="sm"
                title="Simpan ciphertext sebagai file .dat berheader (Sp6, Sp9)"
                onClick={() => {
                  const { dat, fileName } = buildTextDat(
                    slug,
                    cipher.id,
                    params,
                    new TextEncoder().encode(input),
                    result.bytes,
                    cipher.isAlpha,
                  );
                  downloadBytes(dat, fileName);
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Simpan .dat
              </Button>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Detail byte (hex 64 byte pertama) &amp; base64
              </summary>
              <div className="mt-2 grid gap-1 font-mono text-[11px]">
                <p className="break-all text-muted-foreground">hex: {result.hexPreview || "(kosong)"}</p>
                <p className="break-all text-muted-foreground">b64: {result.base64.slice(0, 120) || "(kosong)"}</p>
              </div>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
