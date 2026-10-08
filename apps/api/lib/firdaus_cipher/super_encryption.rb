# frozen_string_literal: true

require_relative "extended_vigenere"
require_relative "columnar"

# super_encryption.rb — Super Enkripsi (g).
# Port 1:1 dari apps/web/src/lib/crypto/super-encryption.ts.
#
# Komposisi dua cipher. Urutan DIKUNCI (S12):
#   enkripsi : Extended Vigenere  ->  Transposisi Kolom
#   dekripsi : Kolom^-1           ->  Vigenere^-1
#
# Dua kunci terpisah (Q2): key1 = Extended Vigenere, key2 = Transposisi Kolom.
module FirdausCipher
  module SuperEncryption
    module_function

    # Super enkripsi — enkripsi byte.
    def super_encrypt(bytes, key1, key2)
      raise ArgumentError, "Kunci 1 (Extended Vigenere) kosong." if key1.empty?
      raise ArgumentError, "Kunci 2 (Transposisi Kolom) kosong." if key2.empty?

      step1 = ExtendedVigenere.encrypt_ext_vigenere(bytes, key1)
      Columnar.encrypt_columnar(step1, key2)
    end

    # Super enkripsi — dekripsi byte.
    # `original_length` = panjang plaintext asli; dipakai memangkas padding
    # 0x00 dari transposisi kolom (S11).
    def super_decrypt(bytes, key1, key2, original_length = nil)
      raise ArgumentError, "Kunci 1 (Extended Vigenere) kosong." if key1.empty?
      raise ArgumentError, "Kunci 2 (Transposisi Kolom) kosong." if key2.empty?

      step1 = Columnar.decrypt_columnar(bytes, key2)
      step2 = ExtendedVigenere.decrypt_ext_vigenere(step1, key1)
      return step2 if original_length.nil?

      if original_length > step2.length
        raise ArgumentError,
              "Panjang asli (#{original_length}) lebih besar dari hasil dekripsi (#{step2.length}). " \
              "Kunci atau file mungkin salah."
      end

      step2[0, original_length]
    end
  end
end
