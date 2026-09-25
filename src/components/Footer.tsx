import Link from "next/link";
import { categories, tools } from "@/data/tools";
import { Wrench } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-soft mt-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-10">
          {categories.map((cat) => {
            const items = tools.filter((t) => t.category === cat.id);
            return (
              <div key={cat.id}>
                <h3 className="text-xs font-heading font-semibold uppercase tracking-wider mb-3" style={{ color: cat.color }}>
                  {cat.label}
                </h3>
                <ul className="space-y-2">
                  {items.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="text-xs text-text-secondary hover:text-accent transition-colors"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border-soft pt-8 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-sm font-heading font-semibold text-text-primary">
            <Wrench className="w-4 h-4 text-accent" />
            MultiTool
          </div>
          <p className="text-xs text-text-secondary">
            All processing happens locally in your browser. No files are uploaded to any server.
          </p>
          <p className="text-xs text-text-secondary/60">{tools.length} free, privacy-first online tools.</p>
        </div>
      </div>
    </footer>
  );
}
