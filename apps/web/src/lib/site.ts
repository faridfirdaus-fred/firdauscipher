/** Konstanta situs: identitas, tautan, dan navigasi.
 *
 * Dikumpulkan di satu tempat supaya navbar, footer, dan halaman dokumentasi
 * tidak pernah berbeda isi.
 */

export const SITE_NAME = "FirdausCipher";

export const GITHUB_USER = "faridfirdaus-fred";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}/firdauscipher`;

export const TAGLINE =
  "Cipher klasik, dihitung di browser Anda. Setiap algoritme ditulis dari nol tanpa library enkripsi pihak ketiga.";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
] as const;
