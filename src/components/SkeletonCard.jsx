export function SkeletonCard() {
  return (
    <article className="overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="skeleton-shimmer mx-4 mt-4 aspect-[16/9] w-[calc(100%-2rem)] rounded-2xl" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="skeleton-shimmer h-3 w-1/4" />
        <div className="skeleton-shimmer h-6 w-full" />
        <div className="skeleton-shimmer h-6 w-5/6" />
        <div className="skeleton-shimmer mt-4 h-3 w-full" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton-shimmer h-9 w-24" />
          <div className="skeleton-shimmer h-9 w-24" />
        </div>
      </div>
    </article>
  )
}
