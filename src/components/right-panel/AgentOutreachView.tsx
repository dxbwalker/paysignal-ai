import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";
import { AgentRecommendation } from "./AgentRecommendation";
import { NextBestAction } from "./NextBestAction";
import { OutreachTimeline } from "./OutreachTimeline";
import { OutreachPackView } from "./OutreachPackView";

interface Props {
  account: Account;
  strategy?: OutreachStrategy;
}

export function AgentOutreachView({ account, strategy }: Props) {
  // Fall back to old OutreachPackView if no strategy
  if (!strategy) {
    return <OutreachPackView account={account} />;
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Agent Recommendation */}
      <AgentRecommendation strategy={strategy} account={account} />

      {/* Next Best Action */}
      <NextBestAction strategy={strategy} />

      {/* Outreach Timeline */}
      <OutreachTimeline strategy={strategy} account={account} />

      {/* Risks & Fallback */}
      {(strategy.risks.length > 0 || strategy.fallbackPlan) && (
        <details className="card-elevated !p-3">
          <summary className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider cursor-pointer">
            Risks & Fallback Plan
          </summary>
          <div className="mt-2 space-y-2">
            {strategy.risks.map((risk, i) => (
              <p key={i} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">⚠</span> {risk}
              </p>
            ))}
            {strategy.fallbackPlan && (
              <p className="text-xs text-gray-400 pt-1 border-t border-white/5">
                <span className="text-gray-500">Fallback:</span> {strategy.fallbackPlan}
              </p>
            )}
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        <button className="btn-primary text-xs">Approve Sequence</button>
        <button className="btn-secondary text-xs">Regenerate</button>
        <button className="btn-ghost">Change Persona</button>
        <button className="btn-ghost">Change Angle</button>
      </div>
    </div>
  );
}
