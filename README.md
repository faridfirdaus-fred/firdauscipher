# FirdausCipher

Lab cipher klasik berbasis web — project UTS Kriptografi.

Implementasi TypeScript (frontend, Cloudflare Workers) + Ruby (backend, Render).

## Struktur

```
apps/web/           Next.js 15 — GUI cipher (deploy: Cloudflare Workers)
apps/api/           Ruby Sinatra — REST API + GUI mini (deploy: Render)
packages/vectors/   Test vectors bersama TS & Ruby
```

## Prasyarat

- Node.js >= 20 (dites di v24.19.0)
- pnpm >= 10 (dites di 12.4.2)
- Ruby 3.3.8
- Bundler 2.5+

## Menjalankan

```bash
pnpm install

# frontend
pnpm dev                 # http://localhost:3000

# backend
cd apps/api
bundle install
pnpm api                 # http://localhost:9292/health
```

### Catatan backend lokal

Di lokal API dijalankan dengan **webrick** (murni Ruby) lewat `apps/api/bin/server`,
supaya tidak perlu `ruby-dev`/compiler. Gem `puma` dan `rubocop` ada di grup
`production` dan `lint`, dan **di-skip di lokal**:

```bash
cd apps/api
bundle config set --local without "production lint"
bundle install
```

Di Render, `bundle config` di atas tidak dipakai sehingga puma ikut terpasang —
lihat `render.yaml` (S24).

### Shims bundler (kalau `bundle: command not found`)

Ubuntu menaruh bundler sebagai `bundle3.3`/`bundler3.3`, bukan `bundle`:

```bash
ln -sf /usr/bin/bundle3.3   ~/.local/bin/bundle
ln -sf /usr/bin/bundler3.3  ~/.local/bin/bundler
```

## Test

```bash
pnpm test                # vitest (frontend)
pnpm api:test            # rspec (backend)
```

> Dokumentasi lengkap (cara pakai tiap cipher, format file `.dat`, cara deploy)
> ditulis pada S28. Rencana kerja ada di `docs/PLAN.md`.
