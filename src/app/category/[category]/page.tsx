import { notFound } from "next/navigation";
import { categories, getToolsByCategory, type CategoryId } from "@/data/tools";
import { CategoryPageClient } from "./client";

export function generateStaticParams() {
  return categories.map((cat) => ({ category: cat.id }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: catSlug } = await params;
  const categoryId = catSlug as CategoryId;
  const category = categories.find((c) => c.id === categoryId);

  if (!category) notFound();

  const items = getToolsByCategory(categoryId);
  return <CategoryPageClient category={category} items={items} />;
}
