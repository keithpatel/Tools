import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { getPopularTools, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | MultiTool — Free Online Tools",
  description: "The page you are looking for does not exist. Browse 60+ free online tools instead.",
  robots: { index: false, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function NotFound() {
  const popular = getPopularTools();
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
      <p className="text-sm font-medium text-accent mb-2">404 — Page not found</p>
      <h1 className="text-4xl font-heading font-bold mb-4">This page does not exist</h1>
      <p className="text-text-secondary mb-6">
        The link may be broken, or the page may have moved. Try one of our most popular free tools below.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {popular.map((tool) => {
          const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border-soft bg-surface text-sm hover:border-accent/40 hover:bg-accent/5 transition-all"
            >
              <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
              {tool.name}
            </Link>
          );
        })}
      </div>
      <Link href="/" className="text-accent hover:underline text-sm font-medium">
        ← Back to all free tools
      </Link>
    </div>
  );
}
