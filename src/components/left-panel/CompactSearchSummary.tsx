import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";

/**
 * Compact search summary shown after workflow starts.
 * Replaces the full ICP input + search plan editor with a minimal summary.
 * User can click "Edit Plan" to expand back to full view.
 */
export function CompactSearchSummary({ onExpand }: { onExpand: () => void }) {
  const { state } = useWorkflow();

  const keywords = state.searchPlan?.keywords || [];
  const companyTypes = state.searchPlan?.companyTypes || [];
  const geoFilters = state.searchPlan?.geographicFilters || [];

  return (
    <div className="p-4 space-y-3">
      {/* ICP Summary */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ICP</p>
        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
          {state.icpDescription || "No ICP defined"}
        </p>
      </div>

      {/* Key chips */}
      <div className="flex flex-wrap gap-1">
        {companyTypes.slice(0, 3).map((t) => (
          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {t.replace(/_/g, " ")}
          </span>
        ))}
        {geoFilters.slice(0, 2).map((g) => (
          <span key={g} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
            {g}
          </span>
        ))}
        {keywords.slice(0, 2).map((k) => (
          <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
            {k}
          </span>
        ))}
      </div>

      {/* Mode badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
          state.mode === "demo"
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}>
          {state.mode === "demo" ? "Synthetic Demo" : "Live Mode"}
        </span>
        <button onClick={onExpand} className="text-[10px] text-brand-400 hover:text-brand-300">
          Edit Plan →
        </button>
      </div>
    </div>
  );
}
