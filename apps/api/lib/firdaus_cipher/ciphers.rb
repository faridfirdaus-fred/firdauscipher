# frozen_string_literal: true

require_relative "core"
require_relative "vigenere"
require_relative "playfair"
require_relative "affine"
require_relative "hill"
require_relative "extended_vigenere"
require_relative "columnar"
require_relative "super_encryption"
require_relative "enigma"
require_relative "envelope"

# ciphers.rb — registry terpadu semua cipher (port dari
# apps/web/src/lib/crypto/index.ts).
#
# Satu pintu masuk `run_cipher(slug, direction, input_bytes, params)` supaya
# REST API dan GUI mini memakai jalur yang sama, persis seperti GUI web.
#
# Semua cipher menerima & mengembalikan BYTE (Array<Integer>):
#   - cipher 26 huruf : byte diperlakukan sebagai teks, disanitasi (Sp2),
#                       hasilnya huruf kecil ASCII (Sp5).
#   - cipher biner    : byte diproses apa adanya, termasuk 0x00 dan header (Sp8).
module FirdausCipher
  module Ciphers
    C = Core

    # Ambil parameter wajib; pesan errornya menyebut nama field (S17).
    def self.need(params, name, label = nil)
      v = params[name] || params[name.to_s] || params[name.to_sym]
      if v.nil? || v.to_s.strip.empty?
        raise ArgumentError,
              "Kunci \"#{label || name}\" wajib diisi — isi dulu kolomnya sebelum memproses."
      end

      v.to_s
    end

    # Validasi kunci kata-sandi untuk cipher 26 huruf: harus punya minimal
    # satu huruf A-Z (S17).
    def self.need_alpha_key(key, label, cipher_name)
      unless /[a-z]/i.match?(key)
        raise ArgumentError,
              "Kunci \"#{label}\" untuk #{cipher_name} harus memuat minimal satu huruf A-Z " \
              "(kunci \"#{key}\" tidak punya huruf sama sekali)."
      end

      key
    end

    # Integer ketat: "5" -> 5, "5.0"/"abc" -> error.
    def self.strict_int(value, field)
      s = value.to_s.strip
      raise ArgumentError, "Kunci \"#{field}\" harus bilangan bulat." unless /\A[+-]?\d+\z/.match?(s)

      s.to_i
    end

    # Matriks kunci bisa datang sebagai:
    #   - string  : "6,24,1;13,16,10;20,17,15"
    #   - array-of-arrays (dari JSON): [[6,24,1],[13,16,10],[20,17,15]]
    # Keduanya dinormalkan jadi string agar `Hill.parse_matrix` menanganinya.
    def self.matrix_param(value, field)
      case value
      when Array
        value.map { |row| row.is_a?(Array) ? row.join(",") : row.to_s }.join(";")
      when nil
        raise ArgumentError, "Kunci \"#{field}\" wajib diisi — isi dulu kolomnya sebelum memproses."
      else
        value.to_s
      end
    end

    # Jalankan cipher berdasarkan slug. `direction` = "encrypt" | "decrypt".
    # `input` = Array<Integer> byte; `params` = Hash parameter (nilai string).
    def self.run_cipher(slug, direction, input, params)
      enc = direction.to_s == "encrypt"
      p = params || {}

      case slug.to_s
      when "vigenere"
        text = C.bytes_to_utf8(input)
        key = need_alpha_key(need(p, "key"), "key", "Vigenere")
        result = enc ? Vigenere.encrypt_vigenere(text, key) : Vigenere.decrypt_vigenere(text, key)
        C.utf8_to_bytes(result)
      when "autokey"
        text = C.bytes_to_utf8(input)
        key = need_alpha_key(need(p, "key"), "key", "Auto-Key Vigenere")
        result = enc ? Vigenere.encrypt_autokey(text, key) : Vigenere.decrypt_autokey(text, key)
        C.utf8_to_bytes(result)
      when "ext-vigenere"
        key = need(p, "key", "Kunci (Extended Vigenere)")
        enc ? ExtendedVigenere.encrypt_ext_vigenere(input, key) : ExtendedVigenere.decrypt_ext_vigenere(input, key)
      when "playfair"
        text = C.bytes_to_utf8(input)
        key = need_alpha_key(need(p, "key"), "key", "Playfair")
        result = enc ? Playfair.encrypt_playfair(text, key) : Playfair.decrypt_playfair(text, key)
        C.utf8_to_bytes(result)
      when "affine"
        text = C.bytes_to_utf8(input)
        a = strict_int(need(p, "a", "a"), "a")
        b = strict_int(need(p, "b", "b"), "b")
        result = enc ? Affine.encrypt_affine(text, a, b) : Affine.decrypt_affine(text, a, b)
        C.utf8_to_bytes(result)
      when "hill"
        text = C.bytes_to_utf8(input)
        matrix = Hill.parse_matrix(matrix_param(p["matrix"] || p[:matrix], "Matriks kunci"))
        result = enc ? Hill.encrypt_hill(text, matrix) : Hill.decrypt_hill(text, matrix)
        C.utf8_to_bytes(result)
      when "columnar"
        key = need_alpha_key(need(p, "key"), "key", "Transposisi Kolom")
        enc ? Columnar.encrypt_columnar(input, key) : Columnar.decrypt_columnar(input, key)
      when "super"
        key1 = need(p, "key1", "Kunci 1 (Extended Vigenere)")
        key2 = need_alpha_key(need(p, "key2", "key2"), "key2", "Super Enkripsi")
        if enc
          SuperEncryption.super_encrypt(input, key1, key2)
        else
          SuperEncryption.super_decrypt(input, key1, key2)
        end
      when "enigma"
        text = C.bytes_to_utf8(input)
        rotors_raw = p["rotors"] || p[:rotors] || "I,II,III"
        rotors = rotors_raw.is_a?(Array) ? rotors_raw.map(&:to_s) : rotors_raw.to_s.split(/[\s,]+/)
        config = {
          rotors: rotors,
          reflector: (p["reflector"] || p[:reflector] || "B").to_s,
          ring: (p["ring"] || p[:ring] || "AAA").to_s,
          position: (p["position"] || p[:position] || "AAA").to_s,
          plugboard: (p["plugboard"] || p[:plugboard] || "").to_s
        }
        result = enc ? Enigma.encrypt_enigma(text, config) : Enigma.decrypt_enigma(text, config)
        C.utf8_to_bytes(result)
      else
        raise ArgumentError, "Cipher \"#{slug}\" tidak dikenal."
      end
    end

    # -------------------------------------------------------------------------
    # Metadata untuk GET /api/ciphers (mencerminkan CIPHERS di index.ts)
    # -------------------------------------------------------------------------

    def self.cipher_defs
      [
        def_entry("vigenere", "a", "Vigenere Standard", "base64-text", true,
                  "C = (P + K) mod 26, kunci diulang. Hanya huruf A-Z yang diproses.",
                  [{ "name" => "key", "label" => "Kunci", "type" => "text", "defaultValue" => "LEMON" }]),
        def_entry("autokey", "b", "Auto-Key Vigenere", "base64-text", true,
                  "Keystream = kunci diikuti plaintext itu sendiri.",
                  [{ "name" => "key", "label" => "Kunci", "type" => "text", "defaultValue" => "QUEENLY" }]),
        def_entry("ext-vigenere", "c", "Extended Vigenere (256 ASCII)", "binary", false,
                  "Modulo 256, semua byte termasuk 0x00 dan header file ikut diproses.",
                  [{ "name" => "key", "label" => "Kunci", "type" => "text", "defaultValue" => "RAHASIA" }]),
        def_entry("playfair", "d", "Playfair", "base64-text", true,
                  "Matriks 5x5, I/J digabung, digraph, filler X.",
                  [{ "name" => "key", "label" => "Kunci", "type" => "text", "defaultValue" => "MONARCHY" }]),
        def_entry("affine", "e", "Affine", "base64-text", true,
                  "E(x) = (a*x + b) mod 26. `a` wajib koprima dengan 26.",
                  [
                    { "name" => "a", "label" => "a (koprima 26)", "type" => "select", "defaultValue" => "5",
                      "options" => Affine::VALID_A.map { |v| { "value" => v.to_s, "label" => v.to_s } } },
                    { "name" => "b", "label" => "b (0-25)", "type" => "number", "defaultValue" => "8" }
                  ]),
        def_entry("hill", "f", "Hill", "base64-text", true,
                  "Matriks kunci 2x2 atau 3x3, determinan wajib koprima 26. Padding X.",
                  [{ "name" => "matrix", "label" => "Matriks kunci", "type" => "matrix",
                     "defaultValue" => "6,24,1;13,16,10;20,17,15" }]),
        def_entry("columnar", "g", "Transposisi Kolom", "binary", false,
                  "Transposisi kolom pada byte. Dipakai juga sebagai tahap 2 Super Enkripsi.",
                  [{ "name" => "key", "label" => "Kunci", "type" => "text", "defaultValue" => "ZEBRAS" }]),
        def_entry("super", "g", "Super Enkripsi", "binary", false,
                  "Extended Vigenere lalu Transposisi Kolom (dua kunci terpisah).",
                  [
                    { "name" => "key1", "label" => "Kunci 1 (Extended Vigenere)", "type" => "text",
                      "defaultValue" => "RAHASIA" },
                    { "name" => "key2", "label" => "Kunci 2 (Transposisi Kolom)", "type" => "text",
                      "defaultValue" => "ZEBRAS" }
                  ]),
        def_entry("enigma", "h", "Enigma (Bonus)", "base64-text", true,
                  "Enigma I: 3 rotor, reflector B, ring setting, posisi awal, plugboard opsional.",
                  [
                    { "name" => "rotors", "label" => "Rotor (kiri-tengah-kanan)", "type" => "text",
                      "defaultValue" => "I,II,III" },
                    { "name" => "reflector", "label" => "Reflector", "type" => "select", "defaultValue" => "B" },
                    { "name" => "ring", "label" => "Ring setting", "type" => "text", "defaultValue" => "AAA" },
                    { "name" => "position", "label" => "Posisi awal", "type" => "text", "defaultValue" => "AAA" },
                    { "name" => "plugboard", "label" => "Plugboard (opsional)", "type" => "text", "defaultValue" => "" }
                  ])
      ]
    end

    def self.def_entry(slug, letter, name, mode, is_alpha, description, key_fields)
      {
        "id" => Envelope::CIPHER_IDS[slug],
        "slug" => slug,
        "letter" => letter,
        "name" => name,
        "mode" => mode,
        "isAlpha" => is_alpha,
        "description" => description,
        "keyFields" => key_fields
      }
    end
  end
end
