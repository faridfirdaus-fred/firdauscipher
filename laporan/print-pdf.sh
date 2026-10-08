#!/usr/bin/env bash
# print-pdf.sh — cetak laporan HTML menjadi PDF memakai Chromium headless.
#
# Chromium diambil dari: $CHROME_PATH, cache Playwright, atau PATH sistem.
# Pemakaian:  bash laporan/print-pdf.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTML="$ROOT/laporan/laporan-uts-kriptografi.html"
PDF="$ROOT/laporan/laporan-uts-kriptografi.pdf"

if [[ ! -f "$HTML" ]]; then
  echo "HTML belum ada. Jalankan dulu: python3 laporan/build-laporan.py" >&2
  exit 1
fi

cari_chrome() {
  if [[ -n "${CHROME_PATH:-}" && -x "${CHROME_PATH}" ]]; then echo "$CHROME_PATH"; return; fi
  local c
  for c in "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome \
           "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux/chrome; do
    [[ -x "$c" ]] && { echo "$c"; return; }
  done
  for c in chromium chromium-browser google-chrome google-chrome-stable; do
    command -v "$c" >/dev/null 2>&1 && { command -v "$c"; return; }
  done
  return 1
}

CHROME="$(cari_chrome || true)"
if [[ -z "$CHROME" ]]; then
  echo "Chromium tidak ditemukan. Pasang: npx playwright install chromium" >&2
  echo "atau set CHROME_PATH ke binary Chrome/Chromium." >&2
  exit 1
fi

echo "Memakai Chromium: $CHROME"
rm -f "$PDF"
"$CHROME" \
  --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF" "file://$HTML" 2>&1 | tail -2

if [[ -f "$PDF" ]]; then
  echo "PDF dibuat: $PDF ($(du -h "$PDF" | cut -f1))"
else
  echo "Gagal membuat PDF." >&2
  exit 1
fi
