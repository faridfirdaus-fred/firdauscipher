# frozen_string_literal: true

require_relative "core"

# hill.rb — Hill Cipher (f).
# Port 1:1 dari apps/web/src/lib/crypto/hill.ts.
#
# Blok berukuran n (n = 2 atau 3). Kunci = matriks n x n yang determinannya
# koprima 26 supaya punya invers mod 26. Padding blok terakhir memakai
# filler 'X' (S09).
module FirdausCipher
  module Hill
    C = Core
    HILL_FILLER = "X"

    module_function

    # Parse matriks kunci dari teks: "6,24,1;13,16,10;20,17,15"
    # atau "6 24 1 / 13 16 10 / 20 17 15".
    def parse_matrix(text)
      rows = text.to_s.split(%r{[;\n/]+}).map(&:strip).reject(&:empty?)
      matrix = rows.each_with_index.map do |row, ri|
        row.split(/[\s,]+/).reject(&:empty?).each_with_index.map do |t, ci|
          n = integer_or_nil(t)
          if n.nil?
            raise ArgumentError,
                  "Elemen matriks baris #{ri + 1} kolom #{ci + 1} bukan bilangan bulat: #{t.inspect}. " \
                  'Isi dengan angka, mis. "3,3;2,5".'
          end

          C.mod(n, 26)
        end
      end
      validate_hill_key(matrix)
      matrix
    end

    # Validasi matriks kunci Hill; pesan error menyebut nilai determinan (S09).
    def validate_hill_key(matrix)
      C.assert_square(matrix)
      n = matrix.length
      if n != 2 && n != 3
        shape = matrix.map(&:length).join("x")
        raise ArgumentError,
              "Ukuran matriks Hill harus 2x2 atau 3x3, bukan #{shape}. " \
              'Contoh 2x2: "3,3;2,5". Contoh 3x3: "6,24,1;13,16,10;20,17,15".'
      end

      det = C.det_mod(matrix, 26)
      return unless (det % 2).zero? || (det % 13).zero?

      raise ArgumentError,
            "Matriks tidak bisa dipakai: det = #{det}, gcd(#{det}, 26) != 1. " \
            "Ciphertext tidak akan bisa didekripsi (matriks singular mod 26)."
    end

    # Hill — enkripsi.
    def encrypt_hill(plaintext, matrix)
      validate_hill_key(matrix)
      n = matrix.length
      p = C.sanitize26(plaintext)
      raise ArgumentError, "Plaintext tidak punya huruf A-Z." if p.empty?

      p += HILL_FILLER while (p.length % n) != 0

      out = +""
      i = 0
      while i < p.length
        block = p[i, n].each_char.map { |ch| C.char_to_num(ch) }
        col = block.map { |v| [v] }
        res = C.mat_mul_mod(matrix, col, 26)
        n.times { |r| out << C.num_to_char(res[r][0]) }
        i += n
      end
      out.downcase
    end

    # Hill — dekripsi.
    def decrypt_hill(ciphertext, matrix)
      validate_hill_key(matrix)
      n = matrix.length
      c = C.sanitize26(ciphertext)
      if (c.length % n) != 0
        raise ArgumentError, "Panjang ciphertext (#{c.length}) bukan kelipatan ukuran blok (#{n})."
      end

      inv = C.invert_matrix_mod(matrix, 26)
      out = +""
      i = 0
      while i < c.length
        block = c[i, n].each_char.map { |ch| C.char_to_num(ch) }
        col = block.map { |v| [v] }
        res = C.mat_mul_mod(inv, col, 26)
        n.times { |r| out << C.num_to_char(res[r][0]) }
        i += n
      end
      out.downcase
    end

    # Integer ketat: "5" -> 5, "5.0"/"abc"/"" -> nil.
    def integer_or_nil(t)
      s = t.to_s.strip
      return nil unless /\A[+-]?\d+\z/.match?(s)

      s.to_i
    end
  end
end
