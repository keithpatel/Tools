import { notFound } from "next/navigation";
import { tools, getToolBySlug } from "@/data/tools";
import { ToolPageClient } from "./client";
import { toolMeta } from "@/components/ToolMeta";
import type { Metadata } from "next";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found" };

  const meta = toolMeta[slug];
  const title = meta?.title || `${tool.name} — Free Online Tool`;
  const description = meta?.description || tool.description;

  return {
    title,
    description,
    openGraph: {
      title: meta?.ogTitle || title,
      description: meta?.ogDesc || description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta?.ogTitle || title,
      description: meta?.ogDesc || description,
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return <ToolPageClient slug={slug} />;
}
