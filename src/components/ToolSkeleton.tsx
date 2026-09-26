/** Skeleton shown while a tool chunk loads — avoids blank flash on tool open. */
export function ToolSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true" role="status" aria-label="Loading tool">
      <div className="rounded-[18px] border-2 border-dashed border-border-soft min-h-[220px] bg-surface" />
      <div className="h-12 rounded-xl bg-surface-hover" />
      <div className="space-y-2">
        <div className="h-4 rounded-full bg-surface-hover w-3/4" />
        <div className="h-4 rounded-full bg-surface-hover w-1/2" />
      </div>
    </div>
  );
}
