#!/usr/bin/env python3
"""Generator file uji round-trip 5 kategori (S15).

Menghasilkan SATU file nyata per kategori yang diminta dosen (§4.3 R2):
  teks, gambar, database, audio, video.

File dibuat dari nol (bukan diunduh) supaya reproducible & tidak melanggar
aturan plagiarisme. Jalankan:  python3 packages/testfiles/generate.py
"""
import os
import sqlite3
import struct
import subprocess
import wave
import zlib

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))


def log(name: str, size: int) -> None:
    print(f"  {name:26s} {size:>10,} byte")


# ---------------------------------------------------------------- 1. teks
def make_text() -> None:
    path = os.path.join(OUT, "contoh.txt")
    lines = [
        "FirdausCipher — Uji Round-Trip File (S15)",
        "=========================================",
        "",
        "File ini dipakai sebagai bukti round-trip kategori TEKS (R2).",
        "Isinya sengaja memuat karakter non-alfabet supaya terlihat bahwa",
        "cipher 26 huruf membuang non-alfabet (Sp2), sedangkan Extended",
        "Vigenere / Super Enkripsi mempertahankan SEMUA byte (Sp8).",
        "",
        "Kalimat uji: SERANGSUBUHSEKALI pukul 05:00 WIB!",
        "Simbol: !@#$%^&*()_+-=[]{}|;':\",./<>?`~",
        "Angka : 0123456789",
        "Unicode: äöü ñ 日本語 emoji 🎓",
        "",
        "SHA-256 file ini harus IDENTIK sebelum dan sesudah enkripsi-dekripsi",
        "dengan Extended Vigenere maupun Super Enkripsi.",
        "",
    ]
    data = ("\n".join(lines)).encode("utf-8")
    with open(path, "wb") as f:
        f.write(data)
    log("contoh.txt", len(data))


# ---------------------------------------------------------------- 2. gambar
def make_image() -> None:
    """PNG asli (RGBA, gradient + bentuk) dibuat manual tanpa library."""
    path = os.path.join(OUT, "contoh.png")
    w, h = 240, 160
    rows = bytearray()
    for y in range(h):
        rows.append(0)  # filter type 0 untuk tiap baris
        for x in range(w):
            r = (x * 255) // (w - 1)
            g = (y * 255) // (h - 1)
            b = ((x + y) * 255) // (w + h - 2)
            # lingkaran putih di tengah sebagai penanda visual
            dx, dy = x - w // 2, y - h // 2
            a = 255
            if dx * dx + dy * dy < 40 * 40:
                r, g, b = 255, 255, 255
            rows += bytes((r, g, b, a))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(rows), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)
    log("contoh.png", len(png))


# ---------------------------------------------------------------- 3. database
def make_database() -> None:
    """SQLite asli berisi tabel + data."""
    path = os.path.join(OUT, "contoh.sqlite")
    if os.path.exists(path):
        os.remove(path)
    con = sqlite3.connect(path)
    cur = con.cursor()
    cur.execute(
        "CREATE TABLE mahasiswa (id INTEGER PRIMARY KEY, nim TEXT UNIQUE, nama TEXT, nilai REAL)"
    )
    cur.execute("CREATE TABLE uji (id INTEGER PRIMARY KEY, keterangan TEXT, blob_uji BLOB)")
    rows = [
        (1, "2024001", "Farid Firdaus", 88.5),
        (2, "2024002", "Siti Rahayu", 92.0),
        (3, "2024003", "Budi Santoso", 75.25),
        (4, "2024004", "Dewi Lestari", 81.75),
    ]
    cur.executemany("INSERT INTO mahasiswa VALUES (?,?,?,?)", rows)
    cur.executemany(
        "INSERT INTO uji VALUES (?,?,?)",
        [
            (1, "byte nol dan 0xFF", bytes([0x00, 0xFF, 0x00, 0xFF])),
            (2, "teks biasa", b"FirdausCipher"),
            (3, "semua byte 0-255", bytes(range(256))),
        ],
    )
    con.commit()
    con.close()
    log("contoh.sqlite", os.path.getsize(path))


# ---------------------------------------------------------------- 4. audio
def make_audio() -> None:
    """WAV asli (nada 440 Hz + 660 Hz, 1 detik, 16-bit mono)."""
    path = os.path.join(OUT, "contoh.wav")
    rate = 22050
    dur = 1.0
    n = int(rate * dur)
    frames = bytearray()
    for i in range(n):
        t = i / rate
        # nada bergantian supaya ada variasi byte
        freq = 440.0 if i < n // 2 else 660.0
        val = int(12000 * (1 if (i // 200) % 2 == 0 else 0.5) * __import__("math").sin(2 * 3.141592653589793 * freq * t))
        frames += struct.pack("<h", val)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(bytes(frames))
    log("contoh.wav", os.path.getsize(path))


# ---------------------------------------------------------------- 5. video
def make_video() -> None:
    """MP4 asli lewat ffmpeg (kalau ada). Fallback: MP4 minimal."""
    path = os.path.join(OUT, "contoh.mp4")
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", "testsrc=size=160x120:rate=10:duration=1",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
                "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-shortest", path,
            ],
            check=True,
            capture_output=True,
        )
        log("contoh.mp4", os.path.getsize(path))
        return
    except Exception as exc:  # noqa: BLE001
        print(f"  (ffmpeg gagal: {exc} — pakai MP4 minimal)")

    # Fallback: MP4 sangat minimal (ftyp + mdat) — cukup untuk uji byte.
    ftyp = struct.pack(">I", 20) + b"ftyp" + b"isom" + struct.pack(">I", 512) + b"isomiso2"
    payload = bytes((i * 37 + 11) % 256 for i in range(4096))
    mdat = struct.pack(">I", len(payload) + 8) + b"mdat" + payload
    with open(path, "wb") as f:
        f.write(ftyp + mdat)
    log("contoh.mp4", os.path.getsize(path))


def main() -> None:
    print("Membuat file uji 5 kategori di packages/testfiles/:")
    make_text()
    make_image()
    make_database()
    make_audio()
    make_video()
    print("\nSelesai. File-file ini dipakai oleh S15 (round-trip + SHA-256).")


if __name__ == "__main__":
    main()
