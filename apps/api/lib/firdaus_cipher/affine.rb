# frozen_string_literal: true

require_relative "core"

# affine.rb — Affine Cipher (e).
# Port 1:1 dari apps/web/src/lib/crypto/affine.ts.
#
#   E(x) = (a*x + b) mod 26
#   D(y) = a^-1 * (y - b) mod 26
#
# `a` wajib koprima dengan 26 (gcd(a,26) = 1) supaya punya invers.
module FirdausCipher
  module Affine
    C = Core

    # 12 nilai `a` yang valid untuk modulus 26.
    VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].freeze

    module_function

    # Cek apakah `a` valid (koprima dengan 26).
    def valid_a?(a)
      a.is_a?(Integer) && C.gcd(a, 26) == 1
    end

    # Validasi kunci; pesan error menyebut nilai gcd-nya (S17).
    def validate_affine_key(a, b)
      unless a.is_a?(Integer) && b.is_a?(Integer)
        raise ArgumentError, "Kunci Affine harus bilangan bulat (a dan b)."
      end

      unless valid_a?(a)
        raise ArgumentError,
              "a = #{a} tidak valid karena gcd(#{a}, 26) = #{C.gcd(a, 26)} != 1. " \
              "Nilai a yang valid: #{VALID_A.join(', ')}."
      end

      raise ArgumentError, "b = #{b} harus di antara 0 dan 25." if b.negative? || b > 25
    end

    # Affine — enkripsi.
    def encrypt_affine(plaintext, a, b)
      validate_affine_key(a, b)
      out = +""
      C.sanitize26(plaintext).each_char { |ch| out << C.num_to_char((a * C.char_to_num(ch)) + b) }
      out.downcase
    end

    # Affine — dekripsi.
    def decrypt_affine(ciphertext, a, b)
      validate_affine_key(a, b)
      a_inv = C.mod_inverse(a, 26)
      out = +""
      C.sanitize26(ciphertext).each_char do |ch|
        out << C.num_to_char(a_inv * C.mod(C.char_to_num(ch) - b, 26))
      end
      out.downcase
    end
  end
end
