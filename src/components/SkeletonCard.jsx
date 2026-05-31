export function SkeletonCard() {
  return (
    <article className="overflow-hidden rounded-none border border-[var(--border)] bg-[var(--surface)]">
      <div className="skeleton-shimmer h-48 w-full" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="skeleton-shimmer h-3 w-1/3 rounded-none" />
        <div className="skeleton-shimmer h-6 w-full rounded-none" />
        <div className="skeleton-shimmer h-6 w-5/6 rounded-none" />
        <div className="skeleton-shimmer mt-4 h-2 w-full rounded-none" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton-shimmer h-8 w-20 rounded-none" />
          <div className="skeleton-shimmer h-8 w-20 rounded-none" />
        </div>
      </div>
    </article>
  )
}
