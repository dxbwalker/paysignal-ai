import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { cache } from "@/lib/cache";

/**
 * Collapsible compliance notice about data handling responsibilities
 * and data-source attribution. Includes a "Clear Data" button that
 * removes localStorage cache, suppression list, and campaign data.
 *
 * Requirements: 9.9, 9.12, 9.14, 12.3
 */
export function ComplianceNotice() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { dispatch } = useWorkflow();

  const handleClearData = () => {
    // Clear all localStorage cache (enrichment, scores, outreach, suppression)
    cache.clearAll();
    // Reset workflow state (clears campaign data, suppression list, accounts)
    dispatch({ type: "CLEAR_DATA" });
    setShowClearConfirm(false);
  };

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
            <strong className="text-gray-400">Data Sources:</strong> Users must only connect and use
            data sources they are authorized to access and must comply with the terms of the
            underlying data providers. Account and persona data is sourced from publicly available
            LinkedIn profiles and web search results.
          </p>
          <p>
            <strong className="text-gray-400">Usage Responsibility:</strong> Users are responsible
            for ensuring outreach complies with applicable regulations (GDPR, CAN-SPAM, CCPA) and
            for using compliant data sources and lawful outreach channels. This tool does not send
            messages automatically — all outreach is copy-only.
          </p>
          <p>
            <strong className="text-gray-400">Data Retention:</strong> All data is stored locally
            in your browser. No account or persona data is transmitted to third parties beyond the
            configured API providers.
          </p>

          {/* Clear Data Section */}
          <div className="pt-2 border-t border-gray-800">
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-300 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All Data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-yellow-400">
                  This will remove all cached data, suppression list entries, and campaign outcomes
                  from your browser. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearData}
                    className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[10px] px-2 py-1 rounded bg-gray-700/50 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
