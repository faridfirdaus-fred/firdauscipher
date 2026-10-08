# frozen_string_literal: true

require "spec_helper"
require "base64"

# Spec REST API (S21). Fokus: kontrak rute yang dikunci di docs/PLAN.md,
# penanganan error yang ramah, dan CORS.
RSpec.describe FirdausCipher::App do
  # Ambil kasus vektor resmi supaya spec tidak bergantung angka hardcode.
  VECTORS = JSON.parse(File.read(File.expand_path("../../../packages/vectors/vectors.json", __dir__)))
  def vec(id)
    VECTORS["cases"].find { |c| c["id"] == id }
  end

  def post_json(path, payload)
    post path, JSON.generate(payload), "CONTENT_TYPE" => "application/json"
  end

  describe "GET /health" do
    it "mengembalikan status ok + versi ruby" do
      get "/health"

      expect(last_response.status).to eq(200)
      body = JSON.parse(last_response.body)
      expect(body).to include("status" => "ok", "service" => "firdauscipher-api")
      expect(body["ruby"]).to eq(RUBY_VERSION)
    end
  end

  describe "GET /api/ciphers" do
    it "mengembalikan 9 cipher (a-h + columnar)" do
      get "/api/ciphers"

      expect(last_response.status).to eq(200)
      ciphers = JSON.parse(last_response.body)["ciphers"]
      expect(ciphers.length).to eq(9)
      expect(ciphers.map { |c| c["slug"] }).to include(
        "vigenere", "autokey", "ext-vigenere", "playfair",
        "affine", "hill", "columnar", "super", "enigma"
      )
    end

    it "setiap cipher punya id, letter, mode, isAlpha, dan keyFields" do
      get "/api/ciphers"
      JSON.parse(last_response.body)["ciphers"].each do |c|
        expect(c["id"]).to be_a(Integer)
        expect(c["letter"]).to match(/\A[a-h]\z/)
        expect(%w[binary base64-text]).to include(c["mode"])
        expect([true, false]).to include(c["isAlpha"])
        expect(c["keyFields"]).to be_a(Array)
      end
    end
  end

  describe "POST /api/encrypt" do
    it "Vigenere: plaintext -> ciphertext sesuai vektor" do
      post_json "/api/encrypt", {
        "cipher" => "vigenere", "mode" => "text",
        "input" => Base64.strict_encode64("ATTACKATDAWN"),
        "params" => { "key" => "LEMON" }
      }

      expect(last_response.status).to eq(200)
      body = JSON.parse(last_response.body)
      expect(body["output"]).to eq(Base64.strict_encode64("lxfopvefrnhr"))
      expect(body["meta"]).to include("cipher" => "vigenere", "direction" => "encrypt", "isAlpha" => true)
    end

    it "menerima `key` di top-level (bukan hanya di dalam params)" do
      post_json "/api/encrypt", {
        "cipher" => "vigenere", "mode" => "text",
        "input" => Base64.strict_encode64("ATTACKATDAWN"), "key" => "LEMON"
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(Base64.strict_encode64("lxfopvefrnhr"))
    end

    it "Hill: matriks boleh dikirim sebagai array-of-arrays (JSON asli)" do
      post_json "/api/encrypt", {
        "cipher" => "hill", "mode" => "text",
        "input" => Base64.strict_encode64("ACT"),
        "params" => { "matrix" => [[6, 24, 1], [13, 16, 10], [20, 17, 15]] }
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(Base64.strict_encode64("poh"))
    end

    it "Extended Vigenere: byte biner diproses apa adanya (Sp8) — vektor resmi" do
      v = vec("ext-vigenere-1")
      post_json "/api/encrypt", {
        "cipher" => "ext-vigenere", "mode" => "binary",
        "input" => v["plaintext"], "params" => v["params"]
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(v["ciphertext"])
    end

    it "Super Enkripsi: vektor resmi (dua kunci)" do
      v = vec("super-1")
      post_json "/api/encrypt", {
        "cipher" => "super", "mode" => "binary",
        "input" => v["plaintext"], "params" => v["params"]
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(v["ciphertext"])
    end

    it "Enigma: vektor resmi (rotors sebagai array)" do
      post_json "/api/encrypt", {
        "cipher" => "enigma", "mode" => "text",
        "input" => Base64.strict_encode64("AAAAA"),
        "params" => { "rotors" => %w[I II III], "reflector" => "B", "ring" => "AAA", "position" => "AAA" }
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(Base64.strict_encode64("bdzgo"))
    end

    it "menolak cipher tanpa kunci (400 + pesan menyebut field)" do
      post_json "/api/encrypt", {
        "cipher" => "vigenere", "mode" => "text",
        "input" => Base64.strict_encode64("HALO")
      }

      expect(last_response.status).to eq(400)
      expect(JSON.parse(last_response.body)["message"]).to include("key")
    end

    it "menolak cipher tidak dikenal (400)" do
      post_json "/api/encrypt", {
        "cipher" => "tidak-ada", "mode" => "text", "input" => Base64.strict_encode64("X"), "key" => "A"
      }

      expect(last_response.status).to eq(400)
      expect(JSON.parse(last_response.body)["message"]).to include("tidak dikenal")
    end

    it "menolak body bukan JSON (400)" do
      post "/api/encrypt", "{bukan json", "CONTENT_TYPE" => "application/json"

      expect(last_response.status).to eq(400)
      expect(JSON.parse(last_response.body)["error"]).to eq("bad_json")
    end
  end

  describe "POST /api/decrypt" do
    it "Vigenere: ciphertext -> plaintext semula (Sp3)" do
      post_json "/api/decrypt", {
        "cipher" => "vigenere", "mode" => "text",
        "input" => Base64.strict_encode64("lxfopvefrnhr"),
        "params" => { "key" => "LEMON" }
      }

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)["output"]).to eq(Base64.strict_encode64("attackatdawn"))
    end

    it "round-trip via HTTP untuk cipher biner (Ext Vigenere) utuh" do
      raw = (0..255).to_a
      enc = post_json("/api/encrypt", {
        "cipher" => "ext-vigenere", "mode" => "binary",
        "input" => Base64.strict_encode64(raw.pack("C*")),
        "params" => { "key" => "RAHASIA" }
      })
      cipher_b64 = JSON.parse(enc.body)["output"]

      dec = post_json "/api/decrypt", {
        "cipher" => "ext-vigenere", "mode" => "binary",
        "input" => cipher_b64, "params" => { "key" => "RAHASIA" }
      }

      expect(last_response.status).to eq(200)
      out = Base64.strict_decode64(JSON.parse(dec.body)["output"])
      expect(out.bytes).to eq(raw)
    end

    it "Super Enkripsi: round-trip byte acak utuh (dua kunci)" do
      raw = Array.new(300) { |i| (i * 37) % 256 }
      enc = post_json("/api/encrypt", {
        "cipher" => "super", "mode" => "binary",
        "input" => Base64.strict_encode64(raw.pack("C*")),
        "params" => { "key1" => "RAHASIA", "key2" => "ZEBRAS" }
      })
      cipher_b64 = JSON.parse(enc.body)["output"]

      dec = post_json "/api/decrypt", {
        "cipher" => "super", "mode" => "binary",
        "input" => cipher_b64, "params" => { "key1" => "RAHASIA", "key2" => "ZEBRAS" }
      }

      expect(last_response.status).to eq(200)
      expect(Base64.strict_decode64(JSON.parse(dec.body)["output"]).bytes).to eq(raw)
    end

    it "Enigma: enkripsi lalu dekripsi (konfigurasi sama) kembali semula" do
      cfg = { "rotors" => "I,II,III", "reflector" => "B", "ring" => "AAA", "position" => "AAA" }
      enc = post_json("/api/encrypt", {
        "cipher" => "enigma", "mode" => "text",
        "input" => Base64.strict_encode64("KRIPTOGRAFI"), "params" => cfg
      })
      cipher_b64 = JSON.parse(enc.body)["output"]

      dec = post_json "/api/decrypt", {
        "cipher" => "enigma", "mode" => "text", "input" => cipher_b64, "params" => cfg
      }

      expect(last_response.status).to eq(200)
      expect(Base64.strict_decode64(JSON.parse(dec.body)["output"])).to eq("kriptografi")
    end
  end

  describe "CORS" do
    it "memakai ALLOWED_ORIGIN dari env" do
      get "/health", {}, "HTTP_ORIGIN" => "https://firdauscipher.pages.dev"

      expect(last_response.headers["Access-Control-Allow-Origin"]).to eq("*")
    end

    it "menjawab preflight OPTIONS dengan 204" do
      options "/api/encrypt"

      expect(last_response.status).to eq(204)
      expect(last_response.headers["Access-Control-Allow-Methods"]).to include("POST")
    end
  end

  describe "GUI mini (ERB)" do
    it "GET / menyajikan halaman HTML dengan daftar cipher" do
      get "/"

      expect(last_response.status).to eq(200)
      expect(last_response.headers["Content-Type"]).to include("text/html")
      expect(last_response.body).to include("FirdausCipher")
      expect(last_response.body).to include("Vigenere Standard")
    end

    it "POST /gui memproses teks biasa dan menampilkan hasil" do
      post "/gui", {
        "cipher" => "vigenere", "direction" => "encrypt",
        "input_text" => "ATTACKATDAWN", "params.key" => "LEMON"
      }

      expect(last_response.status).to eq(200)
      expect(last_response.body).to include("lxfopvefrnhr")
    end

    it "POST /gui menampilkan pesan error yang ramah saat kunci kosong" do
      post "/gui", { "cipher" => "vigenere", "direction" => "encrypt", "input_text" => "HALO", "params.key" => "" }

      expect(last_response.status).to eq(200)
      expect(last_response.body).to include("wajib diisi")
    end
  end

  describe "404" do
    it "mengembalikan JSON not_found" do
      get "/tidak-ada"

      expect(last_response.status).to eq(404)
      expect(JSON.parse(last_response.body)["error"]).to eq("not_found")
    end
  end
end
