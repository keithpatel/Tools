"use client";

import { type ReactNode } from "react";

export function ToolLayout({
  title: _title,
  description: _description,
  children,
  faq,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  faq?: { q: string; a: string }[];
}) {
  return (
    <div>
      <div className="min-h-[300px]">{children}</div>

      {faq && faq.length > 0 && (
        <section className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-border-soft">
          <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 sm:mb-5">Frequently Asked Questions</h2>
          <div className="space-y-4 sm:space-y-6">
            {faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-heading font-medium text-sm sm:text-base mb-1">{item.q}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
