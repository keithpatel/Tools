"use client";

import { createContext, useContext, useState, useCallback, type ReactNode, type Dispatch, type SetStateAction } from "react";
import type { PendingOutput } from "@/data/workflow";

interface WorkflowContextValue {
  pending: PendingOutput | null;
  setPending: Dispatch<SetStateAction<PendingOutput | null>>;
  sendOutput: (output: PendingOutput) => void;
  consumeOutput: () => PendingOutput | null;
  clear: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingOutput | null>(null);

  const sendOutput = useCallback((output: PendingOutput) => {
    setPending(output);
  }, []);

  const consumeOutput = useCallback(() => {
    let val: PendingOutput | null = null;
    setPending((prev) => {
      val = prev;
      return null;
    });
    return val;
  }, []);

  const clear = useCallback(() => setPending(null), []);

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
