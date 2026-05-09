import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import type { Account, OutcomeType, RejectionReason } from "@/types";

const OUTCOMES: { id: OutcomeType; label: string; color: string }[] = [
  { id: "approved", label: "Approve", color: "bg-green-600 hover:bg-green-700" },
  { id: "rejected", label: "Reject", color: "bg-red-600 hover:bg-red-700" },
  { id: "contacted", label: "Contacted", color: "bg-blue-600 hover:bg-blue-700" },
  { id: "replied", label: "Replied", color: "bg-purple-600 hover:bg-purple-700" },
  { id: "booked_meeting", label: "Booked Meeting", color: "bg-emerald-600 hover:bg-emerald-700" },
];

const REJECTION_REASONS: { id: RejectionReason; label: string }[] = [
  { id: "wrong_icp", label: "Wrong ICP" },
  { id: "weak_evidence", label: "Weak evidence" },
  { id: "wrong_geography", label: "Wrong geography" },
  { id: "too_small", label: "Too small" },
  { id: "wrong_persona", label: "Wrong persona" },
  { id: "not_payment_heavy", label: "Not payment-heavy" },
  { id: "already_contacted", label: "Already contacted" },
];

export function CampaignActions({ account }: { account: Account }) {
  const { dispatch, addLog } = useWorkflow();
  const [showRejectReasons, setShowRejectReasons] = useState(false);

  if (account.campaignOutcome) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
        <p className="text-xs text-gray-400">
          Outcome: <span className="text-white font-medium">{account.campaignOutcome.outcome.replace("_", " ")}</span>
        </p>
        {account.campaignOutcome.rejectionReason && (
          <p className="text-[10px] text-red-400 mt-1">
            Reason: {account.campaignOutcome.rejectionReason.replace("_", " ")}
          </p>
        )}
        <p className="text-[10px] text-gray-600 mt-1">
          Marked {new Date(account.campaignOutcome.markedAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  const handleOutcome = (outcome: OutcomeType) => {
    if (outcome === "rejected") {
      setShowRejectReasons(true);
      return;
    }

    dispatch({
      type: "SET_CAMPAIGN_OUTCOME",
      accountId: account.id,
      outcome: {
        accountId: account.id,
        outcome,
        channel: "email",
        markedAt: new Date().toISOString(),
      },
    });

    addLog("feedback", `Marked ${account.name} as "${outcome.replace("_", " ")}".`);
  };

  const handleReject = (reason: RejectionReason) => {
    dispatch({
      type: "SET_CAMPAIGN_OUTCOME",
      accountId: account.id,
      outcome: {
        accountId: account.id,
        outcome: "rejected",
        rejectionReason: reason,
        markedAt: new Date().toISOString(),
      },
    });

    addLog(
      "feedback",
      `Rejected ${account.name}: ${reason.replace("_", " ")}. Future searches should deprioritize similar accounts.`
    );
    setShowRejectReasons(false);
  };

  if (showRejectReasons) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Why are you rejecting this account?</p>
        <div className="flex flex-wrap gap-1">
          {REJECTION_REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => handleReject(r.id)}
              className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowRejectReasons(false)}
          className="text-[10px] text-gray-500 hover:text-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Campaign Action</p>
      <div className="flex flex-wrap gap-1">
        {OUTCOMES.map((o) => (
          <button
            key={o.id}
            onClick={() => handleOutcome(o.id)}
            className={`text-[10px] px-2.5 py-1 rounded text-white font-medium transition-colors ${o.color}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
