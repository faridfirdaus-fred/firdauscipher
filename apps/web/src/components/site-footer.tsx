import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GITHUB_URL, GITHUB_USER } from "@/lib/site";

/** Footer minimal: hanya identitas GitHub dan tombol menuju repositori. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6">
        <p className="text-muted-foreground">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {GITHUB_USER}
          </a>
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            <Github className="h-3.5 w-3.5" />
            Lihat repositori
          </a>
        </Button>
      </div>
    </footer>
  );
}
