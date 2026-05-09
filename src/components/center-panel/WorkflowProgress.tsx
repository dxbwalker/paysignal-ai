import { useWorkflow } from "@/context/WorkflowContext";
import { WarningState } from "@/components/shared/WarningState";
import type { WorkflowStageName, WorkflowStage } from "@/types";

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

/** Stages visible in the progress indicator (excludes idle, feedback, failed) */
const VISIBLE_STAGES: WorkflowStageName[] = [
  "analyzing_icp",
  "awaiting_plan_approval",
  "discovering",
  "collecting_evidence",
  "enriching",
  "scoring",
  "matching_personas",
  "generating_brief",
  "generating_outreach",
  "ready",
];

function StageIndicator({
  stage,
  isCurrent,
}: {
  stage: WorkflowStage;
  isCurrent: boolean;
}) {
  const status = stage.status;

  // Dot color based on status
  const dotColor =
    status === "completed"
      ? "bg-green-400"
      : status === "running"
      ? "bg-brand-400 animate-pulse"
      : status === "warning"
      ? "bg-yellow-400"
      : status === "failed"
      ? "bg-red-400"
      : "bg-gray-600";

  // Text color based on status
  const textColor =
    status === "completed"
      ? "text-green-400"
      : status === "running"
      ? "text-brand-300"
      : status === "warning"
      ? "text-yellow-400"
      : status === "failed"
      ? "text-red-400"
      : "text-gray-600";

  // Background highlight for current stage
  const bgClass =
    status === "running"
      ? "bg-brand-500/10 ring-1 ring-brand-500/30"
      : status === "completed"
      ? "bg-green-500/5"
      : status === "warning"
      ? "bg-yellow-500/5"
      : status === "failed"
      ? "bg-red-500/5"
      : "";

  // Scale up current stage
  const scaleClass = isCurrent ? "scale-105" : "";

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${bgClass} ${scaleClass}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      <span className={`text-[10px] whitespace-nowrap font-medium ${textColor}`}>
        {STAGE_LABELS[stage.name]}
      </span>
      {stage.fallbackActive && (
        <svg
          className="w-3 h-3 text-yellow-400 shrink-0"
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
      )}
    </div>
  );
}

function ConnectorLine({ completed }: { completed: boolean }) {
  return (
    <div
      className={`w-3 h-px shrink-0 ${
        completed ? "bg-green-500/50" : "bg-gray-700"
      }`}
    />
  );
}

/**
 * WorkflowProgress — horizontal stage indicator showing all workflow stages.
 * Each stage shows its status with color coding:
 * - Gray = pending
 * - Blue = running (with pulse animation)
 * - Green = completed
 * - Yellow = warning (fallback active)
 * - Red = failed
 *
 * Current stage is highlighted/enlarged. Shows fallback notifications
 * when stages use cached/demo data.
 */
export function WorkflowProgress() {
  const { state } = useWorkflow();

  // Don't render when idle
  if (state.currentStage === "idle") return null;

  const visibleStages = VISIBLE_STAGES.map(
    (name) => state.stages.find((s) => s.name === name)!
  ).filter(Boolean);

  // Collect stages with active fallbacks for notification
  const fallbackStages = state.stages.filter(
    (s) => s.fallbackActive && s.fallbackReason
  );

  return (
    <div className="border-b border-gray-800">
      {/* Stage progress bar */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-thin">
          {visibleStages.map((stage, i) => (
            <div key={stage.name} className="flex items-center">
              {i > 0 && (
                <ConnectorLine
                  completed={
                    stage.status === "completed" ||
                    stage.status === "running" ||
                    stage.status === "warning"
                  }
                />
              )}
              <StageIndicator
                stage={stage}
                isCurrent={state.currentStage === stage.name}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fallback notifications */}
      {fallbackStages.map((stage) => (
        <WarningState
          key={stage.name}
          title={`${STAGE_LABELS[stage.name]}: Using fallback data`}
          message={stage.fallbackReason}
        />
      ))}
    </div>
  );
}
