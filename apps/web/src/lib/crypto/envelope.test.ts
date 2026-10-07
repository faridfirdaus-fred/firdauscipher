import { describe, expect, it } from "vitest";

import { fromBase64, toBase64 } from "./core";
import {
  CIPHER_ID_NAMES,
  CipherId,
  datFileName,
  MAGIC,
  packEnvelope,
  splitFileName,
  unpackEnvelope,
  VERSION,
  type EnvelopeHeader,
} from "./envelope";

const HEADER: EnvelopeHeader = {
  name: "gambar.jpg",
  ext: "jpg",
  mime: "image/jpeg",
  size: 8,
  mode: "binary",
  params: { key: "rahasia" },
};

function samplePayload(n = 32): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (i * 17 + 3) % 256;
  return out;
}

describe("Envelope KRI1 (S03)", () => {
  it("pack -> unpack mengembalikan metadata identik", () => {
    const payload = samplePayload();
    const packed = packEnvelope(CipherId.VIGENERE, HEADER, payload);
    const { cipher, header, payload: out } = unpackEnvelope(packed);
    expect(cipher).toBe(CipherId.VIGENERE);
    expect(header).toEqual(HEADER);
    expect(out).toEqual(payload);
  });

  it("byte plaintext (payload) tetap utuh byte-per-byte", () => {
    const payload = new Uint8Array(256);
    for (let i = 0; i < 256; i++) payload[i] = i;
    const packed = packEnvelope(CipherId.EXT_VIGENERE, HEADER, payload);
    expect(unpackEnvelope(packed).payload).toEqual(payload);
  });

  it("magic 4 byte pertama adalah 'KRI1'", () => {
    const packed = packEnvelope(CipherId.HILL, HEADER, samplePayload());
    expect(String.fromCharCode(...packed.slice(0, 4))).toBe(MAGIC);
    expect(MAGIC).toBe("KRI1");
  });

  it("version ada di byte ke-4 dan cipher di byte ke-5", () => {
    const packed = packEnvelope(CipherId.PLAYFAIR, HEADER, samplePayload());
    expect(packed[4]).toBe(VERSION);
    expect(packed[5]).toBe(CipherId.PLAYFAIR);
  });

  it("hdrLen adalah uint32 little-endian di byte 6..9", () => {
    const packed = packEnvelope(CipherId.AFFINE, HEADER, samplePayload());
    const view = new DataView(packed.buffer);
    const hdrLen = view.getUint32(6, true);
    const headerJson = new TextDecoder().decode(packed.slice(10, 10 + hdrLen));
    expect(JSON.parse(headerJson)).toEqual(HEADER);
  });

  it("payload kosong tetap bisa di-pack/unpack", () => {
    const packed = packEnvelope(CipherId.ENIGMA, HEADER, new Uint8Array(0));
    expect(unpackEnvelope(packed).payload).toHaveLength(0);
  });

  it("header dengan UTF-8 non-ASCII (nama file Indonesia)", () => {
    const header: EnvelopeHeader = { ...HEADER, name: "laporan-tugas-akhir-ü.jpg" };
    const packed = packEnvelope(CipherId.VIGENERE, header, samplePayload());
    expect(unpackEnvelope(packed).header.name).toBe("laporan-tugas-akhir-ü.jpg");
  });

  it("semua 8 cipher punya nama di CIPHER_ID_NAMES", () => {
    for (const id of Object.values(CipherId)) {
      expect(CIPHER_ID_NAMES[id]).toBeTruthy();
    }
  });

  describe("error yang jelas", () => {
    it("file terlalu pendek", () => {
      expect(() => unpackEnvelope(new Uint8Array(5))).toThrow(/terlalu pendek/);
    });

    it("magic salah", () => {
      const bad = packEnvelope(CipherId.VIGENERE, HEADER, samplePayload());
      bad[0] = 0x58; // 'X'
      expect(() => unpackEnvelope(bad)).toThrow(/Bukan file .dat FirdausCipher/);
    });

    it("versi tidak didukung", () => {
      const bad = packEnvelope(CipherId.VIGENERE, HEADER, samplePayload());
      bad[4] = 9;
      expect(() => unpackEnvelope(bad)).toThrow(/Versi envelope tidak didukung: 9/);
    });

    it("hdrLen melebihi ukuran file", () => {
      const bad = packEnvelope(CipherId.VIGENERE, HEADER, samplePayload());
      new DataView(bad.buffer).setUint32(6, 99999, true);
      expect(() => unpackEnvelope(bad)).toThrow(/Header envelope rusak/);
    });

    it("header bukan JSON", () => {
      const bad = packEnvelope(CipherId.VIGENERE, HEADER, samplePayload());
      // Rusak isi header JSON
      bad[10] = 0x7b; // '{'
      bad[11] = 0x7b; // '{'
      expect(() => unpackEnvelope(bad)).toThrow(/bukan JSON valid/);
    });
  });
});

describe("utilitas nama file", () => {
  it("datFileName menambah .dat", () => {
    expect(datFileName("gambar.jpg")).toBe("gambar.jpg.dat");
    expect(datFileName("data.sqlite")).toBe("data.sqlite.dat");
  });

  it("splitFileName memisahkan nama & ekstensi", () => {
    expect(splitFileName("gambar.jpg")).toEqual({ name: "gambar", ext: "jpg" });
    expect(splitFileName("arsip.tar.gz")).toEqual({ name: "arsip.tar", ext: "gz" });
  });

  it("splitFileName aman untuk file tanpa ekstensi / titik di awal", () => {
    expect(splitFileName("README")).toEqual({ name: "README", ext: "" });
    expect(splitFileName(".gitignore")).toEqual({ name: ".gitignore", ext: "" });
    expect(splitFileName("file.")).toEqual({ name: "file.", ext: "" });
  });

  it("base64 round-trip payload envelope tetap identik", () => {
    const payload = samplePayload(1000);
    const packed = packEnvelope(CipherId.SUPER, HEADER, payload);
    const { payload: out } = unpackEnvelope(packed);
    expect(fromBase64(toBase64(out))).toEqual(payload);
  });
});
