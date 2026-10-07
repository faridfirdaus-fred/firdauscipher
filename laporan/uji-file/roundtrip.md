# Hasil Uji Round-Trip File (S15)

Dibuat: 2026-10-07T17:57:21.249Z

Uji ini memenuhi **R2**: SHA-256 file sebelum vs sesudah enkripsi–dekripsi harus identik
untuk minimal 1 file di setiap kategori: teks, gambar, database, audio, video.

## 1. Ringkasan

- Cipher biner byte-identik: **15/15**
- Cipher 26 huruf byte-identik: 0/5 (memang 0 — Sp2 membuang non-alfabet)
- Kategori wajib R2: **5/5 TERPENUHI**

## 2. Tabel hasil

| Kategori | File | Ukuran | Cipher | SHA-256 sebelum | SHA-256 sesudah | Identik | Ukuran .dat |
|---|---|---|---|---|---|---|---|
| Teks | `contoh.txt` | 602 B | Extended Vigenere (c) | `345fe5be1f80b5bc…` | `345fe5be1f80b5bc…` | ✅ Ya | 731 B |
| Teks | `contoh.txt` | 602 B | Transposisi Kolom | `345fe5be1f80b5bc…` | `345fe5be1f80b5bc…` | ✅ Ya | 722 B |
| Teks | `contoh.txt` | 602 B | Super Enkripsi (g) | `345fe5be1f80b5bc…` | `345fe5be1f80b5bc…` | ✅ Ya | 747 B |
| Teks | `contoh.txt` | 602 B | Vigenere (a) | `345fe5be1f80b5bc…` | `c63628950a445094…` | ❌ Tidak | 497 B |
| Gambar | `contoh.png` | 90.687 B | Extended Vigenere (c) | `bf3beb90f999476e…` | `bf3beb90f999476e…` | ✅ Ya | 90.817 B |
| Gambar | `contoh.png` | 90.687 B | Transposisi Kolom | `bf3beb90f999476e…` | `bf3beb90f999476e…` | ✅ Ya | 90.807 B |
| Gambar | `contoh.png` | 90.687 B | Super Enkripsi (g) | `bf3beb90f999476e…` | `bf3beb90f999476e…` | ✅ Ya | 90.832 B |
| Gambar | `contoh.png` | 90.687 B | Vigenere (a) | `bf3beb90f999476e…` | `06112d9bab320c46…` | ❌ Tidak | 19.156 B |
| Database | `contoh.sqlite` | 16.384 B | Extended Vigenere (c) | `613fa7254af5936f…` | `613fa7254af5936f…` | ✅ Ya | 16.534 B |
| Database | `contoh.sqlite` | 16.384 B | Transposisi Kolom | `613fa7254af5936f…` | `613fa7254af5936f…` | ✅ Ya | 16.523 B |
| Database | `contoh.sqlite` | 16.384 B | Super Enkripsi (g) | `613fa7254af5936f…` | `613fa7254af5936f…` | ✅ Ya | 16.548 B |
| Database | `contoh.sqlite` | 16.384 B | Vigenere (a) | `613fa7254af5936f…` | `e0fe6a24f4816938…` | ❌ Tidak | 496 B |
| Audio | `contoh.wav` | 44.144 B | Extended Vigenere (c) | `ee8b5a438242d2c0…` | `ee8b5a438242d2c0…` | ✅ Ya | 44.274 B |
| Audio | `contoh.wav` | 44.144 B | Transposisi Kolom | `ee8b5a438242d2c0…` | `ee8b5a438242d2c0…` | ✅ Ya | 44.265 B |
| Audio | `contoh.wav` | 44.144 B | Super Enkripsi (g) | `ee8b5a438242d2c0…` | `ee8b5a438242d2c0…` | ✅ Ya | 44.290 B |
| Audio | `contoh.wav` | 44.144 B | Vigenere (a) | `ee8b5a438242d2c0…` | `d3a522ad1c246b05…` | ❌ Tidak | 4.845 B |
| Video | `contoh.mp4` | 20.993 B | Extended Vigenere (c) | `0c5332d58f791b04…` | `0c5332d58f791b04…` | ✅ Ya | 21.123 B |
| Video | `contoh.mp4` | 20.993 B | Transposisi Kolom | `0c5332d58f791b04…` | `0c5332d58f791b04…` | ✅ Ya | 21.111 B |
| Video | `contoh.mp4` | 20.993 B | Super Enkripsi (g) | `0c5332d58f791b04…` | `0c5332d58f791b04…` | ✅ Ya | 21.136 B |
| Video | `contoh.mp4` | 20.993 B | Vigenere (a) | `0c5332d58f791b04…` | `983e435b1bc5c619…` | ❌ Tidak | 4.255 B |

## 3. Bukti SHA-256 lengkap

### Teks — contoh.txt — Extended Vigenere (c)

- SHA-256 sebelum : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- SHA-256 sesudah : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- Identik         : **YA**

### Teks — contoh.txt — Transposisi Kolom

- SHA-256 sebelum : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- SHA-256 sesudah : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- Identik         : **YA**

### Teks — contoh.txt — Super Enkripsi (g)

- SHA-256 sebelum : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- SHA-256 sesudah : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- Identik         : **YA**

### Teks — contoh.txt — Vigenere (a)

- SHA-256 sebelum : `345fe5be1f80b5bc96eee5d32cd395cb67534162b30d77f177c43124f11f6db9`
- SHA-256 sesudah : `c63628950a4450944e07c65a7a3a9db88c0500fb9fea130b09a8857efb97a9ac`
- Identik         : TIDAK

### Gambar — contoh.png — Extended Vigenere (c)

- SHA-256 sebelum : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- SHA-256 sesudah : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- Identik         : **YA**

### Gambar — contoh.png — Transposisi Kolom

- SHA-256 sebelum : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- SHA-256 sesudah : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- Identik         : **YA**

### Gambar — contoh.png — Super Enkripsi (g)

- SHA-256 sebelum : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- SHA-256 sesudah : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- Identik         : **YA**

### Gambar — contoh.png — Vigenere (a)

- SHA-256 sebelum : `bf3beb90f999476e031d029dbc068169e6db20ba4147b7817333d7accca27608`
- SHA-256 sesudah : `06112d9bab320c467b5d6102b85a03a3b4c060197d8652dd547832ac4f17737e`
- Identik         : TIDAK

### Database — contoh.sqlite — Extended Vigenere (c)

- SHA-256 sebelum : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- SHA-256 sesudah : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- Identik         : **YA**

### Database — contoh.sqlite — Transposisi Kolom

- SHA-256 sebelum : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- SHA-256 sesudah : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- Identik         : **YA**

### Database — contoh.sqlite — Super Enkripsi (g)

- SHA-256 sebelum : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- SHA-256 sesudah : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- Identik         : **YA**

### Database — contoh.sqlite — Vigenere (a)

- SHA-256 sebelum : `613fa7254af5936fafc2de3928a753f01d2aa16fe624e1a6f807a3dcd63227e1`
- SHA-256 sesudah : `e0fe6a24f4816938c1b71306b39379bcb1829b6dc0a90a57b9e1a0228b827c9d`
- Identik         : TIDAK

### Audio — contoh.wav — Extended Vigenere (c)

- SHA-256 sebelum : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- SHA-256 sesudah : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- Identik         : **YA**

### Audio — contoh.wav — Transposisi Kolom

- SHA-256 sebelum : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- SHA-256 sesudah : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- Identik         : **YA**

### Audio — contoh.wav — Super Enkripsi (g)

- SHA-256 sebelum : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- SHA-256 sesudah : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- Identik         : **YA**

### Audio — contoh.wav — Vigenere (a)

- SHA-256 sebelum : `ee8b5a438242d2c0eac4366b6be0c7d409c9c5705bf3f99e78ac8f4cb2ee27b9`
- SHA-256 sesudah : `d3a522ad1c246b0532611ba806c8b6e51a939f47dde047aba79141b2a0f01162`
- Identik         : TIDAK

### Video — contoh.mp4 — Extended Vigenere (c)

- SHA-256 sebelum : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- SHA-256 sesudah : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- Identik         : **YA**

### Video — contoh.mp4 — Transposisi Kolom

- SHA-256 sebelum : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- SHA-256 sesudah : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- Identik         : **YA**

### Video — contoh.mp4 — Super Enkripsi (g)

- SHA-256 sebelum : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- SHA-256 sesudah : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- Identik         : **YA**

### Video — contoh.mp4 — Vigenere (a)

- SHA-256 sebelum : `0c5332d58f791b0414360a734fbbf53d21f58e56acc023d5abaef095634f5d4d`
- SHA-256 sesudah : `983e435b1bc5c619e2d686952c9f6e3144e9e313988d98fce816e53e097d49b6`
- Identik         : TIDAK

