import { useWorkflow } from "@/context/WorkflowContext";

export function SearchPlanPreview() {
  const { state } = useWorkflow();

  if (state.currentStage === "idle" || !state.icpDescription) return null;

  // Generate a simple search plan preview from the ICP
  const keywords = extractKeywords(state.icpDescription);
  const personas = ["Head of Payments", "CFO", "VP Finance Operations"];
  const geography = extractGeography(state.icpDescription);

  return (
    <div className="p-4 border-t border-gray-800">
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Generated Search Plan
      </h3>

      <div className="space-y-2">
        <div>
          <span className="text-[10px] text-gray-500">Keywords:</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {keywords.map((kw) => (
              <span key={kw} className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500">Target Personas:</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {personas.map((p) => (
              <span key={p} className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">
                {p}
              </span>
            ))}
          </div>
        </div>

        {geography && (
          <div>
            <span className="text-[10px] text-gray-500">Geography:</span>
            <span className="text-[10px] text-gray-300 ml-1">{geography}</span>
          </div>
        )}

        <div>
          <span className="text-[10px] text-gray-500">Exclusions:</span>
          <span className="text-[10px] text-gray-400 ml-1">banks, pure PSPs, agencies</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-800">
        <span className="text-[10px] text-green-400">✓ Search plan approved</span>
      </div>
    </div>
  );
}

function extractKeywords(icp: string): string[] {
  const paymentTerms = [
    "payouts", "reconciliation", "billing", "payments", "invoicing",
    "settlement", "refunds", "dunning", "compliance",
  ];
  const found = paymentTerms.filter((t) => icp.toLowerCase().includes(t));
  if (found.length === 0) return ["payment operations", "finance ops"];
  return found.slice(0, 5);
}

function extractGeography(icp: string): string | null {
  const geos = ["US", "UK", "EU", "international", "global", "cross-border"];
  const found = geos.find((g) => icp.toLowerCase().includes(g.toLowerCase()));
  return found || null;
}
