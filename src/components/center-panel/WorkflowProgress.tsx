import { useWorkflow } from "@/context/WorkflowContext";
import type { WorkflowStageName } from "@/types";

const STAGES: { name: WorkflowStageName; label: string }[] = [
  { name: "analyzing_icp", label: "ICP" },
  { name: "discovering", label: "Find" },
  { name: "collecting_evidence", label: "Evidence" },
  { name: "scoring", label: "Score" },
  { name: "generating_outreach", label: "Plan" },
];

export function WorkflowProgress() {
  const { state } = useWorkflow();
  if (state.currentStage === "idle") return null;

  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const s = state.stages.find((st) => st.name === stage.name);
          const status = s?.status || "pending";
          const isComplete = status === "completed";
          const isRunning = status === "running";

          return (
            <div key={stage.name} className="flex items-center">
              {i > 0 && (
                <div className={`w-6 h-[1.5px] mx-0.5 ${isComplete ? "bg-[#34d399]" : "bg-[#1e293b]"}`} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full border-[1.5px] ${
                    isComplete ? "node-complete" : isRunning ? "node-running" : "node-pending"
                  }`}
                />
                <span className={`text-[8px] ${
                  isComplete ? "text-[#34d399]" : isRunning ? "text-[#4f9cf7]" : "text-[#334155]"
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
