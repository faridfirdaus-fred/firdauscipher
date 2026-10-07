export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          FirdausCipher
        </h1>
        <p className="text-muted-foreground">
          Lab cipher klasik berbasis web. Scaffold S01 selesai — antarmuka
          cipher menyusul di S16.
        </p>
      </header>

      <ul className="grid gap-2 text-sm">
        {[
          "a) Vigenere Cipher standard (26 huruf)",
          "b) Auto-Key Vigenere Cipher (26 huruf)",
          "c) Extended Vigenere Cipher (256 karakter ASCII)",
          "d) Playfair Cipher (26 huruf)",
          "e) Affine Cipher (26 huruf)",
          "f) Hill Cipher (26 huruf)",
          "g) Super enkripsi: Extended Vigenere + transposisi kolom",
          "h) Bonus 1: Enigma cipher",
        ].map((item) => (
          <li
            key={item}
            className="rounded-lg border border-border bg-card px-4 py-3 text-card-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </main>
  );
}
