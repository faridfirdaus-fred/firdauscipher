import { describe, expect, it } from "vitest";

import { columnOrder, decryptColumnar, encryptColumnar } from "./columnar";

function bytes(s: string): Uint8Array {
  return new Uint8Array([...s].map((c) => c.charCodeAt(0)));
}
function text(b: Uint8Array): string {
  return [...b].map((c) => String.fromCharCode(c)).join("");
}

describe("Transposisi Kolom (bagian g)", () => {
  it("columnOrder ZEBRAS -> [4,2,1,3,5,0]", () => {
    // Z(0) E(1) B(2) R(3) A(4) S(5) diurutkan menurut huruf:
    // A(4) B(2) E(1) R(3) S(5) Z(0)
    expect(columnOrder("ZEBRAS")).toEqual([4, 2, 1, 3, 5, 0]);
  });

  it("permutasi kolom WEAREDISCOVEREDFLEEATONCE dengan ZEBRAS", () => {
    // 25 huruf / 6 kolom -> 5 baris, jadi 30 byte (5 byte padding 0x00).
    const plain = "WEAREDISCOVEREDFLEEATONCE";
    const ct = encryptColumnar(bytes(plain), "ZEBRAS");
    expect(text(ct)).toHaveLength(30);
    // Grid 5x6 dibaca kolom-per-kolom mengikuti urutan kunci [4,2,1,3,5,0]:
    //   kolom 4 = EVLN·  kolom 2 = ACDT·  kolom 1 = ESEA·
    //   kolom 3 = ROFO·  kolom 5 = DEEC·  kolom 0 = WIREE
    // (· = byte padding 0x00)
    expect(text(ct)).toBe("EVLN\u0000ACDT\u0000ESEA\u0000ROFO\u0000DEEC\u0000WIREE");
    // Tanpa padding, hasilnya sama dengan membaca kolom urut kunci.
    expect(text(ct).replace(/\u0000/g, "")).toBe("EVLNACDTESEAROFODEECWIREE");
  });

  it("round-trip byte acak (termasuk 0x00 dan 0xFF)", () => {
    const data = new Uint8Array(1000);
    for (let i = 0; i < data.length; i++) data[i] = (i * 7 + 3) % 256;
    const ct = encryptColumnar(data, "KUNCI");
    const back = decryptColumnar(ct, "KUNCI");
    // Padding 0x00 di akhir, jadi bandingkan sampai panjang asli.
    expect(back.subarray(0, data.length)).toEqual(data);
  });

  it("padding 0x00 sampai kelipatan panjang kunci", () => {
    const ct = encryptColumnar(bytes("HELLO"), "ABC");
    expect(ct).toHaveLength(6);
  });

  it("kunci kosong -> error", () => {
    expect(() => encryptColumnar(bytes("HI"), "")).toThrow(/kosong/);
  });

  it("data kosong -> hasil kosong", () => {
    expect(encryptColumnar(new Uint8Array(0), "KEY")).toHaveLength(0);
  });

  it("panjang bukan kelipatan kunci saat dekripsi -> error jelas", () => {
    expect(() => decryptColumnar(new Uint8Array(5), "ABC")).toThrow(/bukan kelipatan/);
  });
});
