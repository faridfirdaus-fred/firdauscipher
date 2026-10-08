# frozen_string_literal: true

require "spec_helper"
require "json"
require "open3"

# Spec cross-verifikasi sisi Ruby (S22).
#
# Dua lapis pembuktian:
#   1. Setiap kasus vektor dijalankan LANGSUNG di Ruby (tanpa CLI).
#   2. CLI `bin/cross_cli.rb` — jembatan yang dipakai skrip TS — diuji
#      kontraknya: masukan JSON -> keluaran JSON, termasuk jalur error.
#
# Pasangan TS-nya ada di apps/web/scripts/cross-verify.ts, yang memanggil CLI
# ini dan membandingkan hasilnya. Jadi kalau Ruby berubah perilaku, TES INI
# yang gagal lebih dulu — bukan baru ketahuan saat cross-verify dijalankan.
RSpec.describe "cross-verifikasi vektor (S22)" do
  VECTORS_PATH = File.expand_path("../../../packages/vectors/vectors.json", __dir__)
  CLI_PATH = File.expand_path("../bin/cross_cli.rb", __dir__)

  def vectors
    @vectors ||= JSON.parse(File.read(VECTORS_PATH))["cases"]
  end

  # String <-> byte sesuai mode kasus vektor.
  def input_bytes(value, mode)
    mode == "binary" ? FirdausCipher::Core.from_base64(value.to_s) : value.to_s.bytes
  end

  def output_string(bytes, mode)
    mode == "binary" ? FirdausCipher::Core.to_base64(bytes) : FirdausCipher::Core.bytes_to_latin1(bytes)
  end

  def normalize_params(raw)
    out = {}
    (raw || {}).each { |k, v| out[k.to_s] = v }
    out
  end

  describe "vektor resmi dijalankan di Ruby" do
    it "berisi 27 kasus" do
      expect(vectors.length).to eq(27)
    end

    it "setiap kasus: enkripsi(plaintext) == ciphertext resmi" do
      gagal = []
      vectors.each do |c|
        mode = c["mode"] || "text"
        enc = FirdausCipher::Ciphers.run_cipher(
          c["cipher"], "encrypt", input_bytes(c["plaintext"], mode), normalize_params(c["params"])
        )
        hasil = output_string(enc, mode)
        gagal << "#{c['id']}: dapat #{hasil.inspect}, harusnya #{c['ciphertext'].inspect}" if hasil != c["ciphertext"]
      end
      expect(gagal).to be_empty, "kasus tidak cocok:\n#{gagal.join("\n")}"
    end

    it "setiap kasus: dekripsi(ciphertext) bisa dienkripsi ulang jadi ciphertext semula" do
      # Invarian yang berlaku untuk SEMUA cipher (termasuk Hill/Playfair yang
      # menyisipkan filler), jadi tidak bergantung plaintext persis.
      gagal = []
      vectors.each do |c|
        mode = c["mode"] || "text"
        params = normalize_params(c["params"])
        dec = FirdausCipher::Ciphers.run_cipher(c["cipher"], "decrypt", input_bytes(c["ciphertext"], mode), params)
        re = FirdausCipher::Ciphers.run_cipher(c["cipher"], "encrypt", dec, params)
        gagal << c["id"] if output_string(re, mode) != c["ciphertext"]
      end
      expect(gagal).to be_empty, "tidak stabil: #{gagal.join(', ')}"
    end

    it "mencakup semua 9 cipher" do
      expect(vectors.map { |c| c["cipher"] }.uniq.sort).to eq(
        %w[affine autokey columnar enigma ext-vigenere hill playfair super vigenere]
      )
    end
  end

  describe "CLI bin/cross_cli.rb" do
    def run_cli(payload)
      stdout, stderr, status = Open3.capture3("ruby", CLI_PATH, stdin_data: JSON.generate(payload))
      [JSON.parse(stdout), stderr, status]
    end

    it "mengembalikan satu hasil per kasus, berurutan" do
      subset = vectors.first(3)
      out, _err, status = run_cli("cases" => subset)

      expect(status).to be_success
      expect(out["results"].map { |r| r["id"] }).to eq(subset.map { |c| c["id"] })
    end

    it "hasilnya sama dengan menjalankan cipher langsung di Ruby" do
      out, _err, _status = run_cli("cases" => vectors)

      vectors.each_with_index do |c, i|
        mode = c["mode"] || "text"
        enc = FirdausCipher::Ciphers.run_cipher(
          c["cipher"], "encrypt", input_bytes(c["plaintext"], mode), normalize_params(c["params"])
        )
        expect(out["results"][i]["encrypt"]).to eq(output_string(enc, mode))
        expect(out["results"][i]["encrypt"]).to eq(c["ciphertext"])
      end
    end

    it "melaporkan error per kasus tanpa menggagalkan seluruh proses" do
      out, _err, status = run_cli(
        "cases" => [
          { "id" => "baik", "cipher" => "vigenere", "mode" => "text",
            "plaintext" => "ATTACKATDAWN", "ciphertext" => "lxfopvefrnhr", "params" => { "key" => "LEMON" } },
          { "id" => "rusak", "cipher" => "tidak-ada", "mode" => "text",
            "plaintext" => "X", "ciphertext" => "Y", "params" => {} }
        ]
      )

      expect(status).to be_success
      expect(out["results"][0]).not_to have_key("error")
      expect(out["results"][1]["error"]).to include("tidak dikenal")
    end

    it "menerima params kosong tanpa crash" do
      out, _err, status = run_cli(
        "cases" => [{ "id" => "tanpa-params", "cipher" => "vigenere", "mode" => "text",
                      "plaintext" => "A", "ciphertext" => "A" }]
      )

      expect(status).to be_success
      # Tanpa kunci harus jadi error yang jelas, bukan exception mentah.
      expect(out["results"][0]["error"]).to include("key")
    end

    it "menerima masukan `cases` kosong" do
      out, _err, status = run_cli("cases" => [])

      expect(status).to be_success
      expect(out["results"]).to eq([])
    end
  end
end
