/// <reference lib="webworker" />
/**
 * cipher.worker.ts — jalankan cipher di Web Worker (S18).
 *
 * Kenapa worker: file 100 MB diblokir UI kalau diproses di main thread.
 * Worker ini menerima byte + parameter, mengembalikan byte hasil, dan
 * mengirim progres untuk operasi panjang.
 *
 * Protokol:
 *   main -> worker : { id, type: "run", slug, direction, bytes, params }
 *   worker -> main : { id, type: "progress", done, total }
 *                    { id, type: "done", bytes }
 *                    { id, type: "error", message }
 */

import { runCipher, type CipherParams, type Direction } from "@/lib/crypto";

export interface WorkerRequest {
  id: number;
  type: "run";
  slug: string;
  direction: Direction;
  bytes: Uint8Array;
  params: CipherParams;
}

export type WorkerResponse =
  | { id: number; type: "progress"; done: number; total: number }
  | { id: number; type: "done"; bytes: Uint8Array }
  | { id: number; type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  if (!req || req.type !== "run") return;

  try {
    const total = req.bytes.length;
    // Progres kasar: kabari UI saat mulai dan setelah selesai. Cipher sendiri
    // berjalan linear, jadi laporan per-chunk akan menambah overhead tanpa
    // manfaat nyata untuk file < 100 MB.
    const post = (msg: WorkerResponse, transfer?: Transferable[]) =>
      transfer ? ctx.postMessage(msg, transfer) : ctx.postMessage(msg);

    post({ id: req.id, type: "progress", done: 0, total });

    const out = runCipher(req.slug, req.direction, req.bytes, req.params);

    post({ id: req.id, type: "progress", done: total, total });
    post({ id: req.id, type: "done", bytes: out }, [out.buffer]);
  } catch (err) {
    ctx.postMessage({
      id: req.id,
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    } satisfies WorkerResponse);
  }
});

export {};
