# Cross-Verifikasi TypeScript ↔ Ruby (S22)

Bukti **BONUS 2**: satu set vektor (`packages/vectors/vectors.json`)
dijalankan di dua implementasi berbeda (TypeScript & Ruby) dan hasilnya
dibandingkan byte-per-byte.

- Vektor versi: `2` (2026-10-08)
- Diverifikasi: 2026-10-08T04:07:49.705Z
- Kasus: **27**

## Ringkasan

| Metrik | Hasil |
|---|---|
| Enkripsi identik (TS == Ruby == vektor) | **27/27** |
| Dekripsi identik (TS == Ruby) | **27/27** |
| Kasus lulus penuh | **27/27** |

> ✅ **LULUS — 100% kasus identik di kedua implementasi.**

## Tabel per kasus

| # | ID | Cipher | Mode | TS == Ruby | TS == Vektor | Dekripsi | Catatan |
|---|---|---|---|---|---|---|---|
| 1 | `vigenere-1` | vigenere | text | ✅ | ✅ | ✅ | Vigenere standard, kunci 'LEMON' |
| 2 | `vigenere-2` | vigenere | text | ✅ | ✅ | ✅ | Vigenere standard, kunci 'QUEENLY' |
| 3 | `vigenere-3` | vigenere | text | ✅ | ✅ | ✅ | Vigenere standard, kunci 'RAHASIA' |
| 4 | `autokey-1` | autokey | text | ✅ | ✅ | ✅ | Auto-Key Vigenere, kunci 'QUEENLY' |
| 5 | `autokey-2` | autokey | text | ✅ | ✅ | ✅ | Auto-Key Vigenere, kunci 'LEMON' |
| 6 | `autokey-3` | autokey | text | ✅ | ✅ | ✅ | Auto-Key Vigenere, kunci 'KUNCI' |
| 7 | `ext-vigenere-1` | ext-vigenere | binary | ✅ | ✅ | ✅ | Extended Vigenere 256 ASCII — teks ASCII |
| 8 | `ext-vigenere-2` | ext-vigenere | binary | ✅ | ✅ | ✅ | Extended Vigenere 256 ASCII — semua byte 0-255 (termasuk 0x00 & 0xFF) |
| 9 | `ext-vigenere-3` | ext-vigenere | binary | ✅ | ✅ | ✅ | Extended Vigenere 256 ASCII — byte acak deterministik 64 byte |
| 10 | `playfair-1` | playfair | text | ✅ | ✅ | ✅ | Playfair 5x5 (I/J gabung, filler X), kunci 'MONARCHY' |
| 11 | `playfair-2` | playfair | text | ✅ | ✅ | ✅ | Playfair 5x5 (I/J gabung, filler X), kunci 'MONARCHY' |
| 12 | `playfair-3` | playfair | text | ✅ | ✅ | ✅ | Playfair 5x5 (I/J gabung, filler X), kunci 'MONARCHY' |
| 13 | `affine-1` | affine | text | ✅ | ✅ | ✅ | Affine a=5 b=8 |
| 14 | `affine-2` | affine | text | ✅ | ✅ | ✅ | Affine a=7 b=3 |
| 15 | `affine-3` | affine | text | ✅ | ✅ | ✅ | Affine a=11 b=15 |
| 16 | `hill-1` | hill | text | ✅ | ✅ | ✅ | Hill 3x3, padding filler X |
| 17 | `hill-2` | hill | text | ✅ | ✅ | ✅ | Hill 3x3, padding filler X |
| 18 | `hill-3` | hill | text | ✅ | ✅ | ✅ | Hill 2x2, padding filler X |
| 19 | `columnar-1` | columnar | binary | ✅ | ✅ | ✅ | Transposisi kolom (byte), kunci 'ZEBRAS' — contoh klasik (25 byte -> 30 byte berpadding) |
| 20 | `columnar-2` | columnar | binary | ✅ | ✅ | ✅ | Transposisi kolom (byte), kunci 'KUNCI' — self-generated |
| 21 | `columnar-3` | columnar | binary | ✅ | ✅ | ✅ | Transposisi kolom (byte), kunci 'RAHASIA' — byte acak deterministik |
| 22 | `super-1` | super | binary | ✅ | ✅ | ✅ | Super enkripsi = Extended Vigenere('kunci1') lalu Transposisi Kolom('ZEBRAS') — teks ASCII |
| 23 | `super-2` | super | binary | ✅ | ✅ | ✅ | Super enkripsi = Extended Vigenere('K1') lalu Transposisi Kolom('KUNCI2') — semua byte 0-255 |
| 24 | `super-3` | super | binary | ✅ | ✅ | ✅ | Super enkripsi = Extended Vigenere('alpha') lalu Transposisi Kolom('BETA') — byte acak deterministik |
| 25 | `enigma-1` | enigma | text | ✅ | ✅ | ✅ | Enigma I, 3 rotor, double-stepping benar |
| 26 | `enigma-2` | enigma | text | ✅ | ✅ | ✅ | Enigma I, 3 rotor, double-stepping benar |
| 27 | `enigma-3` | enigma | text | ✅ | ✅ | ✅ | Enigma I, 3 rotor, double-stepping benar |

## Perbandingan ciphertext

| ID | TypeScript | Ruby | Vektor resmi |
|---|---|---|---|
| `vigenere-1` | `lxfopvefrnhr` | `lxfopvefrnhr` | `lxfopvefrnhr` |
| `vigenere-2` | `qnxepvyjxeaa` | `qnxepvyjxeaa` | `qnxepvyjxeaa` |
| `vigenere-3` | `brpplwgiamislacaoiduukeutsvgdeuywublnficingezaf` | `brpplwgiamislacaoiduukeutsvgdeuywublnficingezaf` | `brpplwgiamislacaoiduukeutsvgdeuywublnficingezaf` |
| `autokey-1` | `qnxepvytwtwp` | `qnxepvytwtwp` | `qnxepvytwtwp` |
| `autokey-2` | `lxfopktmdcgn` | `lxfopktmdcgn` | `lxfopktmdcgn` |
| `autokey-3` | `cyecvywlbhnkylusa` | `cyecvywlbhnkylusa` | `cyecvywlbhnkylusa` |
| `ext-vigenere-1` | `sd7gx8rg6LHM2dPa4IOu4+nT0c3Q2Y650tLa3Mjb0JWgmJ+LtsGmsrQ=` | `sd7gx8rg6LHM2dPa4IOu4+nT0c3Q2Y650tLa3Mjb0JWgmJ+LtsGmsrQ=` | `sd7gx8rg6LHM2dPa4IOu4+nT0c3Q2Y650tLa3Mjb0JWgmJ+LtsGmsrQ=` |
| `ext-vigenere-2` | `S0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSg==` | `S0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSg==` | `S0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSg==` |
| `ext-vigenere-3` | `8ECUVv1keeO3PyUgS9SiCpYwz86bXalJZzpdfgTEyHpRKO1HS0PZxB8Ylu6qtAPy7yEdrfs+ESLYCLxeZawhaw==` | `8ECUVv1keeO3PyUgS9SiCpYwz86bXalJZzpdfgTEyHpRKO1HS0PZxB8Ylu6qtAPy7yEdrfs+ESLYCLxeZawhaw==` | `8ECUVv1keeO3PyUgS9SiCpYwz86bXalJZzpdfgTEyHpRKO1HS0PZxB8Ylu6qtAPy7yEdrfs+ESLYCLxeZawhaw==` |
| `playfair-1` | `gatlmzclrqxa` | `gatlmzclrqxa` | `gatlmzclrqxa` |
| `playfair-2` | `rssrdersbrny` | `rssrdersbrny` | `rssrdersbrny` |
| `playfair-3` | `ibsupmna` | `ibsupmna` | `ibsupmna` |
| `affine-1` | `ihhwvcswfrcp` | `ihhwvcswfrcp` | `ihhwvcswfrcp` |
| `affine-2` | `vshegxtsdmh` | `vshegxtsdmh` | `vshegxtsdmh` |
| `affine-3` | `ohggnxnugw` | `ohggnxnugw` | `ohggnxnugw` |
| `hill-1` | `poh` | `poh` | `poh` |
| `hill-2` | `hakgccrwevox` | `hakgccrwevox` | `hakgccrwevox` |
| `hill-3` | `hiat` | `hiat` | `hiat` |
| `columnar-1` | `RVZMTgBBQ0RUAEVTRUEAUk9GTwBERUVDAFdJUkVF` | `RVZMTgBBQ0RUAEVTRUEAUk9GTwBERUVDAFdJUkVF` | `RVZMTgBBQ0RUAEVTRUEAUk9GTwBERUVDAFdJUkVF` |
| `columnar-2` | `REkAQVAARlVIUkNSSVNF` | `REkAQVAARlVIUkNSSVNF` | `REkAQVAARlVIUkNSSVNF` |
| `columnar-3` | `Xcz3zgEAoyrN/Od+HpHQCzIA0hVk76Y5WbiT2j0ANP/2yeiDoBuChZTf` | `Xcz3zgEAoyrN/Od+HpHQCzIA0hVk76Y5WbiT2j0ANP/2yeiDoBuChZTf` | `Xcz3zgEAoyrN/Od+HpHQCzIA0hVk76Y5WbiT2j0ANP/2yeiDoBuChZTf` |
| `super-1` | `ytHZ1ADg1+HT4d64lZXlx9PY0cymlpajALHe3d3U` | `ytHZ1ADg1+HT4d64lZXlx9PY0cymlpajALHe3d3U` | `ytHZ1ADg1+HT4d64lZXlx9PY0cymlpajALHe3d3U` |
| `super-2` | `NjxCSE5UWmBmbHJ4foSKkJacoqiutLrAxszS2N7k6vD2/AIIDhQaICYsADQ6QEZMUlheZGpwdnyCiI6UmqCmrLK4vsTK0Nbc4uju9PoABgwSGB4kKjBPVVthZ21zeX+Fi5GXnaOpr7W7wcfN09nf5evx9/0DCQ8VGyEnLTM5P0UAS1FXXWNpb3V7gYeNk5mfpauxt73Dyc/V2+Hn7fP5/wULERcdIykvNTtBR01TWV9la3F3fYOJj5Wboaets7m/xcvR193j6e/1+wEHDRMZHyUrMTc9Q0kyOD5ESlBWXGJobnR6gIaMkpiepKqwtrzCyM7U2uDm7PL4/gQKEBYcIigu` | `NjxCSE5UWmBmbHJ4foSKkJacoqiutLrAxszS2N7k6vD2/AIIDhQaICYsADQ6QEZMUlheZGpwdnyCiI6UmqCmrLK4vsTK0Nbc4uju9PoABgwSGB4kKjBPVVthZ21zeX+Fi5GXnaOpr7W7wcfN09nf5evx9/0DCQ8VGyEnLTM5P0UAS1FXXWNpb3V7gYeNk5mfpauxt73Dyc/V2+Hn7fP5/wULERcdIykvNTtBR01TWV9la3F3fYOJj5Wboaets7m/xcvR193j6e/1+wEHDRMZHyUrMTc9Q0kyOD5ESlBWXGJobnR6gIaMkpiepKqwtrzCyM7U2uDm7PL4/gQKEBYcIigu` | `NjxCSE5UWmBmbHJ4foSKkJacoqiutLrAxszS2N7k6vD2/AIIDhQaICYsADQ6QEZMUlheZGpwdnyCiI6UmqCmrLK4vsTK0Nbc4uju9PoABgwSGB4kKjBPVVthZ21zeX+Fi5GXnaOpr7W7wcfN09nf5evx9/0DCQ8VGyEnLTM5P0UAS1FXXWNpb3V7gYeNk5mfpauxt73Dyc/V2+Hn7fP5/wULERcdIykvNTtBR01TWV9la3F3fYOJj5Wboaets7m/xcvR193j6e/1+wEHDRMZHyUrMTc9Q0kyOD5ESlBWXGJobnR6gIaMkpiepKqwtrzCyM7U2uDm7PL4/gQKEBYcIigu` |
| `super-3` | `J0sjtBAzF68AHP+j+wzoi+8H2HTX+9NkwMHt4JT8HQm8MFg55ViMdBWBtKhQsd3QhOyFNrL1+bEiXmElnc7KjRFJOvZ5vbVm4iUpTlYXo/YK0lOfsoYOT1suwgoL12q+xocTZg==` | `J0sjtBAzF68AHP+j+wzoi+8H2HTX+9NkwMHt4JT8HQm8MFg55ViMdBWBtKhQsd3QhOyFNrL1+bEiXmElnc7KjRFJOvZ5vbVm4iUpTlYXo/YK0lOfsoYOT1suwgoL12q+xocTZg==` | `J0sjtBAzF68AHP+j+wzoi+8H2HTX+9NkwMHt4JT8HQm8MFg55ViMdBWBtKhQsd3QhOyFNrL1+bEiXmElnc7KjRFJOvZ5vbVm4iUpTlYXo/YK0lOfsoYOT1suwgoL12q+xocTZg==` |
| `enigma-1` | `bdzgo` | `bdzgo` | `bdzgo` |
| `enigma-2` | `wcgxxkztlqb` | `wcgxxkztlqb` | `wcgxxkztlqb` |
| `enigma-3` | `zoshbhrbfzq` | `zoshbhrbfzq` | `zoshbhrbfzq` |

## Cara menjalankan ulang

```bash
pnpm --filter firdauscipher-web cross-verify
```
