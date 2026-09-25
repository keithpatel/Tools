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
        <section className="mt-8 pt-6 border-t border-border-soft" aria-label="Frequently asked questions">
          <h2 className="text-[15px] font-heading font-semibold tracking-tight mb-3">Frequently Asked Questions</h2>
          <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting divide-y divide-border-soft px-5">
            {faq.map((item, i) => (
              <details key={i} className="group py-3">
                <summary className="flex items-center justify-between gap-2 text-sm font-medium text-text-primary cursor-pointer list-none min-h-[36px] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-text-secondary text-lg leading-none shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="text-sm text-text-secondary leading-relaxed mt-1.5 pr-6">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
