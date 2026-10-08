# frozen_string_literal: true

require "json"
require_relative "core"

# envelope.rb — bungkus (envelope) file ciphertext `.dat`.
# Port 1:1 dari apps/web/src/lib/crypto/envelope.ts.
#
# Format DIKUNCI (lihat docs/format-file.md):
#
#   [0..3]   magic  : "KRI1"          (4 byte ASCII)
#   [4]      version: 0x01
#   [5]      cipher : 1 byte enum (1..9)
#   [6..9]   hdrLen : uint32 little-endian
#   [10..]   header : JSON UTF-8 { name, ext, mime, size, mode, params }
#   [..]     payload: byte ciphertext
#
# Envelope ini lapisan LUAR yang ditambah SETELAH enkripsi, jadi semua byte
# plaintext (termasuk header file aslinya) tetap ikut terenkripsi (Sp8).
module FirdausCipher
  module Envelope
    MAGIC = "KRI1"
    VERSION = 1
    HEADER_OFFSET = 10

    # Enum cipher — dipakai di byte ke-5 envelope. Angka WAJIB sama dengan TS.
    CIPHER_IDS = {
      "vigenere" => 1,
      "autokey" => 2,
      "ext-vigenere" => 3,
      "playfair" => 4,
      "affine" => 5,
      "hill" => 6,
      "super" => 7,
      "enigma" => 8,
      "columnar" => 9
    }.freeze

    CIPHER_NAMES = CIPHER_IDS.invert.freeze

    module_function

    # Susun envelope jadi byte siap-unduh.
    # `header` = Hash dengan kunci simbol/string {name, ext, mime, size, mode, params}.
    def pack_envelope(cipher, header, payload)
      raise ArgumentError, "MAGIC harus 4 byte" if MAGIC.length != 4

      header_bytes = Core.utf8_to_bytes(JSON.generate(stringify(header)))
      out = []
      MAGIC.each_char { |ch| out << ch.ord }
      out << VERSION
      out << (cipher & 255)
      out.concat(uint32_le(header_bytes.length))
      out.concat(header_bytes)
      out.concat(payload)
      out
    end

    # Baca envelope dari byte. Melempar error yang jelas kalau bukan KRI1.
    def unpack_envelope(bytes)
      if bytes.length < HEADER_OFFSET
        raise ArgumentError, "File terlalu pendek untuk format KRI1 (.dat)"
      end

      magic = bytes[0, 4].map(&:chr).join
      if magic != MAGIC
        raise ArgumentError, "Bukan file .dat FirdausCipher: magic = #{magic.inspect}, harusnya #{MAGIC.inspect}"
      end

      version = bytes[4]
      if version != VERSION
        raise ArgumentError, "Versi envelope tidak didukung: #{version} (didukung: #{VERSION})"
      end

      cipher = bytes[5]
      hdr_len = read_uint32_le(bytes[6, 4])
      header_end = HEADER_OFFSET + hdr_len
      raise ArgumentError, "Header envelope rusak (hdrLen melebihi ukuran file)" if header_end > bytes.length

      header_json = Core.bytes_to_utf8(bytes[HEADER_OFFSET, hdr_len])
      begin
        header = JSON.parse(header_json)
      rescue JSON::ParserError
        raise ArgumentError, "Header envelope bukan JSON valid"
      end
      { cipher: cipher, header: header, payload: bytes[header_end..] || [] }
    end

    # uint32 little-endian -> 4 byte.
    def uint32_le(value)
      v = value & 0xFFFFFFFF
      [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255]
    end

    # 4 byte little-endian -> integer.
    def read_uint32_le(bytes)
      b = bytes + [0, 0, 0, 0]
      b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)
    end

    # Nama file `.dat` default: <nama-asli>.dat.
    def dat_file_name(original_name)
      "#{original_name}.dat"
    end

    # Ambil nama + ekstensi dari nama file.
    def split_file_name(file_name)
      dot = file_name.rindex(".")
      return { name: file_name, ext: "" } if dot.nil? || dot <= 0 || dot == file_name.length - 1

      { name: file_name[0, dot], ext: file_name[(dot + 1)..] }
    end

    # Hash kunci simbol -> string (supaya JSON-nya sama dengan TS).
    def stringify(header)
      header.each_with_object({}) do |(k, v), acc|
        acc[k.to_s] = v
      end
    end
  end
end
