"use client";

/**
 * use-cipher-worker.ts — hook React untuk menjalankan cipher lewat worker (S18).
 *
 * Worker dibuat sekali per komponen dan dihentikan saat unmount supaya tidak
 * ada thread yang tertinggal.
 */

import * as React from "react";

import { CipherWorkerClient } from "./worker-client";
import type { CipherParams, Direction } from "./crypto";

export interface Progress {
  done: number;
  total: number;
}

export function useCipherWorker() {
  const ref = React.useRef<CipherWorkerClient | null>(null);
  const [progress, setProgress] = React.useState<Progress>({ done: 0, total: 0 });
  const [usingWorker, setUsingWorker] = React.useState(false);

  React.useEffect(() => {
    const client = new CipherWorkerClient();
    ref.current = client;
    setUsingWorker(client.available);
    return () => {
      client.terminate();
      ref.current = null;
    };
  }, []);

  const run = React.useCallback(
    async (
      slug: string,
      direction: Direction,
      bytes: Uint8Array,
      params: CipherParams,
    ): Promise<Uint8Array> => {
      const client = ref.current;
      if (!client) {
        // Worker belum siap (render pertama): jalankan langsung.
        const { runCipher } = await import("./crypto");
        return runCipher(slug, direction, bytes, params);
      }
      return client.run(slug, direction, bytes, params, {
        onProgress: (done, total) => setProgress({ done, total }),
      });
    },
    [],
  );

  return { run, progress, usingWorker };
}
