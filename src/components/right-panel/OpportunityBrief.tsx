import type { Account } from "@/types";

export function OpportunityBrief({ account }: { account: Account }) {
  const brief = account.opportunityBrief;

  if (!brief) {
    if (account.opportunityScore && account.opportunityScore.total < 60) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Account scored below 60 — brief not generated.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Status: {account.opportunityScore.recommendedAction.replace(/_/g, " ")}
          </p>
        </div>
      );
    }
    return <p className="text-gray-500 text-sm">No brief available.</p>;
  }

  const copyAsText = () => {
    const lines = [
      `# ${account.name} — Opportunity Brief`,
      "",
      `## Company Summary`,
      brief.companySummary,
      "",
      `## Payment Complexity Hypothesis`,
      brief.paymentComplexityHypothesis,
      "",
      `## Supporting Evidence`,
      ...brief.supportingEvidence.map(
        (ev) => `- [${ev.evidenceType}] ${ev.claim} (${ev.source}, ${ev.confidenceLevel} confidence)`
      ),
      "",
      `## Likely Pain Points`,
      ...brief.likelyPainPoints.map((p) => `- ${p}`),
      "",
      `## Suggested Outreach Angle`,
      brief.suggestedOutreachAngle,
      "",
      `## Discovery Questions`,
      ...brief.discoveryQuestions.map((q, i) => `${i + 1}. ${q}`),
    ];
    if (brief.lowEvidenceWarning) {
      lines.unshift(`⚠️ Warning: ${brief.lowEvidenceWarning}`, "");
    }
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const copyJsonExport = () => {
    navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
  };

  const copyCrmNote = () => {
    const note = [
      `${account.name} — Opportunity Brief`,
      "",
      brief.companySummary,
      "",
      `Hypothesis: ${brief.paymentComplexityHypothesis}`,
      "",
      "Pain Points:",
      ...brief.likelyPainPoints.map((p) => `• ${p}`),
      "",
      `Outreach Angle: ${brief.suggestedOutreachAngle}`,
      "",
      "Discovery Questions:",
      ...brief.discoveryQuestions.map((q, i) => `${i + 1}. ${q}`),
    ];
    navigator.clipboard.writeText(note.join("\n"));
  };

  return (
    <div className="space-y-4">
      {/* Low evidence warning */}
      {brief.lowEvidenceWarning && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
          <p className="text-[11px] text-orange-400">⚠️ {brief.lowEvidenceWarning}</p>
        </div>
      )}

      {/* Company Summary */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Company Summary
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{brief.companySummary}</p>
      </div>

      {/* Payment Complexity Hypothesis */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Payment Complexity Hypothesis
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{brief.paymentComplexityHypothesis}</p>
      </div>

      {/* Supporting Evidence */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Supporting Evidence
        </h4>
        <div className="space-y-2">
          {brief.supportingEvidence.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 text-[10px] px-1 rounded shrink-0 ${
                ev.evidenceType === "observed"
                  ? "bg-green-500/10 text-green-400"
                  : ev.evidenceType === "inferred"
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}>
                {ev.evidenceType}
              </span>
              <div className="flex-1">
                <p className="text-gray-300">{ev.claim}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Source: {ev.source} · {ev.confidenceLevel} confidence
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Likely Pain Points
        </h4>
        <ul className="space-y-1">
          {brief.likelyPainPoints.map((p, i) => (
            <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
              <span className="text-brand-400 mt-0.5">•</span> {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Personas */}
      {brief.recommendedPersonas.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Recommended Personas
          </h4>
          <div className="flex flex-wrap gap-1">
            {brief.recommendedPersonas.map((personaId) => {
              const persona = account.personas.find((p) => p.id === personaId);
              return (
                <span
                  key={personaId}
                  className="text-[10px] px-2 py-0.5 rounded bg-brand-600/10 text-brand-300 border border-brand-500/20"
                >
                  {persona ? `${persona.name} (${persona.title})` : personaId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Outreach Angle */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Suggested Outreach Angle
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{brief.suggestedOutreachAngle}</p>
      </div>

      {/* Discovery Questions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Discovery Questions
        </h4>
        <ol className="space-y-1">
          {brief.discoveryQuestions.map((q, i) => (
            <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
              <span className="text-gray-600 font-mono">{i + 1}.</span> {q}
            </li>
          ))}
        </ol>
      </div>

      {/* Export buttons */}
      <div className="pt-3 border-t border-gray-800 flex gap-2 flex-wrap">
        <button
          onClick={copyAsText}
          className="btn-secondary text-[10px] px-2 py-1"
        >
          📋 Copy Brief
        </button>
        <button
          onClick={copyJsonExport}
          className="btn-secondary text-[10px] px-2 py-1"
        >
          { } Export JSON
        </button>
        <button
          onClick={copyCrmNote}
          className="btn-secondary text-[10px] px-2 py-1"
        >
          📝 Copy CRM Note
        </button>
      </div>
    </div>
  );
}
