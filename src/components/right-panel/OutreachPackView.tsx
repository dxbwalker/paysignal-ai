import type { Account } from "@/types";
import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";

type Channel = "email" | "linkedin" | "call" | "followup" | "questions";

export function OutreachPackView({ account }: { account: Account }) {
  const { isSuppressed } = useWorkflow();
  const pack = account.outreachPack;
  const [activeChannel, setActiveChannel] = useState<Channel>("email");

  // Block outreach viewing for suppressed accounts (Req 9.13)
  if (account.suppressedAt || isSuppressed(account.id)) {
    return (
      <div className="text-center py-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-xs text-red-400 font-medium">Suppressed</span>
        </div>
        <p className="text-gray-500 text-sm">
          This account is on the suppression list. Outreach generation and viewing is blocked.
        </p>
      </div>
    );
  }

  if (!pack) {
    if (account.opportunityScore && account.opportunityScore.total < 60) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Outreach not generated for accounts below score 60.
          </p>
        </div>
      );
    }
    return <p className="text-gray-500 text-sm">No outreach pack available.</p>;
  }

  const channels: { id: Channel; label: string }[] = [
    { id: "email", label: "Email" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "call", label: "Call" },
    { id: "followup", label: "Follow-up" },
    { id: "questions", label: "Questions" },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
  };

  return (
    <div className="space-y-4">
      {/* Why this account */}
      <div className="bg-brand-600/5 border border-brand-500/20 rounded-lg p-3">
        <h4 className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
          Why This Account, Why Now
        </h4>
        <p className="text-xs text-gray-300">{pack.whyThisAccountWhyNow}</p>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            className={`flex-1 text-[10px] py-1.5 rounded font-medium transition-colors ${
              activeChannel === ch.id
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Channel content */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        {activeChannel === "email" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500">
                Subject: <span className="text-gray-300">{pack.email.subject}</span>
              </p>
              <button
                onClick={() => copyToClipboard(`Subject: ${pack.email.subject}\n\n${pack.email.body}`)}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                Copy
              </button>
            </div>
            <div className="border-t border-gray-700/50 pt-2">
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                {pack.email.body}
              </p>
            </div>
          </div>
        )}

        {activeChannel === "linkedin" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Connection message</span>
              <button
                onClick={() => copyToClipboard(pack.linkedinMessage)}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{pack.linkedinMessage}</p>
          </div>
        )}

        {activeChannel === "call" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Talking points</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    pack.callOpener.talkingPoints.map((tp, i) => `${i + 1}. ${tp}`).join("\n")
                  )
                }
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                Copy
              </button>
            </div>
            <ol className="space-y-2">
              {pack.callOpener.talkingPoints.map((tp, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-brand-400 font-mono">{i + 1}.</span>
                  {tp}
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeChannel === "followup" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Follow-up message</span>
              <button
                onClick={() => copyToClipboard(pack.followUp)}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
              {pack.followUp}
            </p>
          </div>
        )}

        {activeChannel === "questions" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Discovery questions</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    pack.discoveryQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
                  )
                }
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                Copy
              </button>
            </div>
            <ol className="space-y-2">
              {pack.discoveryQuestions.map((q, i) => (
                <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-brand-400 font-mono">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Evidence traceability / source attribution */}
      {pack.claimEvidenceIds.length > 0 && (
        <div className="text-[10px] text-gray-600 space-y-1">
          <p className="font-medium text-gray-500">Source attribution (Evidence Cards referenced):</p>
          {pack.claimEvidenceIds.map((id) => {
            const card = account.evidenceCards.find((e) => e.id === id);
            return (
              <div key={id} className="flex items-start gap-1.5 text-gray-500">
                <span className="font-mono text-gray-600 shrink-0">{id}</span>
                {card && (
                  <span>
                    — {card.signalType.replace(/_/g, " ")}:{" "}
                    {card.sourceUrl ? (
                      <a
                        href={card.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {card.rawEvidence.slice(0, 60)}…
                      </a>
                    ) : (
                      <span>{card.rawEvidence.slice(0, 60)}…</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export */}
      <div className="flex gap-2">
        <button
          onClick={exportJson}
          className="btn-secondary text-[10px] px-2 py-1"
        >
          📋 Export JSON
        </button>
      </div>
    </div>
  );
}
