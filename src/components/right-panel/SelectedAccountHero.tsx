import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";

interface Props {
  account: Account;
  strategy: OutreachStrategy | null;
}

export function SelectedAccountHero({ account, strategy }: Props) {
  const score = account.opportunityScore;
  const scoreColor = score
    ? score.total >= 80 ? "text-emerald-400" : score.total >= 60 ? "text-amber-400" : "text-gray-400"
    : "text-gray-500";

  const whyNow = strategy?.recommendedAngle
    || account.outreachPack?.whyThisAccountWhyNow
    || score?.topFactors[0]
    || "";

  const nextAction = strategy?.nextBestAction
    || (score?.recommendedAction === "generate_outreach" ? "Review outreach plan" : score?.recommendedAction === "research_further" ? "Gather more evidence" : "Deprioritized");

  const ctaLabel = strategy ? "Approve Plan" : score?.recommendedAction === "generate_outreach" ? "Review Plan" : "Research Further";
  const ctaColor = strategy ? "btn-primary" : "btn-secondary";

  return (
    <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-surface-raised to-transparent">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Identity + Why Now */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-white truncate">{account.name}</h2>
            {score && (
              <span className={`text-xs font-medium ${
                score.recommendedAction === "generate_outreach" ? "text-emerald-400" :
                score.recommendedAction === "research_further" ? "text-amber-400" : "text-gray-500"
              }`}>
                {score.recommendedAction === "generate_outreach" ? "Outreach Ready" :
                 score.recommendedAction === "research_further" ? "Research" : "Deprioritized"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
            {account.fundingStage && ` · ${account.fundingStage}`}
          </p>
          {whyNow && (
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{whyNow}</p>
          )}
          {strategy && (
            <p className="text-xs text-gray-500 mt-2">
              Agent recommends: <span className="text-brand-300">{strategy.recommendedPersonaTitle}</span> via <span className="text-brand-300">{strategy.recommendedChannel}</span>
            </p>
          )}
        </div>

        {/* Right: Score + CTA */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {score && (
            <div className="text-right">
              <span className={`text-3xl font-bold font-mono ${scoreColor}`}>{score.total}</span>
              <p className="text-[9px] text-gray-600">/100</p>
            </div>
          )}
          <button className={`${ctaColor} text-[11px] px-3 py-1.5 whitespace-nowrap`}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
