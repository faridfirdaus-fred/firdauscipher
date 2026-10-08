# frozen_string_literal: true

require "spec_helper"
require "json"
require_relative "../lib/firdaus_cipher/ciphers"

# Spec vektor bersama (S21) — memakai packages/vectors/vectors.json yang SAMA
# dengan implementasi TypeScript (D20). File ini adalah bukti awal bahwa port
# Ruby tidak menyimpang; cross-verify penuh ada di S22.
#
# Bentuk parameter di JSON sengaja dipertahankan apa adanya (termasuk array
# untuk `matrix`/`rotors`) supaya menguji jalur yang benar-benar dipakai REST API.
RSpec.describe "vektor bersama (packages/vectors/vectors.json)" do
  C = FirdausCipher::Core
  RUN = FirdausCipher::Ciphers

  vectors = JSON.parse(File.read(File.expand_path("../../../packages/vectors/vectors.json", __dir__)))

  it "file vektor ada dan berisi 27 kasus" do
    expect(vectors["cases"].length).to eq(27)
  end

  vectors["cases"].each do |c|
    it "#{c['id']} — #{c['note']}" do
      params = c["params"].transform_keys(&:to_s).transform_values(&:to_s)
      c["params"].each { |k, v| params[k] = v if v.is_a?(Array) }

      if c["mode"] == "text"
        input = C.utf8_to_bytes(c["plaintext"])
        out = RUN.run_cipher(c["cipher"], "encrypt", input, params)
        expect(C.bytes_to_utf8(out)).to eq(c["ciphertext"])
      else
        input = C.from_base64(c["plaintext"])
        out = RUN.run_cipher(c["cipher"], "encrypt", input, params)
        expect(C.to_base64(out)).to eq(c["ciphertext"])
      end
    end

    # Cipher 26 huruf: dekripsi lalu enkripsi ulang harus kembali ke
    # ciphertext semula. Invarian ini berlaku untuk semua cipher 26 huruf,
    # termasuk Hill & Playfair yang menyisipkan filler 'X' (jadi hasil
    # dekripsinya bukan plaintext asli persis, melainkan plaintext + filler).
    next unless c["mode"] == "text"

    it "#{c['id']} — dekripsi lalu enkripsi ulang = ciphertext semula" do
      params = c["params"].transform_keys(&:to_s).transform_values(&:to_s)
      c["params"].each { |k, v| params[k] = v if v.is_a?(Array) }
      plain = RUN.run_cipher(c["cipher"], "decrypt", C.utf8_to_bytes(c["ciphertext"]), params)
      again = RUN.run_cipher(c["cipher"], "encrypt", plain, params)
      expect(C.bytes_to_utf8(again)).to eq(c["ciphertext"])
    end
  end

  it "semua slug di vektor dikenal registry" do
    slugs = vectors["cases"].map { |c| c["cipher"] }.uniq
    known = RUN.cipher_defs.map { |d| d["slug"] }
    slugs.each { |s| expect(known).to include(s) }
  end
end
