# frozen_string_literal: true

require_relative "core"

# enigma.rb — Enigma Cipher (Bonus 1, h).
# Port 1:1 dari apps/web/src/lib/crypto/enigma.ts.
#
# Model: Enigma I, 3 rotor, reflector B, plugboard opsional, ring setting
# (Ringstellung) + posisi awal (Grundstellung) bisa diatur.
#
# Wiring rotor & reflector diambil dari Enigma I asli (data publik standar,
# bukan kode pihak ketiga — implementasi stepping & jalur sinyal ditulis sendiri).
#
# Stepping WAJIB benar termasuk double-stepping rotor tengah.
module FirdausCipher
  module Enigma
    ROTOR_WIRING = {
      "I" => "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
      "II" => "AJDKSIRUXBLHWTMCQGZNPYFVOE",
      "III" => "BDFHJLCPRTXVZNYEIWGAKMUSQO",
      "IV" => "ESOVPZJAYQUIRHXLNFTGKDCMWB",
      "V" => "VZBRGITYUPSDNHLXAWMJQOFECK"
    }.freeze

    # Posisi notch: rotor berputar ke berikutnya saat keluar dari huruf ini.
    ROTOR_NOTCH = {
      "I" => "Q", "II" => "E", "III" => "V", "IV" => "J", "V" => "Z"
    }.freeze

    REFLECTOR_WIRING = {
      "A" => "EJMZALYXVBWFCRQUONTSPIKHGD",
      "B" => "YRUHQSLDPXNGOKMIEBFZCWVJAT",
      "C" => "FVPJIAOYEDRZXWGCTKUQSBNMHL"
    }.freeze

    DEFAULT_CONFIG = {
      rotors: %w[I II III], reflector: "B", ring: "AAA", position: "AAA", plugboard: ""
    }.freeze

    module_function

    def to_index(ch)
      ch.upcase.ord - 65
    end

    # Parse plugboard jadi peta dua arah (0-25).
    def build_plugboard(plug)
      map = (0...26).to_a
      return map if plug.nil? || (plug.respond_to?(:empty?) && plug.empty?)

      pairs = plug.is_a?(Array) ? plug : plug.to_s.split(/[\s,;]+/)
      pairs.each do |pair|
        clean = pair.to_s.gsub(/[^A-Za-z]/, "").upcase
        if clean.length != 2
          next if clean.empty?

          raise ArgumentError, "Pasangan plugboard #{pair.inspect} tidak valid (harus 2 huruf berbeda)."
        end

        a = to_index(clean[0])
        b = to_index(clean[1])
        raise ArgumentError, "Plugboard #{pair.inspect} menghubungkan huruf yang sama." if a == b

        map[a] = b
        map[b] = a
      end
      map
    end

    # Mesin Enigma — state rotor disimpan, satu huruf per langkah.
    class Machine
      def initialize(config)
        rotors = config[:rotors] || DEFAULT_CONFIG[:rotors]
        reflector = config[:reflector] || "B"

        rotors.each do |r|
          next if ROTOR_WIRING.key?(r)

          raise ArgumentError,
                "Rotor #{r.inspect} tidak dikenal. Pilih: #{ROTOR_WIRING.keys.join(', ')}."
        end
        unless REFLECTOR_WIRING.key?(reflector)
          raise ArgumentError, "Reflector #{reflector.inspect} tidak dikenal (A, B, atau C)."
        end

        ring = Core.sanitize26(config[:ring] || "AAA")
        pos = Core.sanitize26(config[:position] || "AAA")
        if ring.length != 3
          raise ArgumentError, "Ring setting harus 3 huruf (dapat #{config[:ring].inspect})."
        end
        if pos.length != 3
          raise ArgumentError, "Posisi awal harus 3 huruf (dapat #{config[:position].inspect})."
        end

        @wiring = rotors.map { |r| ROTOR_WIRING[r] }
        @notch = rotors.map { |r| Enigma.to_index(ROTOR_NOTCH[r]) }
        @reflector = REFLECTOR_WIRING[reflector]
        @plugboard = Enigma.build_plugboard(config[:plugboard])
        @ring_idx = ring.each_char.map { |c| Enigma.to_index(c) }
        @rotor_idx = pos.each_char.map { |c| Enigma.to_index(c) }
      end

      # Posisi rotor saat ini sebagai 3 huruf (untuk ditampilkan/diuji).
      def position
        @rotor_idx.map { |i| (i + 65).chr }.join
      end

      # Putar rotor sebelum huruf diproses (stepping Enigma asli).
      #
      # Aturannya: rotor tengah ikut berputar kalau rotor kanan berada di notch
      # ATAU rotor tengah sendiri berada di notch (inilah *double-stepping*).
      def step
        at_notch = ->(i) { @rotor_idx[i] == @notch[i] }
        if at_notch.call(1)
          @rotor_idx[1] = (@rotor_idx[1] + 1) % 26
          @rotor_idx[0] = (@rotor_idx[0] + 1) % 26
        elsif at_notch.call(2)
          @rotor_idx[1] = (@rotor_idx[1] + 1) % 26
        end
        @rotor_idx[2] = (@rotor_idx[2] + 1) % 26
      end

      # Jalur sinyal maju melalui satu rotor (kanan -> kiri).
      def forward(i, c)
        offset = @rotor_idx[i] - @ring_idx[i]
        input = ((c + offset) % 26 + 26) % 26
        # Sama seperti `wiring.charCodeAt(input)` di TS.
        wired = @wiring[i][input].ord - 65
        ((wired - offset) % 26 + 26) % 26
      end

      # Jalur sinyal balik melalui satu rotor (kiri -> kanan).
      def backward(i, c)
        offset = @rotor_idx[i] - @ring_idx[i]
        input = ((c + offset) % 26 + 26) % 26
        wired = @wiring[i].index((input + 65).chr)
        raise "Wiring rotor #{i} rusak" if wired.nil?

        ((wired - offset) % 26 + 26) % 26
      end

      # Proses SATU huruf (huruf besar A-Z).
      def encode_char(ch)
        step
        c = Enigma.to_index(ch)
        c = @plugboard[c]
        c = forward(2, c)
        c = forward(1, c)
        c = forward(0, c)
        # Sama seperti `reflector.charCodeAt(c)` di TS.
        c = @reflector[c].ord - 65
        c = backward(0, c)
        c = backward(1, c)
        c = backward(2, c)
        c = @plugboard[c]
        (c + 65).chr
      end

      # Proses seluruh teks.
      def process(text)
        out = +""
        Core.sanitize26(text).each_char { |ch| out << encode_char(ch) }
        out.downcase
      end
    end

    # Enigma — enkripsi. Enigma involutif: konfigurasi & posisi awal yang sama
    # dipakai untuk enkripsi dan dekripsi.
    def encrypt_enigma(text, config = DEFAULT_CONFIG)
      Machine.new(config).process(text)
    end

    # Enigma — dekripsi (mesin baru dengan posisi awal yang sama).
    def decrypt_enigma(text, config = DEFAULT_CONFIG)
      Machine.new(config).process(text)
    end
  end
end
