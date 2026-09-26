"use client";

import { type ReactNode, useState, useRef, useEffect } from "react";
import { Download, Copy, Check, CheckCircle2, Loader2, RotateCcw, Send, ChevronRight, AlertTriangle, Inbox } from "lucide-react";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { getCompatibleTargets, type WorkflowOutputType } from "@/data/workflow";
import { tools } from "@/data/tools";
import { ContinueWithShelf } from "@/components/ContinueWithShelf";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import Link from "next/link";

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
  const [succeeded, setSucceeded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { sendOutput, pending } = useWorkflowStore();
  const { toast } = useToast();

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
    try {
      await onCopy();
      setCopied(true);
      toast({ tone: "success", title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ tone: "error", title: "Copy failed", description: "Please try again." });
    }
  };

  const handleDownload = () => {
    if (!onDownload) return;
    onDownload();
    setSucceeded(true);
    toast({ tone: "success", title: "File processed", description: downloadLabel ? `${downloadLabel} started.` : "Your download started." });
  };

  useEffect(() => {
    if (error) toast({ tone: "error", title: "Something went wrong", description: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Reset the success state when a new result cycle begins
  useEffect(() => {
    if (!children) setSucceeded(false);
  }, [children]);

  const handleSendOutput = () => {
    const output = pending;
    if (!output || !sourceToolSlug) return;
    sendOutput(output);
    setSendOpen(false);
  };

  const targets = sourceToolSlug && outputType ? getCompatibleTargets(outputType).filter((s) => s !== sourceToolSlug) : [];

  // Determine the current primary action for the mobile sticky bottom bar
  const stickAction = onDownload
    ? { label: downloadLabel || "Download", onClick: handleDownload, icon: Download }
    : onAction
      ? { label: actionLabel || "Process", onClick: onAction, icon: null }
      : null;

  return (
    <div className="mt-6">
      {!children && !loading && !error && onAction && (
        <div>
          <Button onClick={onAction} size="lg" className="w-full sm:w-auto">
            {actionLabel || "Process"}
          </Button>
        </div>
      )}

      {!children && !loading && !error && !onAction && (
        <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-border-soft bg-surface px-5 py-4">
          <span className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-surface-hover shrink-0">
            <Inbox className="w-4 h-4 text-text-secondary" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">No file selected yet</p>
            <p className="text-xs text-text-secondary mt-0.5">Drop a file above or click to browse to get started.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-text-secondary bg-surface rounded-[18px] px-5 py-4 border border-border-soft shadow-resting" role="status" aria-live="polite">
          <Loader2 className="w-5 h-5 animate-spin text-accent shrink-0" aria-hidden="true" />
          <span>{loadingLabel || "Processing..."}</span>
          <span className="ml-auto hidden sm:block h-1.5 w-32 overflow-hidden rounded-full bg-surface-hover">
            <span className="block h-full w-1/2 rounded-full bg-accent animate-pulse" />
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 text-sm bg-error-soft px-4 py-3.5 rounded-[18px] border border-error-border" role="alert">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">Something went wrong</p>
            <p className="text-error-text mt-0.5 leading-relaxed">{error}</p>
            {onAction && (
              <Button variant="secondary" size="sm" onClick={onAction} className="mt-2.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </Button>
            )}
          </div>
        </div>
      )}

      {children && !loading && (
        <div className="space-y-4">
          {(succeeded || onDownload) && (
            <div className="flex items-center gap-2.5 rounded-[18px] border border-success-border bg-success-soft px-4 py-3" role="status">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold text-text-primary">
                {succeeded ? "Done — your file is ready" : "Ready when you are"}
              </p>
            </div>
          )}
          <div className="relative bg-surface rounded-[18px] border border-border-soft shadow-resting p-4 sm:p-5">
            {children}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 pt-4 border-t border-border-soft">
              {onDownload && (
                <Button onClick={handleDownload} variant={succeeded ? "success" : "primary"} className="w-full sm:w-auto">
                  {succeeded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {succeeded ? "Download again" : downloadLabel || "Download"}
                </Button>
              )}
              {onCopy && (
                <Button variant="secondary" onClick={handleCopy} className="w-full sm:w-auto min-h-[44px]">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : copyLabel || "Copy"}
                </Button>
              )}

              {targets.length > 0 && (
                <div className="relative sm:ml-auto w-full sm:w-auto" ref={dropdownRef}>
                  <Button variant="secondary" onClick={() => setSendOpen(!sendOpen)} className="w-full sm:w-auto min-h-[44px]">
                    <Send className="w-4 h-4" />
                    Send to...
                  </Button>
                  {sendOpen && (
                    <div className="absolute right-0 top-full mt-1 w-full sm:w-56 bg-surface-raised rounded-2xl shadow-xl border border-border z-50 py-1 max-h-60 overflow-y-auto">
                      {targets.map((slug) => {
                        const t = tools.find((tool) => tool.slug === slug);
                        if (!t) return null;
                        return (
                          <Link
                            key={slug}
                            href={`/tools/${slug}`}
                            onClick={handleSendOutput}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors min-h-[44px]"
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
                <Button variant="ghost" onClick={onReset} className="w-full sm:w-auto min-h-[44px]">
                  <RotateCcw className="w-4 h-4" />
                  {resetLabel || "Start Over"}
                </Button>
              )}
            </div>
          </div>

          {sourceToolSlug && outputType && (
            <ContinueWithShelf sourceSlug={sourceToolSlug} outputType={outputType} compact />
          )}
        </div>
      )}

      {/* Mobile sticky bottom action bar */}
      {stickAction && !loading && !error && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-2xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.6rem)" }}
        >
          <button
            onClick={stickAction.onClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-accent text-white rounded-xl hover:opacity-90 active:scale-[0.98] text-sm font-semibold transition-all shadow-md min-h-[48px] cursor-pointer"
          >
            {stickAction.icon && <stickAction.icon className="w-4 h-4" />}
            {stickAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
