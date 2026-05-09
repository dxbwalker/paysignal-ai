interface LoadingSkeletonProps {
  /** Number of skeleton rows to render */
  lines?: number;
  /** Whether to show a header-sized block */
  showHeader?: boolean;
  /** Custom class for the container */
  className?: string;
}

/**
 * Pulse-animated loading skeleton for panel content.
 */
export function LoadingSkeleton({ lines = 3, showHeader = true, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 p-4 ${className}`} role="status" aria-label="Loading">
      {showHeader && (
        <div className="h-4 bg-gray-700/50 rounded w-2/5" />
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-gray-700/30 rounded"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}
