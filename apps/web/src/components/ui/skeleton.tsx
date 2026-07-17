type Props = {
  className?: string;
};

/** Placeholder xám — dùng khi chờ data (tránh màn trống). */
export function Skeleton({ className }: Props) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-zinc-200/80 ${className ?? ""}`}
    />
  );
}

export function TripListSkeleton() {
  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-3 w-16" />
            <Skeleton className="ml-auto h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TripDetailSkeleton() {
  return (
    <div className="space-y-10" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionBlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
