import { useState } from "react";

/**
 * Collapsible compliance notice about data handling responsibilities
 * and data-source attribution.
 */
export function ComplianceNotice() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg bg-surface-raised overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Data Handling &amp; Compliance
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 text-[11px] text-gray-500 space-y-2 border-t border-gray-800 pt-2">
          <p>
            <strong className="text-gray-400">Data Sources:</strong> Account and persona data is
            sourced from publicly available LinkedIn profiles and web search results. No private or
            proprietary data is accessed without authorization.
          </p>
          <p>
            <strong className="text-gray-400">Usage Responsibility:</strong> Users are responsible
            for ensuring outreach complies with applicable regulations (GDPR, CAN-SPAM, CCPA).
            This tool does not send messages automatically — all outreach is copy-only.
          </p>
          <p>
            <strong className="text-gray-400">Data Retention:</strong> All data is stored locally
            in your browser. No account or persona data is transmitted to third parties beyond the
            configured API providers.
          </p>
        </div>
      )}
    </div>
  );
}
