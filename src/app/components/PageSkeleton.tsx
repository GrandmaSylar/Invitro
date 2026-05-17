import { Skeleton } from "./ui/skeleton";

/**
 * A generic full-page skeleton loader used as a Suspense fallback
 * or while data is being fetched. Mimics a typical page layout
 * with a header, stat cards, and content blocks.
 */
export function PageSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * A table-style skeleton used for list pages like Patients, Test Register, etc.
 */
export function TablePageSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Search / filter bar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Table header */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="border-b border-border/50 p-4 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-4 flex gap-4 border-b border-border/30 last:border-b-0"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A settings-style skeleton for forms and config panels.
 */
export function SettingsPageSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-52 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        {/* Content area */}
        <div className="flex-1 space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
