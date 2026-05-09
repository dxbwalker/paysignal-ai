import type { Account } from "@/types";

const DIMENSION_LABELS: Record<string, string> = {
  payment_complexity: "Payment Complexity",
  operational_urgency: "Operational Urgency",
  automation_fit: "Automation Fit",
  buyer_accessibility: "Buyer Accessibility",
  confidence: "Confidence",
};

const DIMENSION_WEIGHTS: Record<string, number> = {
  payment_complexity: 30,
  operational_urgency: 20,
  automation_fit: 20,
  buyer_accessibility: 15,
  confidence: 15,
};

export function ScoreBreakdown({ account }: { account: Account }) {
  const score = account.opportunityScore;
  if (!score) return <p className="text-gray-500 text-sm">No score available.</p>;

  return (
    <div className="space-y-4">
      {/* Dimension Bars */}
      <div className="space-y-3">
        {score.dimensions.map((dim) => {
          const weightLabel = DIMENSION_WEIGHTS[dim.name] ?? Math.round(dim.weight * 100);
          return (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">
                  {DIMENSION_LABELS[dim.name] || dim.name}
                </span>
                <span className="text-xs font-mono text-gray-300">
                  {dim.subScore} <span className="text-gray-600">({weightLabel}%)</span>
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dim.subScore >= 80 ? "bg-green-500" :
                    dim.subScore >= 60 ? "bg-yellow-500" :
                    dim.subScore >= 40 ? "bg-orange-500" : "bg-red-500"
                  }`}
                  style={{ width: `${dim.subScore}%` }}
                />
              </div>
              {/* Contributing signals */}
              {dim.contributingSignals.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {dim.contributingSignals.map((signalId) => {
                    const card = account.evidenceCards.find((e) => e.id === signalId);
                    return (
                      <span
                        key={signalId}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700/50"
                        title={card ? `${card.signalType}: ${card.rawEvidence.slice(0, 80)}` : signalId}
                      >
                        {card ? card.signalType.replace(/_/g, " ") : signalId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Factors */}
      {score.topFactors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-400 mb-1">↑ Top Factors</h4>
          <ul className="space-y-1">
            {score.topFactors.map((f, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Factors */}
      {score.missingFactors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-orange-400 mb-1">↓ Missing / Weak</h4>
          <ul className="space-y-1">
            {score.missingFactors.map((f, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                <span className="text-orange-500 mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Action */}
      <div className="pt-2 border-t border-gray-800">
        <span className="text-[10px] text-gray-500">Recommended: </span>
        <span className={`text-xs font-medium ${
          score.recommendedAction === "generate_outreach" ? "text-green-400" :
          score.recommendedAction === "research_further" ? "text-yellow-400" : "text-red-400"
        }`}>
          {score.recommendedAction.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}
