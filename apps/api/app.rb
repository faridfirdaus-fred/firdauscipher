# frozen_string_literal: true

require "sinatra/base"
require "json"

# FirdausCipher API — implementasi Ruby (Bonus 2).
#
# S01: skeleton + /health + /api/ciphers (daftar masih kosong).
# S21: rute cipher sesungguhnya (a–h) + GUI mini.
module FirdausCipher
  class App < Sinatra::Base
    set :host_authorization, permitted_hosts: []
    set :show_exceptions, false
    set :raise_errors, false

    before do
      content_type :json
    end

    # Daftar cipher yang didukung.
    # Diisi lengkap di S21; sekarang sengaja kosong supaya frontend
    # sudah bisa memanggil endpoint ini sejak awal.
    CIPHERS = [].freeze

    get "/health" do
      {
        status: "ok",
        service: "firdauscipher-api",
        ruby: RUBY_VERSION
      }.to_json
    end

    get "/api/ciphers" do
      { ciphers: CIPHERS }.to_json
    end

    not_found do
      { error: "not_found", path: request.path_info }.to_json
    end

    error do
      { error: "internal_error", message: env["sinatra.error"]&.message }.to_json
    end
  end
end
