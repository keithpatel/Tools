"use client";

import { getToolBySlug, categories } from "@/data/tools";
import { toolMeta } from "./ToolMeta";
import { SITE_URL, toolUrl, categoryUrl } from "@/lib/seo";

export function StructuredData({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  const meta = toolMeta[slug];

  if (!tool) return null;

  const cat = categories.find((c) => c.id === tool.category);
  const url = toolUrl(slug);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url,
    description: meta?.description || tool.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "MultiTool",
      url: SITE_URL,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat?.label || tool.category,
        item: categoryUrl(tool.category),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: url,
      },
    ],
  };

  const howToSchema =
    meta?.howTo && meta.howTo.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `How to use ${tool.name}`,
          description: meta.description,
          step: meta.howTo.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: step,
            text: step,
          })),
        }
      : null;

  const faqSchema =
    meta?.faq && meta.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: meta.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}

export function HomeStructuredData({ toolCount }: { toolCount: number }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MultiTool",
    url: SITE_URL,
    description: `${toolCount} free online tools that run 100% in your browser. No uploads, no signup.`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MultiTool",
    url: SITE_URL,
    description: "Free, privacy-first online tools that run entirely in your browser.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  );
}
