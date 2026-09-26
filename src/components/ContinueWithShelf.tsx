"use client";

import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getToolSuggestions, getCompatibleTargets, type WorkflowOutputType } from "@/data/workflow";
import { getToolBySlug, categories } from "@/data/tools";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export function ContinueWithShelf({
  sourceSlug,
  outputType,
  compact = false,
}: {
  sourceSlug: string;
  outputType: WorkflowOutputType;
  compact?: boolean;
}) {
  const { sendOutput, pending } = useWorkflowStore();
  const suggestions = getToolSuggestions(sourceSlug, outputType, 3);
  const rest = getCompatibleTargets(outputType).filter((s) => s !== sourceSlug && !suggestions.includes(s));

  if (suggestions.length === 0) return null;

  const forward = () => {
    if (pending) sendOutput(pending); // re-assert so target's consumeOutput picks it up
  };

  return (
    <section
      aria-label="Continue with"
      className={compact ? "mt-3" : "mt-4 rounded-[18px] border border-border-soft bg-surface shadow-resting p-4 sm:p-5"}
    >
      <h2 className="text-[15px] font-heading font-semibold tracking-tight flex items-center gap-2">
        <LucideIcons.ArrowRight className="w-4 h-4 text-accent" aria-hidden="true" />
        Continue with →
      </h2>
      <p className="text-xs text-text-secondary mt-0.5 mb-3">Send this output to another tool — no re-upload needed.</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((slug) => {
          const t = getToolBySlug(slug);
          if (!t) return null;
          const cat = categories.find((c) => c.id === t.category);
          const Icon = ((LucideIcons as unknown as Record<string, LucideIcon>)[t.icon] || LucideIcons.File) as LucideIcon;
          return (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              onClick={forward}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-border-soft bg-surface-hover hover:border-accent/50 hover:bg-accent/5 text-sm font-medium transition-all min-h-[40px]"
            >
              <Icon className="w-4 h-4" style={{ color: cat?.color }} aria-hidden="true" />
              {t.name}
            </Link>
          );
        })}
      </div>
      {rest.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-text-secondary cursor-pointer hover:text-accent min-h-[32px] inline-flex items-center">
            + {rest.length} more compatible tools
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rest.slice(0, 12).map((slug) => {
              const t = getToolBySlug(slug);
              if (!t) return null;
              return (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  onClick={forward}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-hover text-text-secondary hover:text-accent border border-border-soft transition-colors min-h-[32px] inline-flex items-center"
                >
                  {t.name}
                </Link>
              );
            })}
          </div>
        </details>
      )}
    </section>
  );
}
