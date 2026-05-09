import { useWorkflow } from "@/context/WorkflowContext";

export function AgentDecisionStream() {
  const { state } = useWorkflow();

  // Show only last 2 key entries
  const entries = state.activityLog.slice(-2);

  if (entries.length === 0) {
    return (
      <div className="px-5 py-3">
        <span className="text-[10px] text-[#334155]">Agent ready</span>
      </div>
    );
  }

  return (
    <div className="px-5 py-2.5 flex flex-col gap-1">
      {entries.map((entry) => (
        <p key={entry.id} className="text-[11px] text-[#64748b] truncate">
          {entry.message}
        </p>
      ))}
    </div>
  );
}
