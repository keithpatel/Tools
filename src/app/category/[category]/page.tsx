import { notFound } from "next/navigation";
import { categories, getToolsByCategory, type CategoryId } from "@/data/tools";
import { CategoryPageClient } from "./client";
import { categoryMeta, categoryUrl } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return categories.map((cat) => ({ category: cat.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: catSlug } = await params;
  const meta = categoryMeta(catSlug);
  if (!meta) return { title: "Category Not Found" };
  const url = categoryUrl(catSlug);
  return {
    // Absolute: category titles already end with "| MultiTool"-style branding
    // via categoryMeta; do not let the layout template suffix them twice.
    title: { absolute: `${meta.title} | MultiTool` },
    description: meta.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url,
      siteName: "MultiTool",
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: catSlug } = await params;
  const categoryId = catSlug as CategoryId;
  const category = categories.find((c) => c.id === categoryId);

  if (!category) notFound();

  const items = getToolsByCategory(categoryId);
  return <CategoryPageClient category={category} items={items} />;
}
