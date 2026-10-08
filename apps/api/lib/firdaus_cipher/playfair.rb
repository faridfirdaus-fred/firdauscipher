# frozen_string_literal: true

require_relative "core"

# playfair.rb — Playfair Cipher (d).
# Port 1:1 dari apps/web/src/lib/crypto/playfair.ts.
#
# Matriks 5x5, huruf I/J DIGABUNG jadi I, filler 'X', pasangan kembar
# disisipkan filler, panjang ganjil ditambah filler di akhir (S07).
#
# Aturan: baris sama -> geser kanan/kiri; kolom sama -> geser bawah/atas;
# selain itu tukar sudut persegi panjang.
module FirdausCipher
  module Playfair
    C = Core
    PLAYFAIR_FILLER = "X"

    module_function

    # Susun key square 5x5 (25 huruf, I/J digabung).
    def build_key_square(key)
      seen = {}
      seq = []
      push = lambda do |ch|
        c = ch == "J" ? "I" : ch
        unless seen[c]
          seen[c] = true
          seq << c
        end
      end
      C.sanitize26(key).each_char { |ch| push.call(ch) }
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".each_char { |ch| push.call(ch) }

      (0...5).map { |r| seq[r * 5, 5] }
    end

    def find_pos(square, ch)
      c = ch == "J" ? "I" : ch
      5.times do |r|
        5.times do |k|
          return [r, k] if square[r][k] == c
        end
      end
      raise ArgumentError, "Huruf #{ch.inspect} tidak ada di key square"
    end

    # Bentuk digraph: buang non-alfabet, sisipkan filler untuk pasangan
    # kembar, pastikan genap.
    def make_digraphs(text)
      clean = C.sanitize26(text).tr("J", "I")
      chars = []
      i = 0
      while i < clean.length
        a = clean[i]
        b = clean[i + 1]
        if b.nil?
          chars << a << PLAYFAIR_FILLER
          i += 1
        elsif a == b
          chars << a << PLAYFAIR_FILLER
          i += 1
        else
          chars << a << b
          i += 2
        end
      end
      pairs = []
      k = 0
      while k < chars.length
        pairs << (chars[k] + chars[k + 1])
        k += 2
      end
      pairs
    end

    # Playfair — enkripsi.
    def encrypt_playfair(plaintext, key)
      square = build_key_square(key)
      out = +""
      make_digraphs(plaintext).each do |pair|
        r1, c1 = find_pos(square, pair[0])
        r2, c2 = find_pos(square, pair[1])
        if r1 == r2
          out << square[r1][(c1 + 1) % 5] << square[r2][(c2 + 1) % 5]
        elsif c1 == c2
          out << square[(r1 + 1) % 5][c1] << square[(r2 + 1) % 5][c2]
        else
          out << square[r1][c2] << square[r2][c1]
        end
      end
      out.downcase
    end

    # Playfair — dekripsi.
    def decrypt_playfair(ciphertext, key)
      square = build_key_square(key)
      clean = C.sanitize26(ciphertext).tr("J", "I")
      if clean.length.odd?
        raise ArgumentError, "Panjang ciphertext Playfair harus genap (sekarang #{clean.length})."
      end

      out = +""
      i = 0
      while i < clean.length
        r1, c1 = find_pos(square, clean[i])
        r2, c2 = find_pos(square, clean[i + 1])
        if r1 == r2
          out << square[r1][(c1 + 4) % 5] << square[r2][(c2 + 4) % 5]
        elsif c1 == c2
          out << square[(r1 + 4) % 5][c1] << square[(r2 + 4) % 5][c2]
        else
          out << square[r1][c2] << square[r2][c1]
        end
        i += 2
      end
      out.downcase
    end
  end
end
