"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export class ToolErrorBoundary extends Component<{ children: ReactNode; toolName?: string }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : "Something went wrong while running this tool." };
  }

  componentDidCatch() {}

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-start gap-3 text-sm bg-error-soft px-4 py-3.5 rounded-[18px] border border-error-border" role="alert">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">{this.props.toolName ?? "Tool"} crashed</p>
            <p className="text-error-text mt-0.5 leading-relaxed break-words">{this.state.error}</p>
            <p className="text-xs text-text-secondary mt-1">Your files never left this device. Try smaller files or reload.</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold hover:bg-surface-hover transition-colors min-h-[36px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
