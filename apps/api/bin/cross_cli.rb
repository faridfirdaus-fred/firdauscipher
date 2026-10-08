#!/usr/bin/env ruby
# frozen_string_literal: true

# cross_cli.rb — CLI untuk cross-verifikasi TS <-> Ruby (S22).
#
# Membaca JSON dari STDIN, menjalankan cipher Ruby, menulis JSON ke STDOUT.
# Tidak butuh server (deterministik, cepat, bisa dipakai CI).
#
# Format masukan:
#   { "cases": [ { "id", "cipher", "mode", "plaintext", "ciphertext", "params" } ] }
#   - mode "text"   : plaintext/ciphertext = string huruf biasa
#   - mode "binary" : plaintext/ciphertext = base64
#
# Format keluaran:
#   { "results": [ { "id", "encrypt", "decrypt", "error" } ] }
#   - encrypt : hasil enkripsi plaintext menurut Ruby (representasi sama dgn mode)
#   - decrypt : hasil dekripsi CIPHERTEXT RESMI menurut Ruby (uji vektor kanonik)
#
# Jalankan:  echo '{"cases":[...]}' | ruby bin/cross_cli.rb
# Dipakai oleh: apps/web/scripts/cross-verify.ts

require "json"

require_relative "../lib/firdaus_cipher/ciphers"
require_relative "../lib/firdaus_cipher/core"

C = FirdausCipher::Core

# String <-> byte sesuai mode kasus vektor.
def input_bytes(value, mode)
  mode == "binary" ? C.from_base64(value.to_s) : value.to_s.bytes
end

# Byte -> representasi string sesuai mode.
def output_string(bytes, mode)
  mode == "binary" ? C.to_base64(bytes) : C.bytes_to_latin1(bytes)
end

payload = JSON.parse($stdin.read)
cases = payload["cases"] || []

results = cases.map do |c|
  id = c["id"]
  slug = c["cipher"]
  mode = c["mode"] || "text"
  # Params JSON -> hash dengan kunci string (matriks tetap array-of-arrays).
  params = {}
  (c["params"] || {}).each { |k, v| params[k.to_s] = v }

  begin
    enc = FirdausCipher::Ciphers.run_cipher(slug, "encrypt", input_bytes(c["plaintext"], mode), params)
    dec = FirdausCipher::Ciphers.run_cipher(slug, "decrypt", input_bytes(c["ciphertext"], mode), params)
    {
      "id" => id,
      "encrypt" => output_string(enc, mode),
      "decrypt" => output_string(dec, mode)
    }
  rescue StandardError => e
    { "id" => id, "error" => "#{e.class}: #{e.message}" }
  end
end

$stdout.write(JSON.generate({ "results" => results }))
