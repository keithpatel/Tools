import Link from "next/link";
import type { Metadata } from "next";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Guides — Free How-Tos | MultiTool" },
  description: "Step-by-step guides for merging PDFs, compressing files, formatting JSON, and more. All private and in-browser.",
  alternates: { canonical: `${SITE_URL}/guides` },
};

export default function GuidesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
      <p className="text-text-secondary mt-2 mb-6">Short how-tos that link straight into the right tool.</p>
      <div className="grid gap-3">
        {guides.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="rounded-[18px] border border-border-soft bg-surface p-5 hover:border-accent/40 hover:shadow-hover transition-all">
            <h2 className="font-bold">{g.title}</h2>
            <p className="text-sm text-text-secondary mt-1">{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
