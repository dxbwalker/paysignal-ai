import { useWorkflow } from "@/context/WorkflowContext";
import type { WorkflowStageName } from "@/types";

const VISIBLE_STAGES: { name: WorkflowStageName; label: string }[] = [
  { name: "analyzing_icp", label: "ICP" },
  { name: "discovering", label: "Discover" },
  { name: "collecting_evidence", label: "Evidence" },
  { name: "enriching", label: "Enrich" },
  { name: "scoring", label: "Score" },
  { name: "matching_personas", label: "Personas" },
  { name: "generating_brief", label: "Brief" },
  { name: "generating_outreach", label: "Outreach" },
];

export function WorkflowProgress() {
  const { state } = useWorkflow();

  if (state.currentStage === "idle") return null;

  return (
    <div className="px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-0">
        {VISIBLE_STAGES.map((stage, i) => {
          const stageState = state.stages.find((s) => s.name === stage.name);
          const status = stageState?.status || "pending";

          const isCompleted = status === "completed";
          const isRunning = status === "running";
          const isFailed = status === "failed";

          return (
            <div key={stage.name} className="flex items-center">
              {/* Connector line */}
              {i > 0 && (
                <div className={`w-4 h-[2px] ${isCompleted ? "bg-emerald-500/60" : "bg-gray-700/50"}`} />
              )}

              {/* Node */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    isCompleted ? "bg-emerald-500 border-emerald-500" :
                    isRunning ? "bg-brand-500 border-brand-500 animate-pulse" :
                    isFailed ? "bg-rose-500 border-rose-500" :
                    "bg-transparent border-gray-600"
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-full h-full text-white p-[1px]" viewBox="0 0 12 12" fill="none">
                      <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={`text-[8px] leading-none whitespace-nowrap ${
                  isCompleted ? "text-emerald-400" :
                  isRunning ? "text-brand-400" :
                  "text-gray-600"
                }`}>
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
