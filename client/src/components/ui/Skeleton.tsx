export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-skeleton rounded-md bg-border/70 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <Skeleton className="h-40 w-full mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
