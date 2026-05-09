import { useState } from "react";
import type { Account, EvidenceCard } from "@/types";

const SIGNAL_LABELS: Record<string, string> = {
  payment_role: "Payment Role",
  billing_operations: "Billing Operations",
  ap_management: "AP Management",
  multi_country: "Multi-Country",
  marketplace_model: "Marketplace Model",
  hiring_payment_ops: "Payment Ops Hiring",
  recent_funding: "Recent Funding",
  legacy_tools: "Legacy Tools",
  manual_reconciliation: "Manual Reconciliation",
  international_expansion: "International Expansion",
  complex_payouts: "Complex Payouts",
  finance_ops_growth: "Finance Ops Growth",
  decision_maker_present: "Decision Maker",
  other: "Other Signal",
};

function rankCards(cards: EvidenceCard[]): EvidenceCard[] {
  return [...cards].sort((a, b) => {
    // High confidence first
    const confOrder = { high: 0, medium: 1, low: 2 };
    if (confOrder[a.confidenceLevel] !== confOrder[b.confidenceLevel]) {
      return confOrder[a.confidenceLevel] - confOrder[b.confidenceLevel];
    }
    // Observed before inferred
    if (a.evidenceType !== b.evidenceType) {
      return a.evidenceType === "observed" ? -1 : 1;
    }
    return 0;
  });
}

function EvidenceCardCompact({ card, defaultExpanded }: { card: EvidenceCard; defaultExpanded?: boolean }) {
  const [showDetails, setShowDetails] = useState(false);

  const confColor = card.confidenceLevel === "high" ? "border-l-emerald-500" :
                    card.confidenceLevel === "medium" ? "border-l-amber-500" : "border-l-gray-600";

  return (
    <div className={`border-l-2 ${confColor} pl-3 py-2 animate-in`}>
      {/* Title + badges */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-200">
          {SIGNAL_LABELS[card.signalType] || card.signalType}
        </span>
        <span className={`text-[9px] px-1 py-0 rounded ${
          card.evidenceType === "observed"
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {card.evidenceType === "observed" ? "👁 observed" : "💡 inferred"}
        </span>
      </div>

      {/* Evidence summary */}
      <p className="text-xs text-gray-400 leading-relaxed mb-1.5">
        {card.rawEvidence.slice(0, 150)}{card.rawEvidence.length > 150 ? "..." : ""}
      </p>

      {/* Outreach angle */}
      <p className="text-[11px] text-brand-300/80">
        → {card.suggestedOutreachAngle}
      </p>

      {/* Expandable details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[9px] text-gray-600 hover:text-gray-400 mt-1.5"
      >
        {showDetails ? "Hide details" : "Source & details"}
      </button>

      {showDetails && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-gray-500 space-y-0.5">
          <p>Source: {card.sourceLabel} · Reliability: {card.sourceReliability}</p>
          {card.sourceOrigin === "demo" && <p className="text-gray-600">Synthetic demo evidence</p>}
          {card.inferenceExplanation && <p className="text-amber-400/60 italic">{card.inferenceExplanation}</p>}
          <p>Dimension: {card.dimension.replace(/_/g, " ")}</p>
        </div>
      )}
    </div>
  );
}

export function EvidenceCardList({ account }: { account: Account }) {
  const [showAll, setShowAll] = useState(false);

  if (account.evidenceCards.length === 0) {
    return <p className="text-gray-500 text-sm">No evidence collected yet.</p>;
  }

  const ranked = rankCards(account.evidenceCards);
  const visible = showAll ? ranked : ranked.slice(0, 3);
  const hasMore = ranked.length > 3;

  return (
    <div className="space-y-3 animate-in">
      {visible.map((card) => (
        <EvidenceCardCompact key={card.id} card={card} />
      ))}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          Show all evidence ({ranked.length - 3} more) →
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}
