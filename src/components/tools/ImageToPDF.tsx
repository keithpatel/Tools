"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

export default function ImageToPDF() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tools/images-to-pdf");
  }, [router]);

  return (
    <div className="max-w-md mx-auto my-12 p-8 text-center bg-surface border border-border-soft rounded-2xl shadow-sm">
      <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-heading font-semibold mb-2">Redirecting to Images to PDF</h2>
      <p className="text-xs text-text-secondary mb-6 leading-relaxed">
        This tool has been merged into our comprehensive, multi-image PDF creator.
      </p>
      <Link
        href="/tools/images-to-pdf"
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Go to Images to PDF
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
