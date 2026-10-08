# frozen_string_literal: true

require_relative "core"

# vigenere.rb — Vigenere standard (a) + Auto-Key Vigenere (b).
# Port 1:1 dari apps/web/src/lib/crypto/vigenere.ts.
#
# Standard : C_i = (P_i + K_i) mod 26, kunci diulang.
# Auto-Key : keystream = kunci + plaintext itu sendiri (untuk enkripsi).
#
# Input teks apa pun disanitasi dulu (Sp2, hanya A-Z); output huruf KECIL
# tanpa spasi (Sp5).
module FirdausCipher
  module Vigenere
    C = Core

    module_function

    # Siapkan kunci: sanitasi, wajib tidak kosong.
    def prepare_key(key)
      k = C.sanitize26(key)
      raise ArgumentError, "Kunci kosong atau tidak punya huruf A-Z. Isi kunci minimal 1 huruf." if k.empty?

      k
    end

    # Vigenere standard — enkripsi.
    def encrypt_vigenere(plaintext, key)
      p = C.sanitize26(plaintext)
      k = prepare_key(key)
      out = +""
      p.length.times do |i|
        out << C.num_to_char(C.char_to_num(p[i]) + C.char_to_num(k[i % k.length]))
      end
      out.downcase
    end

    # Vigenere standard — dekripsi.
    def decrypt_vigenere(ciphertext, key)
      c = C.sanitize26(ciphertext)
      k = prepare_key(key)
      out = +""
      c.length.times do |i|
        out << C.num_to_char(C.char_to_num(c[i]) - C.char_to_num(k[i % k.length]))
      end
      out.downcase
    end

    # Auto-Key Vigenere — enkripsi. Keystream = kunci diikuti plaintext.
    def encrypt_autokey(plaintext, key)
      p = C.sanitize26(plaintext)
      k = prepare_key(key)
      stream = k + p
      out = +""
      p.length.times do |i|
        out << C.num_to_char(C.char_to_num(p[i]) + C.char_to_num(stream[i]))
      end
      out.downcase
    end

    # Auto-Key Vigenere — dekripsi.
    #
    # WAJIB sekuensial: huruf plaintext ke-i yang baru didapat menjadi bagian
    # keystream untuk huruf ke-(i+1). Ini sumber bug klasik.
    def decrypt_autokey(ciphertext, key)
      c = C.sanitize26(ciphertext)
      k = prepare_key(key)
      plain = []
      c.length.times do |i|
        key_char = i < k.length ? k[i] : plain[i - k.length]
        plain << C.num_to_char(C.char_to_num(c[i]) - C.char_to_num(key_char))
      end
      plain.join.downcase
    end
  end
end
