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
  const [simulationStep, setSimulationStep] = useState(-1);

  const runSimulation = useCallback(() => {
    if (!strategy || isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);

    const steps = [
      `Selected ${strategy.recommendedPersonaTitle} as primary contact — their role aligns with the strongest evidence signals.`,
      `Chose ${strategy.recommendedChannel} first because ${strategy.recommendedChannel === "email" ? "confirmed email is available" : strategy.recommendedChannel === "linkedin" ? "no confirmed email — LinkedIn is lowest barrier" : "C-level contact responds better to direct outreach"}.`,
      `Generated evidence-backed opening message referencing ${strategy.sequence[0]?.claimEvidenceIds.length || 0} evidence card(s).`,
      `Scheduled follow-up sequence: Day 2 email, Day 5 soft follow-up, Day 7 call if no response.`,
      `Fallback plan ready: ${strategy.fallbackPlan}`,
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        addLog("generating_outreach", steps[i]);
        setSimulationStep(i + 1);
        i++;
      } else {
        clearInterval(interval);
        addLog("ready", "Simulation complete — approve sequence to proceed with outreach.");
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
        <button
          onClick={() => runSimulation()}
          className="btn-secondary text-xs"
        >
          ▶ Run Agent Simulation
        </button>
        <button className="btn-ghost">Change Persona</button>
        <button className="btn-ghost">Change Angle</button>
      </div>

      {/* Simulation disclaimer */}
      {isSimulating && (
        <p className="text-[10px] text-gray-600 italic pt-1">
          This is a simulation. No messages are sent.
        </p>
      )}
    </div>
  );
}
