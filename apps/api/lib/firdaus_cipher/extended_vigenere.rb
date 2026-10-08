# frozen_string_literal: true

require_relative "core"

# extended_vigenere.rb — Extended Vigenere Cipher (c), 256 karakter ASCII.
# Port 1:1 dari apps/web/src/lib/crypto/extended-vigenere.ts.
#
# Operasi pada BYTE (0-255), modulo 256. TIDAK ada sanitasi: byte 0x00, 0xFF,
# dan header file asli ikut diproses (Sp8). Output byte mentah; base64 hanya
# untuk tampilan (Sp4).
module FirdausCipher
  module ExtendedVigenere
    MOD256 = 256

    module_function

    # Kunci sebagai byte. String key dikonversi UTF-8.
    def key_to_bytes(key)
      k = key.is_a?(String) ? Core.utf8_to_bytes(key) : key
      raise ArgumentError, "Kunci Extended Vigenere kosong." if k.empty?

      k
    end

    # Extended Vigenere — enkripsi byte.
    def encrypt_ext_vigenere(bytes, key)
      k = key_to_bytes(key)
      bytes.each_with_index.map { |b, i| (b + k[i % k.length]) % MOD256 }
    end

    # Extended Vigenere — dekripsi byte.
    def decrypt_ext_vigenere(bytes, key)
      k = key_to_bytes(key)
      bytes.each_with_index.map { |b, i| (b - k[i % k.length] + MOD256) % MOD256 }
    end
  end
end
