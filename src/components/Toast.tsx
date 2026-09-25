"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastContext = createContext<{ toast: (t: Omit<ToastItem, "id">) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

const toneStyles: Record<ToastTone, { icon: typeof Info; classes: string; iconClass: string }> = {
  success: {
    icon: CheckCircle2,
    classes: "bg-success-soft border-success-border text-success-text",
    iconClass: "text-success",
  },
  error: {
    icon: AlertTriangle,
    classes: "bg-error-soft border-error-border text-error-text",
    iconClass: "text-error",
  },
  info: {
    icon: Info,
    classes: "bg-info-soft border-info-border text-info-text",
    iconClass: "text-info",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3600);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-3 md:right-6 z-[70] flex flex-col gap-2 w-[calc(100vw-1.5rem)] max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {items.map((item) => {
            const tone = toneStyles[item.tone];
            const Icon = tone.icon;
            return (
              <motion.div
                key={item.id}
                role="status"
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 6 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-4 py-3 shadow-modal backdrop-blur-md ${tone.classes}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${tone.iconClass}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="p-1.5 -m-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
