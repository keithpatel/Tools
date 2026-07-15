"use client";

import { type ReactNode } from "react";

export function ToolLayout({
  title: _title,
  description: _description,
  children,
  faq,
}: {
  title: string;
  description: string;
  children: ReactNode;
  faq?: { q: string; a: string }[];
}) {
  return (
    <div>
      <div className="min-h-[300px]">{children}</div>

      {faq && faq.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-heading font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-medium text-sm mb-1">{item.q}</h3>
                <p className="text-sm text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
