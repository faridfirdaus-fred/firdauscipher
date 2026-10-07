"use client";

/**
 * cipher-selector.tsx — pemilih cipher (S16).
 *
 * Dibuat dari registry, bukan hardcode di JSX, jadi cipher baru otomatis muncul.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CIPHERS } from "@/lib/crypto";

export function CipherSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full sm:w-80" aria-label="Pilih cipher">
        <SelectValue placeholder="Pilih cipher…" />
      </SelectTrigger>
      <SelectContent>
        {CIPHERS.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.letter}) {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
