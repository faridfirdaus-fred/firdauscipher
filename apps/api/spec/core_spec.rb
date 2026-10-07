# frozen_string_literal: true

require "spec_helper"
require_relative "../lib/firdaus_cipher/core"

# Spec untuk port core utils ke Ruby (S20).
#
# Tujuan utama: memastikan perilaku SEMANTIK-nya sama dengan
# apps/web/src/lib/crypto/core.ts, karena `packages/vectors/vectors.json`
# akan dipakai menguji kedua implementasi di S22.
RSpec.describe FirdausCipher::Core do
  # Alias pendek supaya contoh mudah dibaca.
  C = described_class

  describe ".sanitize26 (Sp2: hanya A-Z)" do
    it "membuang non-alfabet dan mengubah ke huruf besar" do
      expect(C.sanitize26("Serang Subuh! 123")).to eq("SERANGSUBUH")
    end

    it "membuang ß karena upcase-nya jadi 2 huruf (SS)" do
      # Menyamai TS: 'ß'.toUpperCase() === 'SS' -> panjang 2 -> dibuang.
      expect(C.sanitize26("stra\u00DFe")).to eq("STRAE")
    end

    it "string tanpa huruf -> string kosong" do
      expect(C.sanitize26("12345 !@#")).to eq("")
    end

    it "sudah huruf besar -> tidak berubah" do
      expect(C.sanitize26("ATTACKATDAWN")).to eq("ATTACKATDAWN")
    end
  end

  describe ".char_to_num / .num_to_char" do
    it "A=0, Z=25" do
      expect(C.char_to_num("A")).to eq(0)
      expect(C.char_to_num("Z")).to eq(25)
    end

    it "0 -> A, 25 -> Z" do
      expect(C.num_to_char(0)).to eq("A")
      expect(C.num_to_char(25)).to eq("Z")
    end

    it "num_to_char otomatis modulo 26 (termasuk negatif)" do
      expect(C.num_to_char(26)).to eq("A")
      expect(C.num_to_char(27)).to eq("B")
      expect(C.num_to_char(-1)).to eq("Z")
      expect(C.num_to_char(-26)).to eq("A")
    end

    it "char_to_num menolak non-huruf dan lebih dari 1 karakter" do
      expect { C.char_to_num("a") }.to raise_error(ArgumentError, /bukan huruf A-Z/)
      expect { C.char_to_num("1") }.to raise_error(ArgumentError, /bukan huruf A-Z/)
      expect { C.char_to_num("AB") }.to raise_error(ArgumentError, /butuh 1 karakter/)
    end
  end

  describe ".mod" do
    it "selalu non-negatif" do
      expect(C.mod(-1, 26)).to eq(25)
      expect(C.mod(-27, 26)).to eq(25)
      expect(C.mod(27, 26)).to eq(1)
      expect(C.mod(0, 26)).to eq(0)
    end

    it "menolak modulus <= 0" do
      expect { C.mod(5, 0) }.to raise_error(ArgumentError, /modulus harus > 0/)
      expect { C.mod(5, -3) }.to raise_error(ArgumentError, /modulus harus > 0/)
    end
  end

  describe ".to_base64 / .from_base64 (Sp4)" do
    it "round-trip byte 0x00..0xFF tetap identik" do
      bytes = (0..255).to_a
      expect(C.from_base64(C.to_base64(bytes))).to eq(bytes)
    end

    it "cocok dengan hasil standar Ruby untuk data pendek" do
      # Referensi independen: pack("m0") = base64 standar tanpa newline.
      [ "", "f", "fo", "foo", "foob", "fooba", "foobar" ].each do |s|
        bytes = s.bytes
        expect(C.to_base64(bytes)).to eq([s].pack("m0"))
      end
    end

    it "menambah padding '=' sesuai panjang" do
      expect(C.to_base64([])).to eq("")
      expect(C.to_base64([65])).to eq("QQ==")
      expect(C.to_base64([65, 66])).to eq("QUI=")
      expect(C.to_base64([65, 66, 67])).to eq("QUJD")
    end

    it "mengabaikan karakter di luar alfabet base64 (lenient, sama seperti TS)" do
      expect(C.from_base64("Q Q= =")).to eq([65])
      expect(C.from_base64("!!!")).to eq([])
    end

    it "byte biner tinggi (0xFF, 0xFE) tidak rusak" do
      expect(C.from_base64(C.to_base64([255, 254, 0, 128]))).to eq([255, 254, 0, 128])
    end
  end

  describe "konversi byte <-> string" do
    it "latin1: 1 char = 1 byte, termasuk byte > 0x7F" do
      bytes = [0, 65, 200, 255]
      expect(C.bytes_to_latin1(bytes).bytes).to eq(bytes)
      expect(C.latin1_to_bytes(C.bytes_to_latin1(bytes))).to eq(bytes)
    end

    it "utf8 round-trip teks Indonesia" do
      s = "Serang subuh — kriptografi!"
      expect(C.bytes_to_utf8(C.utf8_to_bytes(s))).to eq(s)
    end

    it "utf8: byte rusak diganti U+FFFD (sama seperti TextDecoder/TextEncoder)" do
      # 0xFF tidak valid sebagai UTF-8.
      expect(C.bytes_to_utf8([0xFF, 0x41])).to eq("\uFFFDA")
    end

    it "hex round-trip" do
      bytes = [0, 15, 16, 255]
      expect(C.bytes_to_hex(bytes)).to eq("000f10ff")
      expect(C.hex_to_bytes("000f10ff")).to eq(bytes)
      expect(C.hex_to_bytes("00 0F-10:ff")).to eq(bytes)
    end
  end

  describe ".gcd / .mod_inverse" do
    it "gcd sesuai contoh soal (Affine)" do
      expect(C.gcd(5, 26)).to eq(1)
      expect(C.gcd(13, 26)).to eq(13)
      expect(C.gcd(-4, 26)).to eq(2)
    end

    it "mod_inverse benar untuk semua a valid Affine" do
      [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].each do |a|
        inv = C.mod_inverse(a, 26)
        expect((a * inv) % 26).to eq(1), "a=#{a} inv=#{inv}"
      end
    end

    it "mod_inverse melempar error kalau tidak koprima" do
      expect { C.mod_inverse(2, 26) }.to raise_error(ArgumentError, /tidak ada invers/)
      expect { C.mod_inverse(13, 26) }.to raise_error(ArgumentError, /tidak ada invers/)
    end
  end

  describe "matriks" do
    let(:m3) { [[6, 24, 1], [13, 16, 10], [20, 17, 15]] }
    let(:m2) { [[3, 3], [2, 5]] }

    it "det_mod sesuai contoh buku Hill (det = 441 -> 25 mod 26)" do
      # det = 6*(16*15-10*17) - 24*(13*15-10*20) + 1*(13*17-16*20) = 441
      expect(C.det_raw(m3)).to eq(441)
      expect(C.det_mod(m3, 26)).to eq(25)
      expect(C.det_mod(m2, 26)).to eq(9)
    end

    it "mat_mul_mod" do
      expect(C.mat_mul_mod([[1, 2], [3, 4]], [[5], [6]], 26)).to eq([[17], [13]])
    end

    it "transpose" do
      expect(C.transpose([[1, 2, 3], [4, 5, 6]])).to eq([[1, 4], [2, 5], [3, 6]])
    end

    it "invert_matrix_mod menghasilkan identitas saat dikalikan" do
      inv = C.invert_matrix_mod(m3, 26)
      product = C.mat_mul_mod(m3, inv, 26)
      identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      expect(product).to eq(identity)
    end

    it "invert_matrix_mod menolak matriks singular mod 26" do
      # det = 0 -> tidak punya invers
      expect { C.invert_matrix_mod([[1, 2], [2, 4]], 26) }.to raise_error(ArgumentError, /tidak punya invers/)
    end

    it "assert_square menerima matriks persegi" do
      expect { C.assert_square(m2) }.not_to raise_error
    end

    it "assert_square menolak matriks kosong & tidak persegi (pesan menyebut baris)" do
      expect { C.assert_square([]) }.to raise_error(ArgumentError, /Matriks kosong/)
      expect { C.assert_square([[1, 2, 3], [4, 5]]) }
        .to raise_error(ArgumentError, /baris 1 berisi 3 elemen/)
    end
  end

  describe ".pad_block" do
    it "menambah padding sampai kelipatan n" do
      expect(C.pad_block([1, 2, 3], 2)).to eq([1, 2, 3, 0])
      expect(C.pad_block([1, 2, 3, 4], 2)).to eq([1, 2, 3, 4])
    end

    it "memakai filler yang diberikan (cipher 26 huruf pakai 'X' = 88)" do
      expect(C.pad_block([65, 66, 67], 2, 88)).to eq([65, 66, 67, 88])
    end

    it "tidak memodifikasi array masukan" do
      data = [1, 2, 3]
      C.pad_block(data, 2)
      expect(data).to eq([1, 2, 3])
    end

    it "menolak n <= 0" do
      expect { C.pad_block([1], 0) }.to raise_error(ArgumentError, /n harus > 0/)
    end
  end

  describe ".alpha_to_bytes" do
    it "huruf -> byte ASCII" do
      expect(C.alpha_to_bytes("ABC")).to eq([65, 66, 67])
    end
  end
end
