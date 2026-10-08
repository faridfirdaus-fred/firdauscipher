# frozen_string_literal: true

require "spec_helper"
require "base64"

# Spec alur FILE (S21) — paritas dengan cipher-runner.ts (S14).
#
# Yang dibuktikan:
#   1. Envelope KRI1 yang ditulis Ruby bisa dibaca lagi (round-trip).
#   2. Header memuat nama + ekstensi asli, jadi file bisa dipulihkan (Sp9).
#   3. Byte biner utuh setelah encrypt -> .dat -> decrypt (Sp8).
RSpec.describe "alur file (.dat KRI1)" do
  ENV_M = FirdausCipher::Envelope

  def post_json(path, payload)
    post path, JSON.generate(payload), "CONTENT_TYPE" => "application/json"
  end

  # Byte "file" uji: mirip file kecil dengan header biner + 0x00.
  let(:file_bytes) { [0x89, 0x50, 0x4E, 0x47, 0x00, 0xFF, 0x10, 0x00, 0x7F, 0x41] }

  describe "format envelope" do
    it "menulis magic KRI1 + versi + cipherId di byte yang benar" do
      dat = ENV_M.pack_envelope(3, { name: "a.bin", ext: "bin", mime: "x", size: 1, mode: "binary" }, [9, 8])
      expect(dat[0, 4].map(&:chr).join).to eq("KRI1")
      expect(dat[4]).to eq(1)
      expect(dat[5]).to eq(3)
    end

    it "hdrLen little-endian dan payload ikut tersimpan" do
      dat = ENV_M.pack_envelope(1, { name: "x.txt", ext: "txt", mime: "text/plain", size: 2, mode: "base64-text" }, [1, 2, 3])
      env = ENV_M.unpack_envelope(dat)
      expect(env[:header]["name"]).to eq("x.txt")
      expect(env[:header]["ext"]).to eq("txt")
      expect(env[:payload]).to eq([1, 2, 3])
    end

    it "menolak file yang bukan KRI1 dengan pesan jelas" do
      expect { ENV_M.unpack_envelope([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) }
        .to raise_error(ArgumentError, /Bukan file .dat FirdausCipher/)
    end

    it "menolak file terlalu pendek" do
      expect { ENV_M.unpack_envelope([1, 2, 3]) }.to raise_error(ArgumentError, /terlalu pendek/)
    end

    it "split_file_name memisahkan nama & ekstensi" do
      expect(ENV_M.split_file_name("gambar.jpg")).to eq(name: "gambar", ext: "jpg")
      expect(ENV_M.split_file_name("tanpa-ekstensi")).to eq(name: "tanpa-ekstensi", ext: "")
      expect(ENV_M.split_file_name(".hidden")).to eq(name: ".hidden", ext: "")
    end

    it "dat_file_name menambah .dat" do
      expect(ENV_M.dat_file_name("gambar.jpg")).to eq("gambar.jpg.dat")
    end
  end

  describe "POST /api/encrypt-file" do
    it "cipher biner: menghasilkan .dat dengan header lengkap" do
      post_json "/api/encrypt-file", {
        "cipher" => "ext-vigenere", "name" => "gambar.jpg", "mime" => "image/jpeg",
        "input" => Base64.strict_encode64(file_bytes.pack("C*")),
        "params" => { "key" => "RAHASIA" }
      }

      expect(last_response.status).to eq(200)
      expect(last_response.headers["Content-Type"]).to eq("application/octet-stream")
      expect(last_response.headers["Content-Disposition"]).to include("gambar.jpg.dat")

      env = ENV_M.unpack_envelope(last_response.body.bytes)
      expect(env[:cipher]).to eq(3)
      expect(env[:header]).to include("name" => "gambar.jpg", "ext" => "jpg", "mime" => "image/jpeg", "size" => 10)
    end

    it "menolak file kosong (400)" do
      post_json "/api/encrypt-file", {
        "cipher" => "ext-vigenere", "name" => "x.bin", "input" => "", "params" => { "key" => "K" }
      }

      expect(last_response.status).to eq(400)
      expect(JSON.parse(last_response.body)["message"]).to include("kosong")
    end
  end

  describe "round-trip file utuh (Sp8/Sp9)" do
    it "Ext Vigenere: byte 0..255 -> .dat -> dekripsi = byte semula" do
      raw = (0..255).to_a
      enc = post_json("/api/encrypt-file", {
        "cipher" => "ext-vigenere", "name" => "data.bin", "mime" => "application/octet-stream",
        "input" => Base64.strict_encode64(raw.pack("C*")), "params" => { "key" => "RAHASIA" }
      })
      dat_b64 = Base64.strict_encode64(enc.body)

      dec = post_json "/api/decrypt-file", { "input" => dat_b64 }

      expect(last_response.status).to eq(200)
      expect(last_response.headers["Content-Disposition"]).to include("data.bin")
      expect(last_response.body.bytes).to eq(raw)
    end

    it "Super Enkripsi: file 300 byte -> .dat -> dekripsi = byte semula (padding dipangkas)" do
      raw = Array.new(300) { |i| (i * 91 + 7) % 256 }
      enc = post_json("/api/encrypt-file", {
        "cipher" => "super", "name" => "arsip.zip", "mime" => "application/zip",
        "input" => Base64.strict_encode64(raw.pack("C*")),
        "params" => { "key1" => "kunci1", "key2" => "ZEBRAS" }
      })
      dat_b64 = Base64.strict_encode64(enc.body)

      dec = post_json "/api/decrypt-file", { "input" => dat_b64 }

      expect(last_response.status).to eq(200)
      expect(last_response.body.bytes).to eq(raw)
    end

    it "Transposisi Kolom: file yang panjangnya bukan kelipatan kunci tetap utuh" do
      raw = [1, 2, 3, 4, 5, 6, 7] # 7 byte, kunci 6 huruf -> butuh padding
      enc = post_json("/api/encrypt-file", {
        "cipher" => "columnar", "name" => "kecil.txt",
        "input" => Base64.strict_encode64(raw.pack("C*")), "params" => { "key" => "ZEBRAS" }
      })
      dat_b64 = Base64.strict_encode64(enc.body)

      dec = post_json "/api/decrypt-file", { "input" => dat_b64 }

      expect(last_response.status).to eq(200)
      expect(last_response.body.bytes).to eq(raw)
    end

    it "mengembalikan MIME asli dari header" do
      enc = post_json("/api/encrypt-file", {
        "cipher" => "ext-vigenere", "name" => "foto.png", "mime" => "image/png",
        "input" => Base64.strict_encode64(file_bytes.pack("C*")), "params" => { "key" => "K" }
      })
      dat_b64 = Base64.strict_encode64(enc.body)

      post_json "/api/decrypt-file", { "input" => dat_b64 }
      expect(last_response.headers["Content-Type"]).to eq("image/png")
    end

    it "menolak .dat yang bukan format KRI1 (400, pesan jelas)" do
      post_json "/api/decrypt-file", { "input" => Base64.strict_encode64("bukan file dat".ljust(20, "\0")) }

      expect(last_response.status).to eq(400)
      expect(JSON.parse(last_response.body)["message"]).to match(/Bukan file \.dat|terlalu pendek/)
    end
  end
end
