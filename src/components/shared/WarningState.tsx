interface WarningStateProps {
  /** Warning title */
  title: string;
  /** Detailed message */
  message?: string;
  /** Optional action to resolve */
  action?: React.ReactNode;
}

/**
 * Warning/fallback notification for panels using cached or degraded data.
 */
export function WarningState({ title, message, action }: WarningStateProps) {
  return (
    <div className="mx-4 my-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
      <div className="flex items-start gap-2">
        <svg
          className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-yellow-400">{title}</p>
          {message && (
            <p className="text-[11px] text-yellow-400/70 mt-0.5">{message}</p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
