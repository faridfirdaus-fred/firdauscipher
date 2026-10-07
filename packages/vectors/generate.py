#!/usr/bin/env python3
"""Generator test vectors FirdausCipher (S04).

PENTING: file ini adalah implementasi REFERENSI INDEPENDEN (Python), ditulis
terpisah dari kode TypeScript/Ruby. Vektor yang dihasilkan di sini menjadi
"known answer" yang HARUS dipenuhi oleh implementasi TS (S22) dan Ruby (S22).

Kalau TS/Ruby berbeda dengan file ini -> salah satu implementasi bug.
"""
import base64
import json
import datetime

# ---------------------------------------------------------------- alfabet
def sanitize26(text: str) -> str:
    return "".join(c.upper() for c in text if c.isascii() and c.isalpha())


def mod(n, m):
    return n % m


# ---------------------------------------------------------------- a) Vigenere
def vigenere_enc(pt, key):
    p, k = sanitize26(pt), sanitize26(key)
    assert k, "kunci kosong"
    return "".join(chr((ord(p[i]) - 65 + ord(k[i % len(k)]) - 65) % 26 + 97)
                   for i in range(len(p)))


def vigenere_dec(ct, key):
    c, k = sanitize26(ct), sanitize26(key)
    return "".join(chr((ord(c[i]) - 65 - (ord(k[i % len(k)]) - 65)) % 26 + 97)
                   for i in range(len(c)))


# ---------------------------------------------------------------- b) Auto-Key
def autokey_enc(pt, key):
    p, k = sanitize26(pt), sanitize26(key)
    stream = k + p
    return "".join(chr((ord(p[i]) - 65 + ord(stream[i]) - 65) % 26 + 97)
                   for i in range(len(p)))


def autokey_dec(ct, key):
    c, k = sanitize26(ct), sanitize26(key)
    plain = []
    for i in range(len(c)):
        kc = k[i] if i < len(k) else plain[i - len(k)]
        plain.append(chr((ord(c[i]) - 65 - (ord(kc) - 65)) % 26 + 65))
    return "".join(plain).lower()


# ---------------------------------------------------------------- c) Ext Vigenere
def extv_enc(data: bytes, key: bytes) -> bytes:
    return bytes((data[i] + key[i % len(key)]) % 256 for i in range(len(data)))


def extv_dec(data: bytes, key: bytes) -> bytes:
    return bytes((data[i] - key[i % len(key)] + 256) % 256 for i in range(len(data)))


# ---------------------------------------------------------------- d) Playfair
def playfair_square(key):
    seen, seq = set(), []
    for ch in sanitize26(key) + "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        c = "I" if ch == "J" else ch
        if c not in seen:
            seen.add(c)
            seq.append(c)
    return [seq[i * 5:i * 5 + 5] for i in range(5)]


def playfair_pos(sq, ch):
    c = "I" if ch == "J" else ch
    for r in range(5):
        for k in range(5):
            if sq[r][k] == c:
                return r, k
    raise ValueError(ch)


def playfair_digraphs(pt):
    clean = sanitize26(pt).replace("J", "I")
    chars, i = [], 0
    while i < len(clean):
        a = clean[i]
        b = clean[i + 1] if i + 1 < len(clean) else None
        if b is None:
            chars += [a, "X"]; i += 1
        elif a == b:
            chars += [a, "X"]; i += 1
        else:
            chars += [a, b]; i += 2
    return [chars[k] + chars[k + 1] for k in range(0, len(chars), 2)]


def playfair_enc(pt, key):
    sq = playfair_square(key)
    out = ""
    for pair in playfair_digraphs(pt):
        r1, c1 = playfair_pos(sq, pair[0])
        r2, c2 = playfair_pos(sq, pair[1])
        if r1 == r2:
            out += sq[r1][(c1 + 1) % 5] + sq[r2][(c2 + 1) % 5]
        elif c1 == c2:
            out += sq[(r1 + 1) % 5][c1] + sq[(r2 + 1) % 5][c2]
        else:
            out += sq[r1][c2] + sq[r2][c1]
    return out.lower()


def playfair_dec(ct, key):
    sq = playfair_square(key)
    clean = sanitize26(ct).replace("J", "I")
    out = ""
    for i in range(0, len(clean), 2):
        r1, c1 = playfair_pos(sq, clean[i])
        r2, c2 = playfair_pos(sq, clean[i + 1])
        if r1 == r2:
            out += sq[r1][(c1 + 4) % 5] + sq[r2][(c2 + 4) % 5]
        elif c1 == c2:
            out += sq[(r1 + 4) % 5][c1] + sq[(r2 + 4) % 5][c2]
        else:
            out += sq[r1][c2] + sq[r2][c1]
    return out.lower()


# ---------------------------------------------------------------- e) Affine
def affine_enc(pt, a, b):
    p = sanitize26(pt)
    return "".join(chr((a * (ord(c) - 65) + b) % 26 + 97) for c in p)


def affine_dec(ct, a, b):
    c = sanitize26(ct)
    a_inv = pow(a, -1, 26)
    return "".join(chr((a_inv * (ord(x) - 65 - b)) % 26 + 97) for x in c)


# ---------------------------------------------------------------- f) Hill
def hill_enc(pt, matrix):
    n = len(matrix)
    p = sanitize26(pt)
    while len(p) % n:
        p += "X"
    out = ""
    for i in range(0, len(p), n):
        blk = [ord(p[i + j]) - 65 for j in range(n)]
        for r in range(n):
            out += chr(sum(matrix[r][k] * blk[k] for k in range(n)) % 26 + 97)
    return out


def hill_dec(ct, matrix):
    n = len(matrix)
    det = round(det_raw(matrix)) % 26
    det_inv = pow(det, -1, 26)
    # adjoin = transpose(cofactor)
    cof = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            minor = [[matrix[r][c] for c in range(n) if c != j] for r in range(n) if r != i]
            sign = 1 if (i + j) % 2 == 0 else -1
            cof[i][j] = sign * round(det_raw(minor))
    adj = [[cof[j][i] for j in range(n)] for i in range(n)]
    inv = [[(adj[i][j] * det_inv) % 26 for j in range(n)] for i in range(n)]
    c = sanitize26(ct)
    out = ""
    for i in range(0, len(c), n):
        blk = [ord(c[i + j]) - 65 for j in range(n)]
        for r in range(n):
            out += chr(sum(inv[r][k] * blk[k] for k in range(n)) % 26 + 97)
    return out


def det_raw(m):
    n = len(m)
    if n == 1:
        return m[0][0]
    if n == 2:
        return m[0][0] * m[1][1] - m[0][1] * m[1][0]
    s = 0
    for c in range(n):
        minor = [[m[r][j] for j in range(n) if j != c] for r in range(1, n)]
        s += (1 if c % 2 == 0 else -1) * m[0][c] * det_raw(minor)
    return s


# ---------------------------------------------------------------- columnar
def column_order(key):
    chars = [(ch.upper(), i) for i, ch in enumerate(key)]
    chars.sort(key=lambda t: (t[0], t[1]))
    return [i for _, i in chars]


def columnar_enc(data: bytes, key: str) -> bytes:
    n = len(key)
    nrows = -(-len(data) // n)
    padded = data + b"\x00" * (nrows * n - len(data))
    out = bytearray()
    for col in column_order(key):
        for r in range(nrows):
            out.append(padded[r * n + col])
    return bytes(out)


def columnar_dec(data: bytes, key: str) -> bytes:
    n = len(key)
    nrows = len(data) // n
    grid = bytearray(len(data))
    o = 0
    for col in column_order(key):
        for r in range(nrows):
            grid[r * n + col] = data[o]
            o += 1
    return bytes(grid)


# ---------------------------------------------------------------- g) Super
def super_enc(data, k1, k2):
    return columnar_enc(extv_enc(data, k1.encode()), k2)


def super_dec(data, k1, k2, orig_len):
    return extv_dec(columnar_dec(data, k2), k1.encode())[:orig_len]


# ---------------------------------------------------------------- h) Enigma
ROTOR_WIRING = {
    "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
    "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
    "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
    "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
    "V": "VZBRGITYUPSDNHLXAWMJQOFECK",
}
ROTOR_NOTCH = {"I": "Q", "II": "E", "III": "V", "IV": "J", "V": "Z"}
REFLECTOR = {
    "A": "EJMZALYXVBWFCRQUONTSPIKHGD",
    "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL",
}


class Enigma:
    def __init__(self, rotors, reflector, ring, position, plugboard=""):
        self.w = [ROTOR_WIRING[r] for r in rotors]
        self.n = [ord(ROTOR_NOTCH[r]) - 65 for r in rotors]
        self.ref = REFLECTOR[reflector]
        self.pb = list(range(26))
        for pair in plugboard.replace(",", " ").split():
            pair = "".join(ch for ch in pair.upper() if ch.isalpha())
            if len(pair) == 2:
                a, b = ord(pair[0]) - 65, ord(pair[1]) - 65
                self.pb[a], self.pb[b] = b, a
        self.ri = [ord(c) - 65 for c in sanitize26(ring)]
        self.pi = [ord(c) - 65 for c in sanitize26(position)]

    def step(self):
        if self.pi[1] == self.n[1]:
            self.pi[1] = (self.pi[1] + 1) % 26
            self.pi[0] = (self.pi[0] + 1) % 26
        elif self.pi[2] == self.n[2]:
            self.pi[1] = (self.pi[1] + 1) % 26
        self.pi[2] = (self.pi[2] + 1) % 26

    def fw(self, i, c):
        off = self.pi[i] - self.ri[i]
        return ((ord(self.w[i][(c + off) % 26]) - 65) - off) % 26

    def bw(self, i, c):
        off = self.pi[i] - self.ri[i]
        return ((self.w[i].index(chr((c + off) % 26 + 65))) - off) % 26

    def enc_char(self, ch):
        self.step()
        c = self.pb[ord(ch) - 65]
        for i in (2, 1, 0):
            c = self.fw(i, c)
        c = ord(self.ref[c]) - 65
        for i in (0, 1, 2):
            c = self.bw(i, c)
        return chr(self.pb[c] + 65)

    def run(self, text):
        return "".join(self.enc_char(c) for c in sanitize26(text)).lower()


def enigma_enc(pt, cfg):
    return Enigma(cfg["rotors"], cfg["reflector"], cfg["ring"],
                  cfg["position"], cfg.get("plugboard", "")).run(pt)


# ================================================================ vektor
def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def deterministic_bytes(n, seed=12345):
    out = bytearray()
    s = seed
    for _ in range(n):
        s = (s * 1103515245 + 12345) & 0x7FFFFFFF
        out.append(s % 256)
    return bytes(out)


CASES = []


def add(cid, cipher, mode, params, plaintext, ciphertext, note, source, verify=None):
    case = {
        "id": cid,
        "cipher": cipher,
        "mode": mode,
        "params": params,
        "plaintext": plaintext,
        "ciphertext": ciphertext,
        "note": note,
        "source": source,
    }
    if verify:
        case["verify"] = verify
    CASES.append(case)


# --- a) Vigenere standard -------------------------------------------------
for i, (pt, key, expect, src) in enumerate([
    ("ATTACKATDAWN", "LEMON", "lxfopvefrnhr", "Buku klasik (Vigenere LEMON)"),
    ("ATTACKATDAWN", "QUEENLY", None, "self-generated (kunci lebih panjang)"),
    ("KRIPTOGRAFIADALAHILMUTENTANGMENYEMBUNYIKANPESAN", "RAHASIA", None, "self-generated"),
], 1):
    ct = vigenere_enc(pt, key)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"vigenere-{i}", "vigenere", "text", {"key": key}, pt, ct,
        f"Vigenere standard, kunci '{key}'", src)
    # bukti bolak-balik
    assert vigenere_dec(ct, key).upper() == sanitize26(pt)

# --- b) Auto-Key ----------------------------------------------------------
for i, (pt, key, expect, src) in enumerate([
    ("ATTACKATDAWN", "QUEENLY", "qnxepvytwtwp", "Buku klasik (autokey QUEENLY)"),
    ("ATTACKATDAWN", "LEMON", None, "self-generated"),
    ("SERANGSUBUHSEKALI", "KUNCI", None, "self-generated"),
], 1):
    ct = autokey_enc(pt, key)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"autokey-{i}", "autokey", "text", {"key": key}, pt, ct,
        f"Auto-Key Vigenere, kunci '{key}'", src)
    assert autokey_dec(ct, key).upper() == sanitize26(pt)

# --- c) Extended Vigenere -------------------------------------------------
for i, (data, key, note) in enumerate([
    (b"FirdausCipher Extended Vigenere 256 ASCII", "kunci", "teks ASCII"),
    (bytes(range(256)), "K", "semua byte 0-255 (termasuk 0x00 & 0xFF)"),
    (deterministic_bytes(64), "rahasia", "byte acak deterministik 64 byte"),
], 1):
    ct = extv_enc(data, key.encode())
    add(f"ext-vigenere-{i}", "ext-vigenere", "binary", {"key": key},
        b64(data), b64(ct), f"Extended Vigenere 256 ASCII — {note}", "self-generated")
    assert extv_dec(ct, key.encode()) == data

# --- d) Playfair ----------------------------------------------------------
for i, (pt, key, expect, src) in enumerate([
    ("INSTRUMENTS", "MONARCHY", "gatlmzclrqxa", "Buku klasik (MONARCHY/INSTRUMENTS)"),
    ("ATTACKATDAWN", "MONARCHY", None, "self-generated"),
    ("BALLOON", "MONARCHY", None, "self-generated (pasangan kembar -> filler X)"),
], 1):
    ct = playfair_enc(pt, key)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"playfair-{i}", "playfair", "text", {"key": key}, pt, ct,
        f"Playfair 5x5 (I/J gabung, filler X), kunci '{key}'", src)
    # Dekripsi mengembalikan bentuk digraph (filler X ikut muncul kembali).
    assert playfair_dec(ct, key).upper() == "".join(playfair_digraphs(pt))

# --- e) Affine ------------------------------------------------------------
for i, (pt, a, b, expect, src) in enumerate([
    ("AFFINECIPHER", 5, 8, "ihhwvcswfrcp", "Buku klasik (a=5, b=8)"),
    ("KRIPTOGRAFI", 7, 3, None, "self-generated"),
    ("HELLO WORLD", 11, 15, None, "self-generated (spasi dibuang)"),
], 1):
    ct = affine_enc(pt, a, b)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"affine-{i}", "affine", "text", {"a": a, "b": b}, pt, ct,
        f"Affine a={a} b={b}", src)
    assert affine_dec(ct, a, b).upper() == sanitize26(pt)

# --- f) Hill --------------------------------------------------------------
KEY3 = [[6, 24, 1], [13, 16, 10], [20, 17, 15]]
KEY2 = [[3, 3], [2, 5]]
for i, (pt, matrix, expect, src) in enumerate([
    ("ACT", KEY3, "poh", "Buku klasik (Hill 3x3 standar)"),
    ("ATTACKATDAWN", KEY3, None, "self-generated"),
    ("HELP", KEY2, None, "self-generated (Hill 2x2)"),
], 1):
    ct = hill_enc(pt, matrix)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"hill-{i}", "hill", "text", {"matrix": matrix}, pt, ct,
        f"Hill {len(matrix)}x{len(matrix)}, padding filler X", src)
    assert hill_dec(ct, matrix).upper().startswith(sanitize26(pt))

# --- columnar (bagian dari g) --------------------------------------------
for i, (data, key, note) in enumerate([
    (b"WEAREDISCOVEREDFLEEATONCE", "ZEBRAS", "contoh klasik (25 byte -> 30 byte berpadding)"),
    (b"FIRDAUSCIPHER", "KUNCI", "self-generated"),
    (deterministic_bytes(40, seed=7), "RAHASIA", "byte acak deterministik"),
], 1):
    ct = columnar_enc(data, key)
    add(f"columnar-{i}", "columnar", "binary", {"key": key},
        b64(data), b64(ct), f"Transposisi kolom (byte), kunci '{key}' — {note}",
        "self-generated")
    assert columnar_dec(ct, key)[:len(data)] == data

# --- g) Super enkripsi ----------------------------------------------------
for i, (data, k1, k2, note) in enumerate([
    (b"FirdausCipher super enkripsi", "kunci1", "ZEBRAS", "teks ASCII"),
    (bytes(range(256)), "K1", "KUNCI2", "semua byte 0-255"),
    (deterministic_bytes(100, seed=99), "alpha", "BETA", "byte acak deterministik"),
], 1):
    ct = super_enc(data, k1, k2)
    add(f"super-{i}", "super", "binary", {"key1": k1, "key2": k2},
        b64(data), b64(ct),
        f"Super enkripsi = Extended Vigenere('{k1}') lalu Transposisi Kolom('{k2}') — {note}",
        "self-generated")
    assert super_dec(ct, k1, k2, len(data)) == data

# --- h) Enigma ------------------------------------------------------------
ENIGMA_CASES = [
    ("AAAAA", dict(rotors=["I", "II", "III"], reflector="B", ring="AAA", position="AAA"),
     "bdzgo", "Vektor Enigma terkenal (rotor I-II-III, reflector B, AAA/AAA)"),
    ("KRIPTOGRAFI", dict(rotors=["I", "II", "III"], reflector="B", ring="AAA", position="AAA"),
     None, "self-generated"),
    ("HELLOENIGMA", dict(rotors=["IV", "V", "I"], reflector="C", ring="XYZ", position="QWE",
                         plugboard="AB CD"),
     None, "self-generated (rotor IV-V-I, reflector C, ring XYZ, plugboard AB CD)"),
]
for i, (pt, cfg, expect, src) in enumerate(ENIGMA_CASES, 1):
    ct = enigma_enc(pt, cfg)
    if expect:
        assert ct == expect, (ct, expect)
    add(f"enigma-{i}", "enigma", "text", cfg, pt, ct,
        "Enigma I, 3 rotor, double-stepping benar", src)
    assert enigma_enc(ct, cfg).upper() == sanitize26(pt)

# ================================================================ tulis
out = {
    "version": 2,
    "generated": datetime.date.today().isoformat(),
    "generator": "packages/vectors/generate.py (implementasi referensi Python, independen dari TS/Ruby)",
    "schema": {
        "id": "string unik",
        "cipher": "vigenere|autokey|ext-vigenere|playfair|affine|hill|columnar|super|enigma",
        "mode": "text (cipher 26 huruf) | binary (byte)",
        "params": "objek parameter kunci (lihat cipher)",
        "plaintext": "string (mode text) atau base64 (mode binary)",
        "ciphertext": "string huruf kecil (mode text) atau base64 (mode binary)",
        "note": "penjelasan kasus",
        "source": "rujukan buku / self-generated",
    },
    "cases": CASES,
}

with open("/home/fred-demarco/Development/firdauscipher/packages/vectors/vectors.json", "w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"OK: {len(CASES)} kasus ditulis")
from collections import Counter
for k, v in sorted(Counter(c["cipher"] for c in CASES).items()):
    print(f"  {k:14s} {v} kasus")
