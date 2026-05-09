/**
 * Campaign Learning Module — generates feedback from outcomes.
 * Uses simple frequency-based association (not statistical correlation).
 */

import type { Account, CampaignFeedback, OutcomeType, SignalType } from "@/types";

const POSITIVE_OUTCOMES: OutcomeType[] = ["replied", "booked_meeting"];
const NEGATIVE_OUTCOMES: OutcomeType[] = ["rejected", "not_relevant", "bounced"];
const RESPONSE_OUTCOMES: OutcomeType[] = ["contacted", "replied", "booked_meeting", "bounced", "no_response"];

/**
 * Generate campaign feedback from accounts with outcomes.
 */
export function generateCampaignFeedback(accounts: Account[]): CampaignFeedback {
  const withOutcomes = accounts.filter((a) => a.campaignOutcome);
  const responseOutcomes = withOutcomes.filter((a) =>
    RESPONSE_OUTCOMES.includes(a.campaignOutcome!.outcome)
  );
  const isBaseline = responseOutcomes.length < 5;

  // Count outcomes
  const outcomeBreakdown: Partial<Record<OutcomeType, number>> = {};
  for (const a of withOutcomes) {
    const outcome = a.campaignOutcome!.outcome;
    outcomeBreakdown[outcome] = (outcomeBreakdown[outcome] || 0) + 1;
  }

  // Count by channel
  const engagedByChannel: Record<"email" | "linkedin" | "call" | "other", number> = {
    email: 0, linkedin: 0, call: 0, other: 0,
  };
  for (const a of withOutcomes) {
    const ch = a.campaignOutcome!.channel || "other";
    engagedByChannel[ch]++;
  }

  // Signal association analysis
  const signalPositiveCount = new Map<SignalType, number>();
  const signalNegativeCount = new Map<SignalType, number>();
  const signalTotalCount = new Map<SignalType, number>();

  for (const a of withOutcomes) {
    const outcome = a.campaignOutcome!.outcome;
    const isPositive = POSITIVE_OUTCOMES.includes(outcome);
    const isNegative = NEGATIVE_OUTCOMES.includes(outcome);

    for (const card of a.evidenceCards) {
      signalTotalCount.set(card.signalType, (signalTotalCount.get(card.signalType) || 0) + 1);
      if (isPositive) {
        signalPositiveCount.set(card.signalType, (signalPositiveCount.get(card.signalType) || 0) + 1);
      }
      if (isNegative) {
        signalNegativeCount.set(card.signalType, (signalNegativeCount.get(card.signalType) || 0) + 1);
      }
    }
  }

  // Top 3 signals associated with positive outcomes
  const topSignals = [...signalPositiveCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([signal]) => signal.replace(/_/g, " "));

  // Bottom 3 signals associated with negative outcomes
  const bottomSignals = [...signalNegativeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([signal]) => signal.replace(/_/g, " "));

  // ICP refinements
  const icpRefinements = generateIcpRefinements(accounts, withOutcomes);

  // Recommended keywords from positive accounts
  const recommendedKeywords = generateRecommendedKeywords(accounts);

  // Exclusions from rejected accounts
  const recommendedExclusions = generateExclusions(accounts);

  return {
    totalDiscovered: accounts.length,
    engagedByChannel,
    outcomeBreakdown,
    topSignals,
    bottomSignals,
    icpRefinements,
    recommendedKeywords,
    recommendedExclusions,
    isBaseline,
    generatedAt: new Date().toISOString(),
  };
}

function generateIcpRefinements(allAccounts: Account[], withOutcomes: Account[]): string[] {
  const refinements: string[] = [];

  const approved = withOutcomes.filter(
    (a) => a.campaignOutcome?.outcome === "approved" && (a.opportunityScore?.total ?? 0) >= 60
  );
  const rejected = withOutcomes.filter(
    (a) => a.campaignOutcome?.outcome === "rejected"
  );

  // Compare business models
  const approvedModels = new Set(approved.map((a) => a.businessModel));
  const rejectedModels = new Set(rejected.map((a) => a.businessModel));

  for (const model of rejectedModels) {
    if (!approvedModels.has(model)) {
      refinements.push(`Consider excluding "${model.replace(/_/g, " ")}" companies — all were rejected.`);
    }
  }

  // Check rejection reasons
  const reasons = rejected
    .map((a) => a.campaignOutcome?.rejectionReason)
    .filter(Boolean);

  const reasonCounts = new Map<string, number>();
  for (const r of reasons) {
    reasonCounts.set(r!, (reasonCounts.get(r!) || 0) + 1);
  }

  for (const [reason, count] of reasonCounts) {
    if (count >= 2) {
      refinements.push(`Multiple rejections for "${reason.replace(/_/g, " ")}" — tighten ICP to avoid these.`);
    }
  }

  if (refinements.length === 0) {
    refinements.push("Not enough outcome data to generate specific refinements yet.");
  }

  return refinements.slice(0, 5);
}

function generateRecommendedKeywords(accounts: Account[]): string[] {
  const positive = accounts.filter((a) =>
    POSITIVE_OUTCOMES.includes(a.campaignOutcome?.outcome as OutcomeType)
  );

  if (positive.length === 0) return ["payment operations", "reconciliation", "payouts"];

  const keywords = new Set<string>();
  for (const a of positive) {
    for (const card of a.evidenceCards) {
      if (card.evidenceType === "observed" && card.confidenceLevel !== "low") {
        keywords.add(card.signalType.replace(/_/g, " "));
      }
    }
  }

  return [...keywords].slice(0, 5);
}

function generateExclusions(accounts: Account[]): string[] {
  const rejected = accounts.filter((a) => a.campaignOutcome?.outcome === "rejected");
  const exclusions = new Set<string>();

  for (const a of rejected) {
    if (a.campaignOutcome?.rejectionReason === "too_small") {
      exclusions.add("companies under 20 employees");
    }
    if (a.campaignOutcome?.rejectionReason === "not_payment_heavy") {
      exclusions.add("payment tool providers (they build tools, not use them)");
    }
    if (a.campaignOutcome?.rejectionReason === "wrong_icp") {
      exclusions.add(a.businessModel.replace(/_/g, " ") + " companies");
    }
  }

  return [...exclusions].slice(0, 5);
}

/**
 * Check if all outreach-recommended accounts have outcomes.
 */
export function shouldAutoGenerateFeedback(accounts: Account[]): boolean {
  const outreachAccounts = accounts.filter(
    (a) => a.opportunityScore?.recommendedAction === "generate_outreach"
  );

  if (outreachAccounts.length === 0) return false;

  return outreachAccounts.every((a) => a.campaignOutcome !== undefined);
}
