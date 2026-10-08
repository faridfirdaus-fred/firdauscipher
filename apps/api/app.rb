# frozen_string_literal: true

require "sinatra/base"
require "json"

require_relative "lib/firdaus_cipher/ciphers"

# FirdausCipher API — implementasi Ruby (Bonus 2).
#
# S01: skeleton + /health + /api/ciphers (daftar masih kosong).
# S20: port core utils ke Ruby (lib/firdaus_cipher/core.rb) + spec-nya.
# S21: rute cipher sesungguhnya (a–h) + GUI mini (ERB).
#
# Rute API DIKUNCI (docs/PLAN.md S21):
#   GET  /health        -> { status: "ok" }
#   GET  /api/ciphers   -> daftar cipher + parameter
#   POST /api/encrypt   -> body { cipher, input(base64), params|key, mode } -> { output(base64), meta }
#   POST /api/decrypt   -> idem
#   CORS                -> Access-Control-Allow-Origin dari env ALLOWED_ORIGIN
module FirdausCipher
  class App < Sinatra::Base
    set :host_authorization, permitted_hosts: []
    set :show_exceptions, false
    set :raise_errors, false
    # Path absolut supaya server jalan dari direktori mana pun (lokal & Render).
    set :views, File.join(__dir__, "views")
    set :public_folder, File.join(__dir__, "public")

    # Field body yang BUKAN parameter cipher.
    META_KEYS = %w[cipher input mode params key direction].freeze

    helpers do
      # Origin yang diizinkan (domain Cloudflare Workers) dari env.
      def allowed_origin
        ENV.fetch("ALLOWED_ORIGIN", "*")
      end

      def apply_cors!
        headers "Access-Control-Allow-Origin" => allowed_origin,
                "Access-Control-Allow-Methods" => "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers" => "Content-Type",
                "Vary" => "Origin"
      end

      # `mode` di request = "text" | "binary". Registry memakai "base64-text"
      # untuk cipher 26 huruf, jadi keduanya perlu disamakan dulu.
      def text_mode?(mode)
        %w[text base64-text].include?(mode.to_s)
      end

      # Apakah cipher (berdasarkan slug) termasuk cipher 26 huruf?
      def defn_alpha?(slug)
        defn = Ciphers.cipher_defs.find { |d| d["slug"] == slug }
        defn ? defn["isAlpha"] : false
      end

      # Base64 -> byte. Melempar ArgumentError yang jelas kalau kosong/salah.
      def decode_input(b64, mode)
        raw = b64.to_s
        bytes = Core.from_base64(raw)
        if text_mode?(mode) && !raw.empty? && bytes.empty?
          raise ArgumentError, 'Field "input" bukan base64 yang valid.'
        end
        bytes
      end

      # Kumpulkan parameter cipher dari body: pakai objek `params` kalau ada,
      # lalu lengkapi dengan field top-level (mis. `key`, `a`, `b`, `matrix`).
      def collect_params(body)
        params = {}
        params.merge!(body["params"]) if body["params"].is_a?(Hash)
        body.each do |k, v|
          next if META_KEYS.include?(k)
          next if v.nil?

          params[k] = v
        end
        # `key` top-level = kunci umum untuk cipher berkunci tunggal.
        params["key"] = body["key"] if body["key"] && !params.key?("key")
        params
      end

      # Jalankan satu arah dan bungkus jadi respons JSON.
      def run_and_respond(body, direction)
        slug = body["cipher"].to_s
        raise ArgumentError, 'Field "cipher" wajib diisi.' if slug.strip.empty?

        defn = Ciphers.cipher_defs.find { |d| d["slug"] == slug }
        input_b64 = body["input"].to_s
        # Default mode mengikuti sifat cipher: 26 huruf -> teks, lainnya -> biner.
        raw_mode = body["mode"]
        raw_mode = (defn && defn["isAlpha"]) ? "text" : "binary" if raw_mode.nil? || raw_mode.to_s.empty?
        mode = text_mode?(raw_mode) ? "text" : "binary"
        input = decode_input(input_b64, mode)
        params = collect_params(body)

        output = Ciphers.run_cipher(slug, direction, input, params)

        {
          output: Core.to_base64(output),
          meta: {
            cipher: slug,
            cipherId: Envelope::CIPHER_IDS[slug],
            name: defn && defn["name"],
            direction: direction,
            mode: mode,
            isAlpha: defn && defn["isAlpha"],
            inputBytes: input.length,
            outputBytes: output.length,
            inputText: mode == "text" ? Core.bytes_to_utf8(input) : nil,
            outputText: mode == "text" ? Core.bytes_to_utf8(output) : nil,
            cipherMode: defn && defn["mode"]
          }
        }
      end

      # Parse body JSON; kalau bukan JSON, coba form-encoded (untuk GUI).
      def parse_body
        if request.media_type == "application/json"
          raw = request.body.read
          return {} if raw.strip.empty?

          JSON.parse(raw)
        else
          # Form-encoded dari GUI mini: params.* jadi nested hash.
          out = {}
          nested = {}
          request.params.each do |k, v|
            if k.start_with?("params.")
              nested[k.sub("params.", "")] = v
            else
              out[k] = v
            end
          end
          out["params"] = nested unless nested.empty?
          out
        end
      end

      def json_error(status, code, message)
        status status
        { error: code, message: message }.to_json
      end
    end

    before do
      apply_cors!
      content_type :json unless request.path_info == "/" || request.path_info.start_with?("/gui")
    end

    # Preflight CORS.
    options "*" do
      status 204
      body ""
    end

    get "/health" do
      {
        status: "ok",
        service: "firdauscipher-api",
        ruby: RUBY_VERSION,
        version: 1
      }.to_json
    end

    get "/api/ciphers" do
      { ciphers: Ciphers.cipher_defs }.to_json
    end

    post "/api/encrypt" do
      run_and_respond(parse_body, "encrypt").to_json
    rescue ArgumentError => e
      json_error(400, "bad_request", e.message)
    rescue JSON::ParserError
      json_error(400, "bad_json", "Body bukan JSON yang valid.")
    end

    post "/api/decrypt" do
      run_and_respond(parse_body, "decrypt").to_json
    rescue ArgumentError => e
      json_error(400, "bad_request", e.message)
    rescue JSON::ParserError
      json_error(400, "bad_json", "Body bukan JSON yang valid.")
    end

    # ---------------------------------------------------------------------
    # Alur FILE (Sp8/Sp9) — paritas dengan cipher-runner.ts (S14).
    # ---------------------------------------------------------------------

    # Enkripsi file apa pun -> unduh `.dat` (envelope KRI1).
    # Body JSON: { cipher, params|key, name, mime, input(base64 byte file) }
    post "/api/encrypt-file" do
      body = parse_body
      slug = body["cipher"].to_s
      defn = Ciphers.cipher_defs.find { |d| d["slug"] == slug }
      raise ArgumentError, "Cipher \"#{slug}\" tidak dikenal." if defn.nil?

      raw = Core.from_base64(body["input"].to_s)
      raise ArgumentError, "File kosong (0 byte)." if raw.empty?

      output = Ciphers.run_cipher(slug, "encrypt", raw, collect_params(body))
      name = body["name"].to_s
      name = "file.bin" if name.strip.empty?
      ext = Envelope.split_file_name(name)[:ext]
      header = {
        name: name,
        ext: ext,
        mime: (body["mime"] || "application/octet-stream").to_s,
        size: raw.length,
        mode: defn["mode"],
        params: collect_params(body)
      }
      dat = Envelope.pack_envelope(defn["id"], header, output)

      content_type "application/octet-stream"
      headers "Content-Disposition" => "attachment; filename=\"#{Envelope.dat_file_name(name)}\""
      dat.pack("C*")
    rescue ArgumentError => e
      content_type :json
      json_error(400, "bad_request", e.message)
    end

    # Dekripsi `.dat` -> file asli. Nama & ekstensi diambil dari header (Sp9).
    post "/api/decrypt-file" do
      body = parse_body
      dat = Core.from_base64(body["input"].to_s)
      env = Envelope.unpack_envelope(dat)
      slug = Envelope::CIPHER_NAMES[env[:cipher]]
      raise ArgumentError, "Cipher dengan id #{env[:cipher]} tidak dikenal di file ini." if slug.nil?

      header = env[:header]
      # Parameter cipher tersimpan di header; kalau body mengirim params,
      # itu yang dipakai (memudahkan mengganti kunci).
      params = collect_params(body)
      params = header["params"] if params.empty? && header["params"].is_a?(Hash)

      original_length = header["size"].is_a?(Integer) ? header["size"] : nil
      output =
        if slug == "super"
          SuperEncryption.super_decrypt(env[:payload], params["key1"].to_s, params["key2"].to_s, original_length)
        else
          Ciphers.run_cipher(slug, "decrypt", env[:payload], params)
        end
      # Cipher biner: pangkas padding 0x00 transposisi kolom pakai `size` (S11).
      if !defn_alpha?(slug) && original_length && output.length > original_length
        output = output[0, original_length]
      end

      name = header["name"].to_s
      content_type (header["mime"] || "application/octet-stream").to_s
      headers "Content-Disposition" => "attachment; filename=\"#{name}\""
      output.pack("C*")
    rescue ArgumentError => e
      content_type :json
      json_error(400, "bad_request", e.message)
    end

    # ---------------------------------------------------------------------
    # GUI mini (ERB) — membuktikan "GUI berbasis web" untuk bonus 2.
    # ---------------------------------------------------------------------

    get "/" do
      content_type :html
      erb :index, locals: { ciphers: Ciphers.cipher_defs, result: nil, error: nil, form: {} }
    end

    post "/gui" do
      content_type :html
      raw = parse_body
      slug = raw["cipher"].to_s
      defn = Ciphers.cipher_defs.find { |d| d["slug"] == slug }
      text = raw["input_text"].to_s

      # GUI menerima teks biasa; API memakai base64. Jembatani di sini.
      # Untuk cipher biner, teks dikonversi UTF-8 apa adanya (byte mentah).
      body = {
        "cipher" => slug,
        "mode" => (defn && defn["isAlpha"]) ? "text" : "binary",
        "input" => Core.to_base64(Core.utf8_to_bytes(text)),
        "params" => raw["params"] || {},
        "direction" => raw["direction"]
      }
      direction = raw["direction"] == "decrypt" ? "decrypt" : "encrypt"
      begin
        res = run_and_respond(body, direction)
        erb :index, locals: { ciphers: Ciphers.cipher_defs, result: res, error: nil,
                              form: { "cipher" => slug, "direction" => direction,
                                      "params" => raw["params"] || {}, "input_text" => text } }
      rescue ArgumentError => e
        erb :index, locals: { ciphers: Ciphers.cipher_defs, result: nil, error: e.message,
                              form: { "cipher" => slug, "direction" => direction,
                                      "params" => raw["params"] || {}, "input_text" => text } }
      end
    end

    not_found do
      json_error(404, "not_found", "Rute tidak ditemukan: #{request.path_info}")
    end

    error do
      json_error(500, "internal_error", env["sinatra.error"]&.message)
    end
  end
end
