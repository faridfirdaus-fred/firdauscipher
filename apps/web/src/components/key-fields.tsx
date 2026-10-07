"use client";

/**
 * key-fields.tsx — render form kunci otomatis dari metadata `KeyField` (S16).
 *
 * GUI tidak punya kode khusus per cipher: begitu cipher baru ditambah ke
 * registry, formnya muncul sendiri.
 */

import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CipherParams, KeyField } from "@/lib/crypto";

export function KeyFields({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: KeyField[];
  values: CipherParams;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.name] ?? field.defaultValue ?? "";
        const id = `key-${field.name}`;
        const full = field.type === "matrix";

        return (
          <div key={field.name} className={full ? "sm:col-span-2" : undefined}>
            <Label htmlFor={id} className="mb-1 block">
              {field.label}
            </Label>

            {field.type === "select" ? (
              <Select value={value} onValueChange={(v) => onChange(field.name, v)} disabled={disabled}>
                <SelectTrigger id={id} aria-label={field.label}>
                  <SelectValue placeholder={field.placeholder ?? "Pilih…"} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={id}
                type={field.type === "number" ? "number" : "text"}
                value={value}
                placeholder={field.placeholder}
                disabled={disabled}
                onChange={(e) => onChange(field.name, e.target.value)}
                className={full ? "font-mono text-xs" : undefined}
              />
            )}

            {field.help ? <p className="mt-1 text-[11px] text-muted-foreground">{field.help}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
