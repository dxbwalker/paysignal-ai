import { useWorkflow } from "@/context/WorkflowContext";

export function WorkflowProgress() {
  const { state } = useWorkflow();
  if (state.currentStage === "idle") return null;

  const stages = ["analyzing_icp", "discovering", "collecting_evidence", "scoring", "generating_outreach"];
  const completedCount = stages.filter((s) => state.stages.find((st) => st.name === s)?.status === "completed").length;
  const progress = (completedCount / stages.length) * 100;

  if (completedCount === stages.length) return null; // Hide when done

  return (
    <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "#4f9cf7" }}
        />
      </div>
    </div>
  );
}
