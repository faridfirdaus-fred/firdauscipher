# frozen_string_literal: true

# core.rb — utilitas bersama untuk seluruh cipher (port dari
# apps/web/src/lib/crypto/core.ts).
#
# ATURAN PARITAS (AGENTS.md §3.1 no.4): setiap fungsi di sini harus punya
# perilaku SEMANTIK yang sama dengan padanannya di TypeScript, supaya
# packages/vectors/vectors.json bisa dipakai menguji kedua implementasi (S22).
#
# Catatan implementasi:
#   - Semua cipher bekerja pada BYTE (Array<Integer> 0..255), bukan String,
#     supaya cipher biner (Sp8) dan cipher 26 huruf memakai jalur yang sama.
#   - Base64 ditulis manual (bukan [x].pack("m0")) supaya persis sama dengan
#     implementasi manual di TS — termasuk perilaku lenient saat decode.

module FirdausCipher
  module Core
    ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    MOD26 = 26

    B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

    module_function

    # -------------------------------------------------------------------------
    # Alfabet 26 huruf
    # -------------------------------------------------------------------------

    # Buang semua karakter non-alfabet dan ubah ke huruf besar (Sp2).
    # `up.length == 1` penting: "ß".upcase == "SS" (2 huruf) harus dibuang.
    def sanitize26(text)
      out = +""
      text.to_s.each_char do |ch|
        up = ch.upcase
        out << up if up.length == 1 && up >= "A" && up <= "Z"
      end
      out
    end

    # Huruf A-Z -> 0..25. Melempar error kalau bukan huruf tunggal.
    def char_to_num(ch)
      s = ch.to_s
      raise ArgumentError, "char_to_num: butuh 1 karakter, dapat #{s.inspect}" if s.length != 1

      n = s.ord - 65
      raise ArgumentError, "char_to_num: #{s.inspect} bukan huruf A-Z" if n.negative? || n > 25

      n
    end

    # Angka -> huruf A-Z (otomatis modulo 26).
    def num_to_char(n)
      (mod(n, MOD26) + 65).chr
    end

    # Modulo yang selalu non-negatif. Di Ruby `%` sudah non-negatif untuk
    # m > 0, tetapi fungsinya dipertahankan supaya nama & kontraknya sama
    # dengan TS (yang `%`-nya bisa negatif).
    def mod(n, m)
      raise ArgumentError, "mod: modulus harus > 0, dapat #{m}" if m <= 0

      n % m
    end

    # -------------------------------------------------------------------------
    # Base64 (manual, mirror TS)
    # -------------------------------------------------------------------------

    # Encode byte -> base64 standar (dengan padding "=").
    def to_base64(bytes)
      out = +""
      i = 0
      while i < bytes.length
        b0 = bytes[i]
        has_b1 = (i + 1) < bytes.length
        has_b2 = (i + 2) < bytes.length
        b1 = has_b1 ? bytes[i + 1] : 0
        b2 = has_b2 ? bytes[i + 2] : 0
        triple = (b0 << 16) | (b1 << 8) | b2
        out << B64[(triple >> 18) & 63]
        out << B64[(triple >> 12) & 63]
        out << (has_b1 ? B64[(triple >> 6) & 63] : "=")
        out << (has_b2 ? B64[triple & 63] : "=")
        i += 3
      end
      out
    end

    # Decode base64 -> byte. Karakter di luar alfabet base64 (termasuk "=")
    # diabaikan — sama seperti TS. Panjang keluaran = floor(len * 3 / 4).
    def from_base64(str)
      clean = str.to_s.gsub(%r{[^A-Za-z0-9+/]}, "")
      out_len = (clean.length * 3) / 4
      out = Array.new(out_len, 0)
      o = 0
      i = 0
      while i < clean.length
        c0 = B64.index(clean[i]) || 0
        c1 = (i + 1) < clean.length ? (B64.index(clean[i + 1]) || 0) : 0
        c2 = (i + 2) < clean.length ? (B64.index(clean[i + 2]) || 0) : 0
        c3 = (i + 3) < clean.length ? (B64.index(clean[i + 3]) || 0) : 0
        triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3
        if o < out_len
          out[o] = (triple >> 16) & 255
          o += 1
        end
        if o < out_len
          out[o] = (triple >> 8) & 255
          o += 1
        end
        if o < out_len
          out[o] = triple & 255
          o += 1
        end
        i += 4
      end
      out
    end

    # -------------------------------------------------------------------------
    # Konversi byte <-> string
    # -------------------------------------------------------------------------

    # byte -> string latin1 (1 char = 1 byte). Dipakai Extended Vigenere.
    def bytes_to_latin1(bytes)
      bytes.map(&:chr).join
    end

    # string latin1 -> byte (karakter > 0xFF dipotong ke byte rendah).
    def latin1_to_bytes(str)
      str.to_s.bytes.map { |b| b & 255 }
    end

    # string UTF-8 -> byte. Byte yang tidak valid diganti U+FFFD, sama
    # seperti TextEncoder di JS.
    def utf8_to_bytes(str)
      s = str.to_s
      s = s.dup.force_encoding(Encoding::UTF_8) unless s.encoding == Encoding::UTF_8
      s.scrub("\uFFFD").b.bytes
    end

    # byte UTF-8 -> string. Byte rusak diganti U+FFFD, sama seperti TextDecoder.
    def bytes_to_utf8(bytes)
      bytes.pack("C*").force_encoding(Encoding::UTF_8).scrub("\uFFFD")
    end

    # byte -> string hex.
    def bytes_to_hex(bytes)
      bytes.map { |b| format("%02x", b) }.join
    end

    # string hex -> byte.
    def hex_to_bytes(hex)
      clean = hex.to_s.gsub(/[^0-9a-fA-F]/, "")
      (0...((clean.length) / 2)).map { |i| clean[i * 2, 2].to_i(16) }
    end

    # -------------------------------------------------------------------------
    # Aljabar modular & matriks (Sp10: boleh pakai library; ini ditulis sendiri
    # supaya port-nya 1:1 dengan TS)
    # -------------------------------------------------------------------------

    # Faktor persekutuan terbesar.
    def gcd(a, b)
      a.abs.gcd(b.abs)
    end

    # Invers modulo: cari x sehingga (a * x) % m == 1.
    # Melempar error kalau gcd(a, m) != 1 (invers tidak ada).
    def mod_inverse(a, m)
      old_r = mod(a, m)
      r = m
      old_s = 1
      s = 0
      while r != 0
        q = old_r / r
        old_r, r = r, old_r - (q * r)
        old_s, s = s, old_s - (q * s)
      end
      if old_r != 1
        raise ArgumentError,
              "mod_inverse: gcd(#{a}, #{m}) = #{old_r} != 1 -> tidak ada invers modulo #{m}"
      end

      mod(old_s, m)
    end

    # Determinan matriks tanpa modulo (rekursif; cukup untuk n <= 3).
    def det_raw(matrix)
      n = matrix.length
      return 0 if n.zero?
      return matrix[0][0] if n == 1
      return (matrix[0][0] * matrix[1][1]) - (matrix[0][1] * matrix[1][0]) if n == 2

      sum = 0
      (0...n).each do |c|
        minor = matrix[1..].map { |row| row.each_with_index.reject { |_, j| j == c }.map(&:first) }
        sum += (c.even? ? 1 : -1) * matrix[0][c] * det_raw(minor)
      end
      sum
    end

    # Determinan modulo m.
    def det_mod(matrix, m)
      assert_square(matrix)
      mod(det_raw(matrix), m)
    end

    # Perkalian matriks modulo m.
    def mat_mul_mod(a, b, m)
      n = a.length
      k = b.length
      p = b[0] ? b[0].length : 0
      if a[0] ? a[0].length != k : true
        raise ArgumentError, "mat_mul_mod: dimensi tidak cocok"
      end

      out = []
      (0...n).each do |i|
        out << Array.new(p, 0)
        (0...p).each do |j|
          sum = 0
          (0...k).each { |t| sum += a[i][t] * b[t][j] }
          out[i][j] = mod(sum, m)
        end
      end
      out
    end

    # Transpose matriks.
    def transpose(matrix)
      rows = matrix.length
      cols = matrix[0] ? matrix[0].length : 0
      out = []
      (0...cols).each do |j|
        out << Array.new(rows, 0)
        (0...rows).each { |i| out[j][i] = matrix[i][j] }
      end
      out
    end

    # Matriks kofaktor.
    def cofactor_matrix(matrix)
      assert_square(matrix)
      n = matrix.length
      out = []
      (0...n).each do |i|
        out << Array.new(n, 0)
        (0...n).each do |j|
          sign = ((i + j) % 2).zero? ? 1 : -1
          out[i][j] = sign * det_raw(minor_of(matrix, i, j))
        end
      end
      out
    end

    # Invers matriks modulo m: adj(A) * det(A)^-1 mod m.
    def invert_matrix_mod(matrix, m)
      assert_square(matrix)
      det = det_mod(matrix, m)
      begin
        det_inv = mod_inverse(det, m)
      rescue ArgumentError
        raise ArgumentError,
              "Matriks tidak punya invers modulo #{m}: det = #{det}, " \
              "gcd(#{det}, #{m}) != 1. Pilih matriks lain dengan determinan koprima #{m}."
      end
      adj = transpose(cofactor_matrix(matrix))
      adj.map { |row| row.map { |v| mod(v * det_inv, m) } }
    end

    # Pastikan matriks persegi dan tidak kosong.
    def assert_square(matrix)
      n = matrix.length
      raise ArgumentError, "Matriks kosong — isi dulu matriks kuncinya." if n.zero?

      matrix.each_with_index do |row, i|
        next if row.length == n

        raise ArgumentError,
              "Matriks harus persegi: baris #{i + 1} berisi #{row.length} elemen, " \
              "sedangkan jumlah baris ada #{n}. Tulis 2x2 atau 3x3, " \
              'mis. "3,3;2,5" atau "6,24,1;13,16,10;20,17,15".'
      end
    end

    # -------------------------------------------------------------------------
    # Padding blok
    # -------------------------------------------------------------------------

    # Tambah padding sampai panjang kelipatan n. `filler` = nilai byte pengisi
    # (default 0x00 untuk jalur biner; cipher 26 huruf memakai kode 'X').
    def pad_block(data, n, filler = 0)
      raise ArgumentError, "pad_block: n harus > 0, dapat #{n}" if n <= 0

      rem = data.length % n
      return data.dup if rem.zero?

      out = data.dup
      out.concat(Array.new(n - rem, filler))
      out
    end

    # String 26 huruf -> byte ASCII (untuk jalur file pada cipher 26 huruf).
    def alpha_to_bytes(text)
      text.to_s.bytes.map { |b| b & 255 }
    end

    # -------------------------------------------------------------------------
    # Helper internal
    # -------------------------------------------------------------------------

    def minor_of(matrix, row, col)
      matrix.each_with_index.reject { |_, i| i == row }.map do |r, _|
        r.each_with_index.reject { |_, j| j == col }.map(&:first)
      end
    end
  end
end
