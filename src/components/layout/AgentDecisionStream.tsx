import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";

const STAGE_ICONS: Record<string, string> = {
  analyzing_icp: "🔍",
  discovering: "🔍",
  collecting_evidence: "📊",
  enriching: "🌐",
  scoring: "📊",
  matching_personas: "👤",
  generating_brief: "📝",
  generating_outreach: "📝",
  ready: "✓",
  feedback: "💡",
  failed: "⚠️",
};

export function AgentDecisionStream() {
  const { state } = useWorkflow();
  const [expanded, setExpanded] = useState(false);

  const isReady = state.currentStage === "ready" || state.accounts.length > 0;

  // Key decisions: entries containing important keywords
  const keyEntries = state.activityLog.filter(
    (e) =>
      e.message.includes("deprioritized") ||
      e.message.includes("strongest") ||
      e.message.includes("recommend") ||
      e.message.includes("Rejected") ||
      e.message.includes("outreach-ready") ||
      e.message.includes("Scored") ||
      e.message.includes("Found")
  );

  const visibleEntries = expanded ? state.activityLog : (isReady ? keyEntries.slice(-3) : state.activityLog.slice(-5));

  if (state.activityLog.length === 0) {
    return (
      <div className="p-3 h-full flex items-center justify-center">
        <p className="text-[11px] text-gray-600 italic">Agent decisions will appear here...</p>
      </div>
    );
  }

  return (
    <div className={`p-3 h-full flex flex-col ${isReady && !expanded ? "max-h-[96px]" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
          Agent Decisions
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          {expanded ? "Collapse ↑" : `Show all (${state.activityLog.length}) ↓`}
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {visibleEntries.map((entry) => {
          const icon = STAGE_ICONS[entry.stage] || "●";
          const isKey = keyEntries.includes(entry);

          return (
            <div
              key={entry.id}
              className={`flex items-start gap-1.5 text-[11px] py-0.5 ${
                isKey ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <span className="text-[9px] mt-0.5 flex-shrink-0 opacity-60">{icon}</span>
              <span className="leading-relaxed">{entry.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
