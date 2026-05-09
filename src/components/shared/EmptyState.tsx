import React from "react";

interface EmptyStateProps {
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Main message */
  title: string;
  /** Secondary description */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
}

/**
 * Empty state placeholder for panels with no data.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="text-gray-600 mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      {description && (
        <p className="text-xs text-gray-600 mt-1 max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
