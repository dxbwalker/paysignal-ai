import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";

interface Props {
  account: Account;
  strategy: OutreachStrategy | null;
}

export function SelectedAccountHero({ account, strategy }: Props) {
  const score = account.opportunityScore;
  const total = score?.total ?? 0;

  const scoreColor = total >= 80 ? "#34d399" : total >= 60 ? "#fbbf24" : "#64748b";
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (total / 100) * circumference;

  const whyNow = strategy?.recommendedAngle
    || account.outreachPack?.whyThisAccountWhyNow
    || score?.topFactors[0]
    || "";

  const actionLabel = strategy
    ? "Approve Plan"
    : score?.recommendedAction === "generate_outreach"
    ? "Review Plan"
    : score?.recommendedAction === "research_further"
    ? "Research"
    : "Deprioritized";

  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, var(--surface-raised) 0%, rgba(79,156,247,0.02) 100%)" }}>
      <div className="flex items-center gap-5">
        {/* Score Ring */}
        <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
          <svg className="w-full h-full" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={scoreColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold font-mono" style={{ color: scoreColor }}>{total}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-white truncate">{account.name}</h2>
            {score && (
              <span className={`badge ${
                score.recommendedAction === "generate_outreach" ? "badge-green" :
                score.recommendedAction === "research_further" ? "badge-yellow" : "badge-gray"
              }`}>
                {score.recommendedAction === "generate_outreach" ? "Outreach" :
                 score.recommendedAction === "research_further" ? "Research" : "Skip"}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748b] mb-2">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
            {account.fundingStage && ` · ${account.fundingStage}`}
          </p>
          {whyNow && (
            <p className="text-[13px] text-[#94a3b8] leading-relaxed line-clamp-2">{whyNow}</p>
          )}
          {strategy && (
            <p className="text-[11px] text-[#64748b] mt-1.5">
              → <span className="text-[#4f9cf7]">{strategy.recommendedPersonaTitle}</span> via {strategy.recommendedChannel}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <button className="btn-primary">{actionLabel}</button>
        </div>
      </div>
    </div>
  );
}
