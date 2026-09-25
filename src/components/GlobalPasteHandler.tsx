"use client";

import { useEffect, useState } from "react";
import { Clipboard, Check } from "lucide-react";

export function GlobalPasteHandler() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If user is typing inside an editable field, allow normal paste
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (!e.clipboardData) return;

      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("tool-paste-files", { detail: { files } })
        );
        showToast(`Pasted ${files.length} file${files.length > 1 ? "s" : ""} from clipboard`);
        return;
      }

      const text = e.clipboardData.getData("text");
      if (text && text.trim().length > 0) {
        // Dispatch custom text paste event
        window.dispatchEvent(
          new CustomEvent("tool-paste-text", { detail: { text } })
        );
      }
    };

    const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2500);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-surface-raised border border-border shadow-xl rounded-2xl text-sm font-medium text-text-primary animate-fade-up">
      <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center">
        <Clipboard className="w-3.5 h-3.5" />
      </div>
      <span>{toastMessage}</span>
    </div>
  );
}
