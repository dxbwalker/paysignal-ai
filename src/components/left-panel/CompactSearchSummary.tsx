import { useWorkflow } from "@/context/WorkflowContext";

export function CompactSearchSummary({ onExpand }: { onExpand: () => void }) {
  const { state } = useWorkflow();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Search</span>
        <button onClick={onExpand} className="text-[10px] text-[#4f9cf7] hover:text-[#6db3f8]">
          Edit
        </button>
      </div>
      <p className="text-[12px] text-[#94a3b8] leading-relaxed line-clamp-3">
        {state.icpDescription || "No ICP defined"}
      </p>
      <div className="mt-3">
        <span className={`text-[9px] px-2 py-0.5 rounded-full ${
          state.mode === "demo" ? "bg-[rgba(251,191,36,0.08)] text-[#fbbf24]" : "bg-[rgba(52,211,153,0.08)] text-[#34d399]"
        }`}>
          {state.mode === "demo" ? "Demo" : "Live"}
        </span>
      </div>
    </div>
  );
}
