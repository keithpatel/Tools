import { ToolSkeleton } from "@/components/ToolSkeleton";

export default function ToolLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
      <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-4 sm:p-5 mb-3 md:mb-5 animate-pulse" aria-hidden="true">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-surface-hover shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 rounded bg-surface-hover w-1/3" />
            <div className="h-3 rounded bg-surface-hover w-2/3" />
          </div>
        </div>
      </div>
      <div className="rounded-[18px] border border-border-soft bg-surface-raised shadow-resting p-4 sm:p-6">
        <ToolSkeleton />
      </div>
    </div>
  );
}
