/**
 * worker-client.ts — pembungkus Web Worker dengan fallback (S18).
 *
 * Kalau browser tidak mendukung Worker (atau pembuatan worker gagal),
 * cipher dijalankan langsung di main thread supaya aplikasi tetap berfungsi.
 */

import { runCipher, type CipherParams, type Direction } from "./crypto";
import type { WorkerRequest, WorkerResponse } from "./cipher.worker";

export interface RunOptions {
  onProgress?: (done: number, total: number) => void;
}

/** Ambang ukuran: di bawah ini, worker tidak sepadan (overhead transfer). */
export const WORKER_THRESHOLD = 64 * 1024; // 64 KB

export class CipherWorkerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (b: Uint8Array) => void; reject: (e: Error) => void; onProgress?: RunOptions["onProgress"] }
  >();

  constructor() {
    this.worker = this.createWorker();
  }

  /** True kalau worker aktif dan dipakai. */
  get available(): boolean {
    return this.worker !== null;
  }

  private createWorker(): Worker | null {
    if (typeof window === "undefined" || typeof Worker === "undefined") return null;
    try {
      const worker = new Worker(new URL("./cipher.worker.ts", import.meta.url), { type: "module" });
      worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        if (msg.type === "progress") {
          entry.onProgress?.(msg.done, msg.total);
        } else if (msg.type === "done") {
          this.pending.delete(msg.id);
          entry.resolve(msg.bytes);
        } else {
          this.pending.delete(msg.id);
          entry.reject(new Error(msg.message));
        }
      });
      worker.addEventListener("error", (event) => {
        // Worker gagal total: tolak semua permintaan yang menunggu.
        const err = new Error(event.message || "Web Worker gagal dijalankan.");
        for (const [, entry] of this.pending) entry.reject(err);
        this.pending.clear();
        this.worker = null;
      });
      return worker;
    } catch {
      return null;
    }
  }

  /**
   * Jalankan cipher. Memakai worker untuk data besar, main thread untuk
   * data kecil atau kalau worker tidak tersedia.
   */
  async run(
    slug: string,
    direction: Direction,
    bytes: Uint8Array,
    params: CipherParams,
    options: RunOptions = {},
  ): Promise<Uint8Array> {
    if (!this.worker || bytes.length < WORKER_THRESHOLD) {
      options.onProgress?.(0, bytes.length);
      const out = runCipher(slug, direction, bytes, params);
      options.onProgress?.(bytes.length, bytes.length);
      return out;
    }

    const id = this.nextId++;
    const req: WorkerRequest = { id, type: "run", slug, direction, bytes, params };

    return new Promise<Uint8Array>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress: options.onProgress });
      try {
        // Kirim salinan buffer supaya worker bisa memakainya tanpa menyalin lagi.
        const copy = new Uint8Array(bytes.length);
        copy.set(bytes);
        this.worker!.postMessage(req, [copy.buffer]);
      } catch (err) {
        this.pending.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
