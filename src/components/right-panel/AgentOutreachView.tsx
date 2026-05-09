import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";
import { AgentRecommendation } from "./AgentRecommendation";
import { NextBestAction } from "./NextBestAction";
import { OutreachTimeline } from "./OutreachTimeline";
import { OutreachPackView } from "./OutreachPackView";
import { useWorkflow } from "@/context/WorkflowContext";
import { useState, useCallback } from "react";

interface Props {
  account: Account;
  strategy?: OutreachStrategy;
}

export function AgentOutreachView({ account, strategy }: Props) {
  const { addLog } = useWorkflow();
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = useCallback(() => {
    if (!strategy || isSimulating) return;
    setIsSimulating(true);

    const steps = [
      `Selected ${strategy.recommendedPersonaTitle} as primary contact — role aligns with strongest evidence.`,
      `Chose ${strategy.recommendedChannel} because ${strategy.recommendedChannel === "email" ? "confirmed email available" : "lowest barrier to connect"}.`,
      `Generated evidence-backed opening referencing ${strategy.sequence[0]?.claimEvidenceIds.length || 0} evidence card(s).`,
      `Scheduled 4-step sequence: Day 1 → Day 2 → Day 5 → Day 7.`,
      `Fallback ready: ${strategy.fallbackPlan}`,
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        addLog("generating_outreach", steps[i]);
        i++;
      } else {
        clearInterval(interval);
        addLog("ready", "Simulation complete — approve sequence to proceed.");
        setIsSimulating(false);
      }
    }, 1500);
  }, [strategy, isSimulating, addLog]);

  // Fall back to old OutreachPackView if no strategy
  if (!strategy) {
    return <OutreachPackView account={account} />;
  }

  return (
    <div className="space-y-4 animate-in">
      {/* Next Best Action — most prominent */}
      <NextBestAction strategy={strategy} />

      {/* Agent rationale */}
      <p className="text-xs text-gray-400 leading-relaxed">
        {strategy.rationale}
      </p>

      {/* Recommendation card */}
      <AgentRecommendation strategy={strategy} account={account} />

      {/* Outreach Timeline */}
      <OutreachTimeline strategy={strategy} account={account} />

      {/* Risks & Fallback — collapsed */}
      {(strategy.risks.length > 0 || strategy.fallbackPlan) && (
        <details className="text-xs">
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            Risks & fallback plan
          </summary>
          <div className="mt-2 space-y-1.5 pl-2 border-l border-white/5">
            {strategy.risks.map((risk, i) => (
              <p key={i} className="text-amber-400/70">⚠ {risk}</p>
            ))}
            <p className="text-gray-500">{strategy.fallbackPlan}</p>
          </div>
        </details>
      )}

      {/* Actions — simplified */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <button className="btn-primary text-xs">Approve Plan</button>
        <button className="btn-secondary text-xs">Regenerate</button>
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="btn-ghost text-[10px]"
        >
          {isSimulating ? "Simulating..." : "▶ Simulate"}
        </button>
      </div>

      {isSimulating && (
        <p className="text-[9px] text-gray-600 italic">
          This is a simulation. No messages are sent.
        </p>
      )}
    </div>
  );
}
