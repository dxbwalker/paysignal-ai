interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

/**
 * Color-coded score badge.
 * Green: ≥80 (high opportunity)
 * Yellow: 60-79 (medium opportunity)
 * Gray: <60 (low opportunity)
 */
export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const colorClass =
    score >= 80
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : score >= 60
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      : "bg-gray-500/10 text-gray-400 border-gray-500/20";

  const sizeClass =
    size === "lg"
      ? "text-base px-3 py-1"
      : size === "md"
      ? "text-sm px-2.5 py-0.5"
      : "text-[11px] px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium ${colorClass} ${sizeClass}`}
    >
      {score}
    </span>
  );
}
