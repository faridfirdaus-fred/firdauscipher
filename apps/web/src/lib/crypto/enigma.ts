/**
 * enigma.ts — Enigma Cipher (Bonus 1, h).
 *
 * Model: Enigma I, 3 rotor, reflector B, plugboard opsional, ring setting
 * (Ringstellung) + posisi awal (Grundstellung) bisa diatur.
 *
 * Wiring rotor & reflector diambil dari Enigma I asli (data publik standar,
 * bukan kode pihak ketiga — implementasi stepping & jalur sinyal ditulis sendiri).
 *
 * Stepping WAJIB benar termasuk double-stepping rotor tengah (§10 no.4).
 */

import { sanitize26 } from "./core";

export const ROTOR_WIRING: Record<string, string> = {
  I: "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
  II: "AJDKSIRUXBLHWTMCQGZNPYFVOE",
  III: "BDFHJLCPRTXVZNYEIWGAKMUSQO",
  IV: "ESOVPZJAYQUIRHXLNFTGKDCMWB",
  V: "VZBRGITYUPSDNHLXAWMJQOFECK",
};

/** Posisi notch: rotor berputar ke berikutnya saat keluar dari huruf ini. */
export const ROTOR_NOTCH: Record<string, string> = {
  I: "Q",
  II: "E",
  III: "V",
  IV: "J",
  V: "Z",
};

export const REFLECTOR_WIRING: Record<string, string> = {
  A: "EJMZALYXVBWFCRQUONTSPIKHGD",
  B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
  C: "FVPJIAOYEDRZXWGCTKUQSBNMHL",
};

export interface EnigmaConfig {
  /** Tiga rotor dari kiri ke kanan, mis. ["I","II","III"]. */
  rotors: [string, string, string];
  /** Reflector: "A" | "B" | "C". */
  reflector: string;
  /** Ringstellung (ring setting) 3 huruf, mis. "AAA". */
  ring: string;
  /** Grundstellung (posisi awal) 3 huruf, mis. "AAA". */
  position: string;
  /** Plugboard: pasangan huruf, mis. "AB CD" atau ["AB","CD"]. */
  plugboard?: string | string[];
}

export const DEFAULT_ENIGMA: EnigmaConfig = {
  rotors: ["I", "II", "III"],
  reflector: "B",
  ring: "AAA",
  position: "AAA",
  plugboard: "",
};

function toIndex(ch: string): number {
  return ch.toUpperCase().charCodeAt(0) - 65;
}

/** Parse plugboard jadi peta dua arah (0-25). */
function buildPlugboard(plug: string | string[] | undefined): number[] {
  const map = Array.from({ length: 26 }, (_, i) => i);
  if (!plug) return map;
  const pairs = Array.isArray(plug) ? plug : plug.split(/[\s,;]+/);
  for (const pair of pairs) {
    const clean = pair.replace(/[^A-Za-z]/g, "").toUpperCase();
    if (clean.length !== 2) {
      if (clean.length === 0) continue;
      throw new Error(`Pasangan plugboard "${pair}" tidak valid (harus 2 huruf berbeda).`);
    }
    const a = toIndex(clean[0]);
    const b = toIndex(clean[1]);
    if (a === b) throw new Error(`Plugboard "${pair}" menghubungkan huruf yang sama.`);
    map[a] = b;
    map[b] = a;
  }
  return map;
}

/** Mesin Enigma — state rotor disimpan, satu huruf per langkah. */
export class EnigmaMachine {
  private rotorIdx: number[] = [0, 0, 0];
  private ringIdx: number[] = [0, 0, 0];
  private readonly wiring: string[];
  private readonly notch: number[];
  private readonly reflector: string;
  private readonly plugboard: number[];

  constructor(config: EnigmaConfig) {
    const { rotors } = config;
    for (const r of rotors) {
      if (!(r in ROTOR_WIRING)) {
        throw new Error(`Rotor "${r}" tidak dikenal. Pilih: ${Object.keys(ROTOR_WIRING).join(", ")}.`);
      }
    }
    if (!(config.reflector in REFLECTOR_WIRING)) {
      throw new Error(`Reflector "${config.reflector}" tidak dikenal (A, B, atau C).`);
    }
    const ring = sanitize26(config.ring);
    const pos = sanitize26(config.position);
    if (ring.length !== 3) throw new Error(`Ring setting harus 3 huruf (dapat "${config.ring}").`);
    if (pos.length !== 3) throw new Error(`Posisi awal harus 3 huruf (dapat "${config.position}").`);

    this.wiring = rotors.map((r) => ROTOR_WIRING[r]);
    this.notch = rotors.map((r) => toIndex(ROTOR_NOTCH[r]));
    this.reflector = REFLECTOR_WIRING[config.reflector];
    this.plugboard = buildPlugboard(config.plugboard);
    this.ringIdx = [...ring].map(toIndex);
    this.rotorIdx = [...pos].map(toIndex);
  }

  /** Posisi rotor saat ini sebagai 3 huruf (untuk ditampilkan/diuji). */
  get position(): string {
    return this.rotorIdx.map((i) => String.fromCharCode(i + 65)).join("");
  }

  /**
   * Putar rotor sebelum huruf diproses (stepping Enigma asli).
   *
   * Aturannya: rotor tengah ikut berputar kalau rotor kanan berada di notch
   * ATAU rotor tengah sendiri berada di notch (inilah *double-stepping*).
   */
  private step(): void {
    const atNotch = (i: number) => this.rotorIdx[i] === this.notch[i];
    if (atNotch(1)) {
      // double-step: tengah dan kiri berputar
      this.rotorIdx[1] = (this.rotorIdx[1] + 1) % 26;
      this.rotorIdx[0] = (this.rotorIdx[0] + 1) % 26;
    } else if (atNotch(2)) {
      this.rotorIdx[1] = (this.rotorIdx[1] + 1) % 26;
    }
    this.rotorIdx[2] = (this.rotorIdx[2] + 1) % 26;
  }

  /** Jalur sinyal maju melalui satu rotor (kanan -> kiri). */
  private forward(i: number, c: number): number {
    const offset = this.rotorIdx[i] - this.ringIdx[i];
    const input = ((c + offset) % 26 + 26) % 26;
    const wired = this.wiring[i].charCodeAt(input) - 65;
    return ((wired - offset) % 26 + 26) % 26;
  }

  /** Jalur sinyal balik melalui satu rotor (kiri -> kanan). */
  private backward(i: number, c: number): number {
    const offset = this.rotorIdx[i] - this.ringIdx[i];
    const input = ((c + offset) % 26 + 26) % 26;
    const wired = this.wiring[i].indexOf(String.fromCharCode(input + 65));
    if (wired < 0) throw new Error(`Wiring rotor ${i} rusak`);
    return ((wired - offset) % 26 + 26) % 26;
  }

  /** Proses SATU huruf (huruf besar A-Z). */
  private encodeChar(ch: string): string {
    this.step();
    let c = toIndex(ch);
    c = this.plugboard[c]; // plugboard masuk
    c = this.forward(2, c);
    c = this.forward(1, c);
    c = this.forward(0, c);
    c = this.reflector.charCodeAt(c) - 65; // reflector
    c = this.backward(0, c);
    c = this.backward(1, c);
    c = this.backward(2, c);
    c = this.plugboard[c]; // plugboard keluar
    return String.fromCharCode(c + 65);
  }

  /** Proses seluruh teks. */
  process(text: string): string {
    const clean = sanitize26(text);
    let out = "";
    for (const ch of clean) out += this.encodeChar(ch);
    return out.toLowerCase();
  }
}

/**
 * Enigma — enkripsi.
 *
 * Enigma bersifat involutif: konfigurasi & posisi awal yang sama dipakai
 * untuk enkripsi dan dekripsi. `decryptEnigma` disediakan terpisah supaya
 * pemanggil tidak perlu tahu detail itu.
 */
export function encryptEnigma(text: string, config: EnigmaConfig = DEFAULT_ENIGMA): string {
  return new EnigmaMachine(config).process(text);
}

/** Enigma — dekripsi (mesin baru dengan posisi awal yang sama). */
export function decryptEnigma(text: string, config: EnigmaConfig = DEFAULT_ENIGMA): string {
  return new EnigmaMachine(config).process(text);
}
