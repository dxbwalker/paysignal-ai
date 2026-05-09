import { useState } from "react";
import type { Account } from "@/types";
import type { OutreachStrategy, OutreachSequenceStep } from "@/lib/outreach-strategy";

interface Props {
  strategy: OutreachStrategy;
  account: Account;
}

const CHANNEL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  linkedin: { icon: "💬", label: "LinkedIn", color: "text-blue-400" },
  email: { icon: "📧", label: "Email", color: "text-brand-400" },
  call: { icon: "📞", label: "Call", color: "text-emerald-400" },
  follow_up: { icon: "🔄", label: "Follow-up", color: "text-amber-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "badge-gray" },
  approved: { label: "Approved", color: "badge-blue" },
  copied: { label: "Copied", color: "badge-cyan" },
  contacted: { label: "Contacted", color: "badge-green" },
  replied: { label: "Replied", color: "badge-green" },
  no_response: { label: "No Response", color: "badge-yellow" },
  skipped: { label: "Skipped", color: "badge-red" },
};

function TimelineStep({ step, account, isLast }: { step: OutreachSequenceStep; account: Account; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const channelCfg = CHANNEL_CONFIG[step.channel] || CHANNEL_CONFIG.email;
  const statusCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.draft;

  // Find referenced evidence cards
  const referencedCards = account.evidenceCards.filter((c) => step.claimEvidenceIds.includes(c.id));

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
          step.status === "contacted" || step.status === "replied" ? "bg-emerald-500 border-emerald-500" :
          step.status === "approved" || step.status === "copied" ? "bg-brand-500 border-brand-500" :
          "bg-transparent border-gray-600"
        }`} />
        {!isLast && <div className="w-[2px] flex-1 bg-gray-700/50 mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono w-10">Day {step.dayOffset}</span>
            <span className={`text-xs ${channelCfg.color}`}>{channelCfg.icon} {channelCfg.label}</span>
            <span className={`${statusCfg.color} text-[9px]`}>{statusCfg.label}</span>
          </div>
          <p className="text-xs text-gray-300 mt-1">{step.objective}</p>
        </div>

        {/* Expanded message */}
        {expanded && (
          <div className="mt-2 animate-in">
            <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                {step.message}
              </p>

              {/* Evidence chips */}
              {referencedCards.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
                  {referencedCards.map((card) => (
                    <span
                      key={card.id}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20"
                      title={card.rawEvidence.slice(0, 100)}
                    >
                      {card.evidenceType === "observed" ? "👁" : "💡"} {card.signalType.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Step actions */}
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(step.message); }}
                className="btn-ghost text-[10px]"
              >
                📋 Copy
              </button>
              <button className="btn-ghost text-[10px]">✓ Approve</button>
              <button className="btn-ghost text-[10px]">⏭ Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OutreachTimeline({ strategy, account }: Props) {
  return (
    <div className="card-elevated !p-4">
      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Outreach Sequence
      </h4>
      <div>
        {strategy.sequence.map((step, i) => (
          <TimelineStep
            key={step.id}
            step={step}
            account={account}
            isLast={i === strategy.sequence.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
