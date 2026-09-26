import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { guides, getGuide } from "@/data/guides";
import { getToolBySlug, tools } from "@/data/tools";
import { SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return { title: "Guide Not Found" };
  return {
    title: { absolute: `${g.title} | MultiTool` },
    description: g.description,
    alternates: { canonical: `${SITE_URL}/guides/${g.slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const tool = getToolBySlug(g.toolSlug);

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: g.title,
    description: g.description,
    step: g.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <Link href="/guides" className="text-xs text-text-secondary hover:text-accent">← All guides</Link>
      <h1 className="text-3xl font-bold tracking-tight mt-2">{g.title}</h1>
      <p className="text-text-secondary mt-2">{g.description}</p>
      <ol className="mt-6 space-y-2.5">
        {g.steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm"><span className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
      {tool && (
        <Link href={`/tools/${tool.slug}`} className="mt-6 inline-flex items-center px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold min-h-[48px]">
          Open {tool.name} →
        </Link>
      )}
      <h2 className="font-bold mt-8 mb-2">FAQ</h2>
      {g.faqs.map((f, i) => (
        <details key={i} className="py-2 border-t border-border-soft">
          <summary className="text-sm font-medium cursor-pointer min-h-[36px]">{f.q}</summary>
          <p className="text-sm text-text-secondary mt-1">{f.a}</p>
        </details>
      ))}
      <p className="text-xs text-text-secondary mt-6">Related: {tools.filter((t) => t.category === tool?.category && t.slug !== tool?.slug).slice(0, 3).map((t) => t.name).join(" · ")}</p>
    </div>
  );
}
