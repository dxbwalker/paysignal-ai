import { useWorkflow } from "@/context/WorkflowContext";
import type { WorkflowStageName } from "@/types";

const STAGE_LABELS: Record<WorkflowStageName, string> = {
  idle: "Idle",
  analyzing_icp: "ICP",
  awaiting_plan_approval: "Plan",
  discovering: "Discover",
  collecting_evidence: "Evidence",
  enriching: "Enrich",
  scoring: "Score",
  matching_personas: "Personas",
  generating_brief: "Brief",
  generating_outreach: "Outreach",
  ready: "Ready",
  feedback: "Feedback",
  failed: "Failed",
};

const VISIBLE_STAGES: WorkflowStageName[] = [
  "analyzing_icp",
  "discovering",
  "collecting_evidence",
  "enriching",
  "scoring",
  "matching_personas",
  "generating_brief",
  "generating_outreach",
  "ready",
];

export function WorkflowProgress() {
  const { state } = useWorkflow();

  if (state.currentStage === "idle") return null;

  return (
    <div className="px-3 py-2 border-b border-gray-800">
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {VISIBLE_STAGES.map((stageName, i) => {
          const stage = state.stages.find((s) => s.name === stageName);
          const status = stage?.status || "pending";

          return (
            <div key={stageName} className="flex items-center">
              {i > 0 && (
                <span className={`text-[8px] mx-0.5 ${
                  status === "completed" ? "text-green-500" : "text-gray-700"
                }`}>→</span>
              )}
              <span className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${
                status === "completed" ? "bg-green-500/10 text-green-400" :
                status === "running" ? "bg-brand-500/10 text-brand-400 animate-pulse" :
                status === "warning" ? "bg-yellow-500/10 text-yellow-400" :
                status === "failed" ? "bg-red-500/10 text-red-400" :
                "text-gray-600"
              }`}>
                {status === "completed" && "✓ "}
                {status === "running" && "● "}
                {STAGE_LABELS[stageName]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
