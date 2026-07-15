import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ShortcutCheatSheet } from "@/components/ShortcutCheatSheet";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import { WorkflowProvider } from "@/lib/useWorkflowStore";

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

export const metadata: Metadata = {
  title: "MultiTool — 50 Free Online Tools",
  description: "50 free, privacy-first browser tools for PDF, images, text, development, and everyday tasks. All processing happens locally — files never leave your device.",
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
            <main className="flex-1">{children}</main>
            <Footer />
            <ShortcutCheatSheet />
            <OnboardingTooltip />
          </WorkflowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
