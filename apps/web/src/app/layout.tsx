import type { Metadata } from "next";
import "./globals.css";

// Font memakai tumpukan font SISTEM (lihat globals.css: --font-sans / --font-mono).
// Sengaja TIDAK memakai next/font/google supaya:
//   1. `pnpm build` berhasil TANPA internet (demo di kelas tanpa wifi tetap jalan),
//   2. tidak ada permintaan ke fonts.googleapis.com saat build maupun saat dipakai.
export const metadata: Metadata = {
  title: "FirdausCipher — Lab Cipher Klasik",
  description:
    "Antarmuka web untuk enkripsi & dekripsi cipher klasik: Vigenere, Auto-Key Vigenere, Extended Vigenere, Playfair, Affine, Hill, Super Enkripsi, dan Enigma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
