"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import * as LucideIcons from "lucide-react";
import type { Tool } from "@/data/tools";

export function CategoryPageClient({
  category,
  items,
}: {
  category: { id: string; label: string; icon: string; color: string };
  items: Tool[];
}) {
  const Icon = (LucideIcons as any)[category.icon] || LucideIcons.Folder;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Tools
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${category.color}12` }}>
          <Icon className="w-6 h-6" style={{ color: category.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">{category.label}</h1>
          <p className="text-sm text-text-secondary">{items.length} tools</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
