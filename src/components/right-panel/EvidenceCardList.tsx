import type { Account } from "@/types";

export function EvidenceCardList({ account }: { account: Account }) {
  if (account.evidenceCards.length === 0) {
    return <p className="text-gray-500 text-sm">No evidence collected yet.</p>;
  }

  return (
    <div className="space-y-3">
      {account.evidenceCards.map((card) => (
        <div key={card.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge-blue text-[10px]">
              {card.signalType.replace(/_/g, " ")}
            </span>
            <span className={`text-[10px] px-1.5 py-0 rounded ${
              card.evidenceType === "observed"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
            }`}>
              {card.evidenceType}
            </span>
            <span className={`text-[10px] px-1.5 py-0 rounded border ${
              card.confidenceLevel === "high"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : card.confidenceLevel === "medium"
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                : "bg-gray-500/10 text-gray-500 border-gray-500/20"
            }`}>
              {card.confidenceLevel}
            </span>
          </div>

          {/* Evidence */}
          <p className="text-xs text-gray-300 mb-2">{card.rawEvidence}</p>

          {/* Source */}
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>
              Source:{" "}
              {card.sourceUrl ? (
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {card.sourceLabel}
                </a>
              ) : (
                card.sourceLabel
              )}
            </span>
            <span>·</span>
            <span>Reliability: {card.sourceReliability}</span>
            {card.sourceOrigin === "demo" && (
              <>
                <span>·</span>
                <span className="text-yellow-500">synthetic</span>
              </>
            )}
          </div>

          {/* Inference explanation */}
          {card.inferenceExplanation && (
            <p className="text-[10px] text-orange-400/70 mt-1 italic">
              Inference: {card.inferenceExplanation}
            </p>
          )}

          {/* Outreach angle */}
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <p className="text-[10px] text-brand-300">
              💡 {card.suggestedOutreachAngle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
