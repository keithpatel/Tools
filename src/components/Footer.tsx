import Link from "next/link";
import { tools } from "@/data/tools";
import { ShieldCheck } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { DataExport } from "./DataExport";

export function Footer() {
  return (
    <footer className="border-t border-border-soft mt-12 sm:mt-20 bg-surface pb-28 md:pb-14">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Wordmark />
            <nav className="flex flex-wrap items-center justify-center gap-1 text-xs" aria-label="Footer">
              {[
                { label: "All Tools", href: "/" },
                { label: "Guides", href: "/guides" },
                { label: "About", href: "/about" },
                { label: "Privacy", href: "/about" },
                { label: "Contact", href: "/about" },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="px-3 py-2 min-h-[36px] inline-flex items-center rounded-full text-text-secondary hover:text-accent hover:bg-surface-hover transition-all duration-200 ease-out font-medium"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="text-center space-y-2 mt-6">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success-text bg-success-soft border border-success-border rounded-full px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              All processing happens locally in your browser. No files are uploaded to any server.
            </p>
            <p className="text-xs text-text-secondary/60">{tools.length} free, privacy-first online tools.</p>
            <div className="flex justify-center">
              <DataExport />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
