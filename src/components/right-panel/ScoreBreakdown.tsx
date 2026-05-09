import type { Account } from "@/types";

const DIMENSION_CONFIG: Record<string, { label: string; icon: string }> = {
  payment_complexity: { label: "Payment Complexity", icon: "💳" },
  operational_urgency: { label: "Operational Urgency", icon: "⚡" },
  automation_fit: { label: "Automation Fit", icon: "🤖" },
  buyer_accessibility: { label: "Buyer Access", icon: "👤" },
  confidence: { label: "Confidence", icon: "🎯" },
};

function ScoreArc({ score }: { score: number }) {
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#6b7280";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 mx-auto mb-4">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

export function ScoreBreakdown({ account }: { account: Account }) {
  const score = account.opportunityScore;
  if (!score) return <p className="text-gray-500 text-sm">No score available.</p>;

  return (
    <div className="space-y-5 animate-in">
      {/* Score Arc */}
      <ScoreArc score={score.total} />

      {/* Dimension Bars */}
      <div className="space-y-3">
        {score.dimensions.map((dim) => {
          const config = DIMENSION_CONFIG[dim.name] || { label: dim.name, icon: "📊" };
          const barColor =
            dim.subScore >= 80 ? "from-emerald-500 to-emerald-600" :
            dim.subScore >= 60 ? "from-amber-500 to-amber-600" :
            dim.subScore >= 40 ? "from-orange-500 to-orange-600" :
            "from-gray-500 to-gray-600";

          return (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-300 flex items-center gap-1.5">
                  <span className="text-[10px]">{config.icon}</span>
                  {config.label}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {dim.subScore}
                  <span className="text-gray-600 text-[10px] ml-1">({Math.round(dim.weight * 100)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${dim.subScore}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Factors */}
      {score.topFactors.length > 0 && (
        <div className="card-elevated !p-3">
          <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">↑ Strengths</h4>
          <ul className="space-y-1.5">
            {score.topFactors.map((f, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 text-[10px]">●</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Factors */}
      {score.missingFactors.length > 0 && (
        <div className="card-elevated !p-3">
          <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">↓ Gaps</h4>
          <ul className="space-y-1.5">
            {score.missingFactors.map((f, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 text-[10px]">●</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Action */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Recommended</span>
        <span className={`text-xs font-semibold ${
          score.recommendedAction === "generate_outreach" ? "text-emerald-400" :
          score.recommendedAction === "research_further" ? "text-amber-400" : "text-rose-400"
        }`}>
          {score.recommendedAction === "generate_outreach" ? "Generate Outreach" :
           score.recommendedAction === "research_further" ? "Research Further" : "Deprioritize"}
        </span>
      </div>
    </div>
  );
}
