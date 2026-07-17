"use client";

import { type ReactNode, useState, useRef, useEffect } from "react";
import { Download, Copy, Check, Loader2, RotateCcw, Send, ChevronRight } from "lucide-react";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { getCompatibleTargets, getToolSuggestions, type WorkflowOutputType } from "@/data/workflow";
import { tools } from "@/data/tools";
import Link from "next/link";

function BtnPrimary({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent text-white rounded-xl hover:opacity-90 active:scale-[0.97] text-sm font-medium transition-all shadow-sm ${className || ""}`}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 bg-surface-hover text-text-primary rounded-xl hover:bg-border active:scale-[0.97] text-sm font-medium transition-all ${className || ""}`}
    >
      {children}
    </button>
  );
}

export function ResultPanel({
  loading,
  loadingLabel,
  error,
  onAction,
  actionLabel,
  children,
  onDownload,
  downloadLabel,
  onCopy,
  copyLabel,
  onReset,
  resetLabel,
  sourceToolSlug,
  outputType,
}: {
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  onAction?: () => void;
  actionLabel?: string;
  children?: ReactNode;
  onDownload?: () => void;
  downloadLabel?: string;
  onCopy?: () => void;
  copyLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  sourceToolSlug?: string;
  outputType?: WorkflowOutputType;
}) {
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { sendOutput, pending } = useWorkflowStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSendOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopy = async () => {
    if (!onCopy) return;
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOutput = () => {
    const output = pending;
    if (!output || !sourceToolSlug) return;
    sendOutput(output);
    setSendOpen(false);
  };

  const targets = sourceToolSlug && outputType ? getCompatibleTargets(outputType).filter((s) => s !== sourceToolSlug) : [];
  const suggestions = sourceToolSlug && outputType ? getToolSuggestions(sourceToolSlug, outputType, 3) : [];

  // Determine the current primary action for the mobile sticky bottom bar
  const stickAction = onDownload
    ? { label: downloadLabel || "Download", onClick: onDownload, icon: Download }
    : onAction
      ? { label: actionLabel || "Process", onClick: onAction, icon: null }
      : null;

  return (
    <div className="mt-6">
      {!children && !loading && !error && onAction && (
        <div className="hidden md:block">
          <BtnPrimary onClick={onAction}>{actionLabel || "Process"}</BtnPrimary>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-text-secondary bg-surface-hover rounded-xl px-5 py-4 border border-border-soft">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span>{loadingLabel || "Processing..."}</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-3 rounded-xl border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {children && !loading && (
        <div className="space-y-4">
          <div className="relative bg-surface rounded-xl border border-border-soft p-4">
            {children}

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-soft">
              {onDownload && (
                <BtnPrimary onClick={onDownload}>
                  <Download className="w-4 h-4" />
                  {downloadLabel || "Download"}
                </BtnPrimary>
              )}
              {onCopy && (
                <BtnSecondary onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : copyLabel || "Copy"}
                </BtnSecondary>
              )}

              {targets.length > 0 && (
                <div className="relative ml-auto" ref={dropdownRef}>
                  <BtnSecondary onClick={() => setSendOpen(!sendOpen)}>
                    <Send className="w-4 h-4" />
                    Send to...
                  </BtnSecondary>
                  {sendOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-surface-raised rounded-xl shadow-xl border border-border z-50 py-1">
                      {targets.map((slug) => {
                        const t = tools.find((tool) => tool.slug === slug);
                        if (!t) return null;
                        return (
                          <Link
                            key={slug}
                            href={`/tools/${slug}`}
                            onClick={handleSendOutput}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
                            {t.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {onReset && (
                <button
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {resetLabel || "Start Over"}
                </button>
              )}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="text-sm text-text-secondary">
              <span className="mr-2 text-xs">Suggested next:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {suggestions.map((slug) => {
                  const t = tools.find((tool) => tool.slug === slug);
                  if (!t) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/tools/${slug}`}
                      onClick={handleSendOutput}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-surface-hover rounded-full hover:bg-border text-xs text-text-secondary transition-colors"
                    >
                      {t.name}
                      <Send className="w-3 h-3" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile sticky bottom action bar */}
      {stickAction && !loading && !error && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <button
            onClick={stickAction.onClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-accent text-white rounded-xl hover:opacity-90 active:scale-[0.97] text-sm font-semibold transition-all shadow-lg min-h-[48px]"
          >
            {stickAction.icon && <stickAction.icon className="w-4 h-4" />}
            {stickAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
