"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode, type Dispatch, type SetStateAction } from "react";
import type { PendingOutput } from "@/data/workflow";

interface WorkflowContextValue {
  pending: PendingOutput | null;
  setPending: Dispatch<SetStateAction<PendingOutput | null>>;
  sendOutput: (output: PendingOutput) => void;
  consumeOutput: () => PendingOutput | null;
  clear: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function readSessionMeta(): PendingOutput | null {
  return null; // Blobs can't survive reload; session-only by design (privacy)
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [pending, setPendingState] = useState<PendingOutput | null>(null);
  const ref = useRef<PendingOutput | null>(null);

  const setPending: WorkflowContextValue["setPending"] = useCallback((next) => {
    setPendingState((prev) => {
      const resolved = typeof next === "function" ? (next as (p: PendingOutput | null) => PendingOutput | null)(prev) : next;
      ref.current = resolved;
      return resolved;
    });
  }, []);

  const sendOutput = useCallback((output: PendingOutput) => {
    ref.current = output;
    setPendingState(output);
  }, []);

  // Synchronous consume: returns ref value immediately, then clears.
  const consumeOutput = useCallback(() => {
    const val = ref.current ?? readSessionMeta();
    ref.current = null;
    setPendingState(null);
    return val;
  }, []);

  const clear = useCallback(() => {
    ref.current = null;
    setPendingState(null);
  }, []);

  return (
    <WorkflowContext.Provider value={{ pending, setPending, sendOutput, consumeOutput, clear }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflowStore() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflowStore must be used within a WorkflowProvider");
  return ctx;
}
