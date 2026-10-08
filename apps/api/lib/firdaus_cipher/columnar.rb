# frozen_string_literal: true

# columnar.rb — Transposisi Kolom (bagian dari g).
# Port 1:1 dari apps/web/src/lib/crypto/columnar.ts.
#
# Operasi pada BYTE (bukan hanya alfabet) supaya bisa dipakai untuk
# Super Enkripsi file biner (S11). Padding blok akhir = byte 0x00, dan
# panjang asli disimpan di header envelope supaya bisa dipangkas balik.
#
# Skema (dikunci):
#   - Urutan kolom ditentukan dengan mengurutkan huruf kunci (A<B<...),
#     seri dipecah oleh posisi kolom (stabil).
#   - Enkripsi : tulis plaintext baris-per-baris, baca kolom-per-kolom
#                mengikuti urutan kunci.
#   - Dekripsi : kebalikannya.
module FirdausCipher
  module Columnar
    module_function

    # Urutan kolom hasil sortir kunci, mis. "ZEBRAS" -> [4,3,1,0,5,2].
    def column_order(key)
      chars = key.each_char.each_with_index.map { |ch, i| [ch.upcase, i] }
      raise ArgumentError, "Kunci transposisi kolom kosong." if chars.empty?

      chars.sort_by { |ch, i| [ch, i] }.map { |_, i| i }
    end

    # Transposisi kolom — enkripsi byte.
    def encrypt_columnar(bytes, key)
      n_cols = key.length
      raise ArgumentError, "Kunci transposisi kolom kosong." if n_cols.zero?
      return [] if bytes.empty?

      n_rows = (bytes.length.to_f / n_cols).ceil
      total = n_rows * n_cols
      padded = bytes.dup
      padded.concat(Array.new(total - bytes.length, 0))

      order = column_order(key)
      out = []
      order.each do |col|
        n_rows.times { |r| out << padded[(r * n_cols) + col] }
      end
      out
    end

    # Transposisi kolom — dekripsi byte.
    def decrypt_columnar(bytes, key)
      n_cols = key.length
      raise ArgumentError, "Kunci transposisi kolom kosong." if n_cols.zero?
      return [] if bytes.empty?

      if (bytes.length % n_cols) != 0
        raise ArgumentError,
              "Panjang data (#{bytes.length}) bukan kelipatan panjang kunci (#{n_cols}). " \
              "File mungkin rusak atau kuncinya salah."
      end

      n_rows = bytes.length / n_cols
      order = column_order(key)
      grid = Array.new(bytes.length, 0)
      o = 0
      order.each do |col|
        n_rows.times do |r|
          grid[(r * n_cols) + col] = bytes[o]
          o += 1
        end
      end
      grid
    end
  end
end
