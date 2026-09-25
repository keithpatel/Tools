import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ShortcutCheatSheet } from "@/components/ShortcutCheatSheet";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PageTransition } from "@/components/PageTransition";
import { WorkflowProvider } from "@/lib/useWorkflowStore";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { GlobalPasteHandler } from "@/components/GlobalPasteHandler";

const headingFont = Geist({
  variable: "--font-geist-heading",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-geist-body",
  subsets: ["latin"],
  display: "swap",
});

import { tools } from "@/data/tools";
import { SITE_URL, TITLE_TEMPLATE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `MultiTool — ${tools.length} Free Online Tools That Run in Your Browser`,
    template: TITLE_TEMPLATE,
  },
  description: `${tools.length} free, privacy-first browser tools for PDF, images, text, video, development, and everyday tasks. All processing happens locally — files never leave your device.`,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "MultiTool",
    url: "/",
    title: `MultiTool — ${tools.length} Free Online Tools That Run in Your Browser`,
    description: `${tools.length} free, privacy-first tools. No uploads, no signup — everything runs in your browser.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `MultiTool — ${tools.length} Free Online Tools`,
    description: `${tools.length} free, privacy-first tools. No uploads, no signup — everything runs in your browser.`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="theme-color" content="#5555e6" />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <WorkflowProvider>
            <GlobalNav />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <InstallPrompt />
            <ShortcutCheatSheet />
            <OnboardingTooltip />
            <ServiceWorkerRegister />
            <GlobalPasteHandler />
          </WorkflowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
