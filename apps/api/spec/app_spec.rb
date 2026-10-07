# frozen_string_literal: true

require "spec_helper"

RSpec.describe FirdausCipher::App do
  describe "GET /health" do
    it "mengembalikan status ok" do
      get "/health"

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)).to include("status" => "ok")
    end
  end

  describe "GET /api/ciphers" do
    it "mengembalikan daftar cipher (masih kosong di S01)" do
      get "/api/ciphers"

      expect(last_response.status).to eq(200)
      expect(JSON.parse(last_response.body)).to have_key("ciphers")
    end
  end
end
