"use client";

/**
 * site-nav.tsx — bilah navigasi atas.
 *
 * Isi: nama aplikasi (tautan ke Home), tautan Home & Docs, dan tombol menuju
 * repositori GitHub. Semua tautan diambil dari `@/lib/site` supaya tidak ada
 * URL yang ditulis ulang di beberapa tempat.
 */

import { Github } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GITHUB_URL, NAV, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {SITE_NAME}
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navigasi utama">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <Button asChild variant="outline" size="sm">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
