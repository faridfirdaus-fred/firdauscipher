"use client";

/**
 * cipher-picker.tsx — daftar pilihan cipher.
 *
 * Sengaja berupa daftar tombol (chip) yang semuanya terlihat sekaligus, bukan
 * dropdown: jumlah cipher sedikit dan pengguna jadi cukup sekali klik. Daftar
 * dibangun dari registry, jadi cipher baru otomatis muncul tanpa menyentuh JSX.
 *
 * Huruf soal (a-h) TIDAK ditampilkan di sini; pemetaannya ada di halaman /docs.
 */

import { CIPHERS } from "@/lib/crypto";
import { cn } from "@/lib/utils";

export function CipherPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pilih cipher"
      className="flex flex-wrap gap-2"
    >
      {CIPHERS.map((c) => {
        const active = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(c.slug)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
