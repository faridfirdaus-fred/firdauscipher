// @vitest-environment jsdom
/**
 * worker-client.test.ts — uji jalur Web Worker (S18).
 *
 * S18: "proses file besar → UI tetap responsif, progress bar bergerak, hasil
 * byte-identical". Karena `Worker` tidak ada di node/jsdom, di sini kita pakai
 * Worker tiruan yang merekam protokol pesan. Yang diuji:
 *   1. ambang ukuran: data kecil di main thread, data besar dikirim ke worker
 *   2. byte yang dikirim ke worker persis sama dengan input
 *   3. respons "progress" diteruskan ke callback, "done" mengembalikan byte
 *   4. respons "error" berubah jadi rejection, bukan crash
 *   5. worker yang gagal dibuat -> fallback main thread, aplikasi tetap jalan
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { CipherWorkerClient, WORKER_THRESHOLD } from "./worker-client";
import { runCipher } from "./crypto";

/** Worker tiruan yang bisa dikendalikan tes. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  static mode: "auto" | "silent" | "error" = "auto";

  onmessage: ((e: { data: unknown }) => void) | null = null;
  listeners: Record<string, Array<(e: unknown) => void>> = {};
  posted: Array<{ req: unknown; transfer?: Transferable[] }> = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, fn: (e: unknown) => void) {
    (this.listeners[type] ??= []).push(fn);
  }

  emit(type: string, event: unknown) {
    for (const fn of this.listeners[type] ?? []) fn(event);
  }

  postMessage(req: unknown, transfer?: Transferable[]) {
    this.posted.push({ req, transfer });
    const r = req as { id: number; slug: string; direction: "encrypt" | "decrypt"; bytes: Uint8Array; params: Record<string, string> };
    if (FakeWorker.mode === "silent") return;

    if (FakeWorker.mode === "error") {
      queueMicrotask(() =>
        this.emit("message", { data: { id: r.id, type: "error", message: "boom dari worker" } }),
      );
      return;
    }

    // Tiru worker asli: jalankan cipher dan kabari progress lalu done.
    queueMicrotask(() => {
      this.emit("message", { data: { id: r.id, type: "progress", done: 0, total: r.bytes.length } });
      const out = runCipher(r.slug, r.direction, r.bytes, r.params);
      this.emit("message", {
        data: { id: r.id, type: "progress", done: r.bytes.length, total: r.bytes.length },
      });
      this.emit("message", { data: { id: r.id, type: "done", bytes: out } });
    });
  }

  terminate() {
    this.terminated = true;
  }
}

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const bigBytes = (n: number) => {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = (i * 7 + 13) % 256;
  return b;
};

afterEach(() => {
  FakeWorker.instances = [];
  FakeWorker.mode = "auto";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("S18 — pemilihan jalur: worker vs main thread", () => {
  it("tanpa Worker (jsdom/node) -> fallback main thread, hasil tetap benar", async () => {
    const client = new CipherWorkerClient();
    expect(client.available).toBe(false);
    const out = await client.run("vigenere", "encrypt", enc("SERANG"), { key: "LEMON" });
    expect(dec(out)).toBe("didoar");
  });

  it("data di bawah ambang -> tidak dikirim ke worker (hemat overhead)", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const client = new CipherWorkerClient();
    expect(client.available).toBe(true);

    const small = enc("SERANG");
    expect(small.length).toBeLessThan(WORKER_THRESHOLD);
    const out = await client.run("vigenere", "encrypt", small, { key: "LEMON" });

    expect(dec(out)).toBe("didoar");
    expect(FakeWorker.instances[0].posted).toHaveLength(0);
  });

  it("data besar -> dikirim ke worker dan hasilnya byte-identical", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const client = new CipherWorkerClient();

    const big = bigBytes(WORKER_THRESHOLD + 1234);
    const out = await client.run("ext-vigenere", "encrypt", big, { key: "RAHASIA" });

    const worker = FakeWorker.instances[0];
    expect(worker.posted).toHaveLength(1);
    const sent = worker.posted[0].req as { bytes: Uint8Array };
    expect(sent.bytes.length).toBe(big.length);
    expect(Array.from(sent.bytes.slice(0, 32))).toEqual(Array.from(big.slice(0, 32)));

    // Hasil dari worker harus sama dengan perhitungan langsung.
    const expected = runCipher("ext-vigenere", "encrypt", big, { key: "RAHASIA" });
    expect(Array.from(out)).toEqual(Array.from(expected));
  });

  it("buffer input disalin sebelum dikirim (transferable, tidak merusak input)", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const client = new CipherWorkerClient();

    const big = bigBytes(WORKER_THRESHOLD + 10);
    const snapshot = Array.from(big.slice(0, 16));
    await client.run("ext-vigenere", "encrypt", big, { key: "RAHASIA" });

    // Buffer asli milik pemanggil tidak boleh ikut di-transfer/hilang.
    expect(big.length).toBeGreaterThan(0);
    expect(Array.from(big.slice(0, 16))).toEqual(snapshot);
    const posted = FakeWorker.instances[0].posted[0];
    expect(posted.transfer?.[0]).toBeInstanceOf(ArrayBuffer);
  });
});

describe("S18 — progres dan penanganan error", () => {
  it("progress dari worker diteruskan ke callback UI", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const client = new CipherWorkerClient();
    const big = bigBytes(WORKER_THRESHOLD + 5);

    const seen: Array<[number, number]> = [];
    await client.run("ext-vigenere", "encrypt", big, { key: "RAHASIA" }, {
      onProgress: (done, total) => seen.push([done, total]),
    });

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[seen.length - 1]).toEqual([big.length, big.length]);
  });

  it("error dari worker menjadi rejection dengan pesan aslinya", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    FakeWorker.mode = "error";
    const client = new CipherWorkerClient();

    await expect(
      client.run("ext-vigenere", "encrypt", bigBytes(WORKER_THRESHOLD + 1), { key: "RAHASIA" }),
    ).rejects.toThrow(/boom dari worker/);
  });

  it("worker crash total -> semua permintaan ditolak, tidak menggantung", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    FakeWorker.mode = "silent";
    const client = new CipherWorkerClient();

    const promise = client.run("ext-vigenere", "encrypt", bigBytes(WORKER_THRESHOLD + 1), {
      key: "RAHASIA",
    });
    FakeWorker.instances[0].emit("error", { message: "worker mati" });

    await expect(promise).rejects.toThrow();
  });

  it("terminate() menghentikan worker dan membersihkan permintaan tertunda", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    FakeWorker.mode = "silent";
    const client = new CipherWorkerClient();

    void client.run("ext-vigenere", "encrypt", bigBytes(WORKER_THRESHOLD + 1), { key: "RAHASIA" });
    client.terminate();

    expect(FakeWorker.instances[0].terminated).toBe(true);
    expect(client.available).toBe(false);
  });
});
