import { useWorkflow } from "@/context/WorkflowContext";
import type { WorkflowStageName } from "@/types";

const STAGE_ICONS: Record<string, string> = {
  idle: "⏸",
  analyzing_icp: "🔍",
  awaiting_plan_approval: "📋",
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

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Agent Decision Stream
        </span>
        <span className="text-[10px] text-gray-600">
          {state.activityLog.length} decisions
        </span>
      </div>

      {state.activityLog.length === 0 ? (
        <p className="text-xs text-gray-600 italic">
          Waiting for workflow to start...
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {state.activityLog.map((entry, i) => {
            const icon = STAGE_ICONS[entry.stage] || "●";
            const isKey = entry.message.includes("deprioritized") ||
                          entry.message.includes("strongest") ||
                          entry.message.includes("recommend") ||
                          entry.message.includes("Rejected");

            return (
              <div
                key={entry.id}
                className={`flex items-start gap-2 text-xs animate-in ${
                  isKey ? "bg-brand-500/5 rounded-md px-2 py-1.5 border-l-2 border-brand-500/30" : "px-2 py-1"
                }`}
              >
                <span className="text-[10px] mt-0.5 flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`${isKey ? "text-gray-200 font-medium" : "text-gray-400"}`}>
                    {entry.message}
                  </span>
                </div>
                <span className="text-[9px] text-gray-700 font-mono whitespace-nowrap flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
