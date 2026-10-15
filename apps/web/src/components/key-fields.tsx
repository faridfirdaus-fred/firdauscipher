"use client";

/**
 * key-fields.tsx — render form kunci otomatis dari metadata `KeyField` (S16).
 *
 * GUI tidak punya kode khusus per cipher: begitu cipher baru ditambah ke
 * registry, formnya muncul sendiri. Field bertipe "matrix" (Hill) dirender
 * sebagai GRID berbentuk matriks, bukan satu kolom teks.
 */

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CipherParams, KeyField } from "@/lib/crypto";

/**
 * Pisah string "a,b;c,d" -> [["a","b"],["c","d"]].
 * Sel kosong DIPERTAHANKAN (penting saat pengguna mengosongkan satu sel),
 * jadi pemisahnya koma murni, bukan regex yang meruntuhkan koma berurutan.
 */
function parseGrid(value: string): string[][] {
  return value
    .split(/[;\n]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
    .map((row) => row.split(",").map((t) => t.trim()));
}

/** Gabung [["a","b"],["c","d"]] -> "a,b;c,d". */
function serializeGrid(grid: string[][]): string {
  return grid.map((row) => row.join(",")).join(";");
}

/** Paksa grid menjadi n×n; sel yang baru diisi "0" supaya tetap angka. */
function resizeGrid(grid: string[][], n: number): string[][] {
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => grid[r]?.[c] ?? "0"),
  );
}

/** Input matriks n×n: pemilih ukuran + grid sel yang menyerupai matriks. */
function MatrixField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: KeyField;
  value: string;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}) {
  const sizes = field.sizes && field.sizes.length > 0 ? field.sizes : [2, 3];
  const parsed = parseGrid(value);
  // Ukuran aktif diturunkan dari nilai: baris pada string = ukuran matriks.
  const size = sizes.includes(parsed.length) ? parsed.length : sizes[0];
  const grid = resizeGrid(parsed, size);

  function setCell(r: number, c: number, next: string) {
    const copy = grid.map((row) => row.slice());
    copy[r][c] = next;
    onChange(field.name, serializeGrid(copy));
  }

  function changeSize(n: number) {
    onChange(field.name, serializeGrid(resizeGrid(parsed, n)));
  }

  return (
    <div>
      <Label className="mb-1 block">{field.label}</Label>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Ukuran</span>
        {sizes.map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={n === size ? "default" : "outline"}
            aria-pressed={n === size}
            disabled={disabled}
            onClick={() => changeSize(n)}
          >
            {n}×{n}
          </Button>
        ))}
      </div>

      <div className="mt-2 inline-flex items-stretch gap-1">
        <span aria-hidden className="select-none self-stretch w-2 border-y-2 border-l-2 border-foreground/40 rounded-l-sm" />
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <Input
                key={`${r}-${c}`}
                aria-label={`${field.label} baris ${r + 1} kolom ${c + 1}`}
                inputMode="numeric"
                autoComplete="off"
                value={cell}
                disabled={disabled}
                onChange={(e) => setCell(r, c, e.target.value)}
                className="h-9 w-14 text-center font-mono"
              />
            )),
          )}
        </div>
        <span aria-hidden className="select-none self-stretch w-2 border-y-2 border-r-2 border-foreground/40 rounded-r-sm" />
      </div>

      {field.help ? <p className="mt-1 text-[11px] text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}

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

        if (field.type === "matrix") {
          return (
            <div key={field.name} className="sm:col-span-2">
              <MatrixField field={field} value={value} onChange={onChange} disabled={disabled} />
            </div>
          );
        }

        return (
          <div key={field.name}>
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
              />
            )}

            {field.help ? <p className="mt-1 text-[11px] text-muted-foreground">{field.help}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
