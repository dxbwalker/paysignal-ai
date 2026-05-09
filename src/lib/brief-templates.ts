/**
 * Brief Templates — template-based Account Opportunity Brief generation.
 * Only generates for accounts with score >= 60.
 * All claims must be traceable to Evidence_Cards or labelled as hypotheses.
 *
 * Requirements: 8.1-8.9, 11.13
 */

import type { Account, AccountOpportunityBrief, BriefEvidence } from "@/types";

export interface GenerateBriefOptions {
  /** Force regeneration even if a brief already exists (e.g. after evidence/persona edits) */
  regenerate?: boolean;
}

/**
 * Check whether an account qualifies for brief generation (score >= 60).
 */
export function canGenerateBrief(account: Account): boolean {
  return !!(account.opportunityScore && account.opportunityScore.total >= 60);
}

/**
 * Generate an Account Opportunity Brief from evidence and scoring data.
 * Returns null if account score < 60 or no evidence cards exist.
 * Supports regeneration after evidence/persona edits via options.regenerate.
 */
export function generateBrief(
  account: Account,
  options: GenerateBriefOptions = {}
): AccountOpportunityBrief | null {
  const score = account.opportunityScore;
  if (!score || score.total < 60) return null;
  if (account.evidenceCards.length === 0) return null;

  // If brief already exists and regeneration not requested, return existing
  if (account.opportunityBrief && !options.regenerate) {
    return account.opportunityBrief;
  }

  const companySummary = buildCompanySummary(account);
  const hypothesis = buildHypothesis(account);
  const supportingEvidence = buildSupportingEvidence(account);
  const painPoints = buildPainPoints(account);
  const outreachAngle = buildOutreachAngle(account);
  const questions = buildDiscoveryQuestions(account);

  // Check for low evidence warning (Req 8.8)
  const highMediumCards = account.evidenceCards.filter(
    (c) => c.confidenceLevel === "high" || c.confidenceLevel === "medium"
  );
  const lowEvidenceWarning = highMediumCards.length < 2
    ? "This brief relies on limited evidence. Some sections are based on inferred signals that need direct confirmation."
    : undefined;

  return {
    accountId: account.id,
    companySummary,
    paymentComplexityHypothesis: hypothesis,
    supportingEvidence,
    likelyPainPoints: painPoints,
    recommendedPersonas: account.personas.slice(0, 3).map((p) => p.id),
    suggestedOutreachAngle: outreachAngle,
    discoveryQuestions: questions,
    lowEvidenceWarning,
  };
}

function buildCompanySummary(account: Account): string {
  const parts: string[] = [];
  parts.push(`${account.name} is a ${account.businessModel.replace(/_/g, " ")} company`);
  if (account.location) parts[0] += ` based in ${account.location}`;
  parts[0] += ".";

  if (account.industry) parts.push(`Industry: ${account.industry}.`);
  if (account.employeeCount) parts.push(`Approximately ${account.employeeCount} employees.`);
  if (account.fundingStage) parts.push(`Funding stage: ${account.fundingStage}.`);

  const paymentCards = account.evidenceCards.filter(
    (c) => c.dimension === "payment_complexity" && c.evidenceType === "observed"
  );
  if (paymentCards.length > 0) {
    parts.push(paymentCards[0].rawEvidence.slice(0, 150));
  }

  return parts.join(" ").slice(0, 600); // Keep under ~150 words
}

function buildHypothesis(account: Account): string {
  const model = account.businessModel;
  const signals = account.evidenceCards.map((c) => c.signalType);

  if (model === "marketplace" || model === "platform") {
    return `${account.name}'s multi-party payment model likely creates reconciliation and payout complexity that scales linearly with transaction volume. Evidence suggests they are addressing this with headcount rather than automation.`;
  }
  if (model === "gig_economy") {
    return `${account.name}'s high-volume worker payouts across multiple jurisdictions create compliance and routing complexity that manual processes struggle to maintain at scale.`;
  }
  if (model === "saas") {
    return `${account.name}'s subscription billing model with usage-based components creates invoicing complexity, dunning challenges, and revenue recognition overhead that grows with customer count.`;
  }
  if (signals.includes("multi_country")) {
    return `${account.name}'s international operations multiply payment complexity through multi-currency routing, compliance requirements, and cross-border settlement challenges.`;
  }

  return `${account.name} shows payment complexity signals that suggest manual operations overhead. Autonomous payment agents could reduce operational burden while improving accuracy and speed.`;
}

function buildSupportingEvidence(account: Account): BriefEvidence[] {
  return account.evidenceCards
    .filter((c) => c.confidenceLevel !== "low")
    .slice(0, 5)
    .map((card) => ({
      claim: card.rawEvidence.slice(0, 150),
      evidenceType: card.evidenceType,
      source: card.sourceLabel,
      confidenceLevel: card.confidenceLevel,
      evidenceCardId: card.id,
    }));
}

function buildPainPoints(account: Account): string[] {
  const points: string[] = [];
  const signals = account.evidenceCards.map((c) => c.signalType);

  if (signals.includes("manual_reconciliation")) {
    points.push("Manual reconciliation consuming significant operations time");
  }
  if (signals.includes("complex_payouts") || signals.includes("marketplace_model")) {
    points.push("Multi-party payment splitting and settlement complexity");
  }
  if (signals.includes("hiring_payment_ops")) {
    points.push("Payment operations scaling through headcount rather than automation");
  }
  if (signals.includes("multi_country") || signals.includes("international_expansion")) {
    points.push("Cross-border compliance and multi-currency routing overhead");
  }
  if (signals.includes("legacy_tools")) {
    points.push("Legacy financial tools creating manual workflow bottlenecks");
  }
  if (signals.includes("billing_operations") || signals.includes("ap_management")) {
    points.push("Invoice processing and accounts payable consuming team bandwidth");
  }

  // Ensure 2-5 pain points
  if (points.length < 2) {
    points.push("Payment operations overhead growing with business scale");
    points.push("Manual exception handling for failed or disputed transactions");
  }

  return points.slice(0, 5);
}

function buildOutreachAngle(account: Account): string {
  const topCard = account.evidenceCards
    .filter((c) => c.evidenceType === "observed")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidenceLevel] - order[b.confidenceLevel];
    })[0];

  if (topCard) {
    return topCard.suggestedOutreachAngle;
  }

  return `Position agentic payments as a way to scale ${account.name}'s payment operations without proportional headcount growth.`;
}

function buildDiscoveryQuestions(account: Account): string[] {
  const model = account.businessModel;

  if (model === "marketplace" || model === "platform") {
    return [
      "How much time does your team spend on payment reconciliation and exception handling?",
      "What happens when a payout fails — how many people are involved in resolving it?",
      "As transaction volume grows, how are you planning to scale payment operations?",
    ];
  }
  if (model === "gig_economy") {
    return [
      "What percentage of payouts require manual intervention or exception handling?",
      "How are you managing compliance across different jurisdictions?",
      "What's the biggest operational bottleneck in your payout process today?",
    ];
  }
  if (model === "saas") {
    return [
      "How much revenue do you estimate is lost to failed dunning or billing disputes?",
      "How is multi-currency invoicing being handled as you expand internationally?",
      "What's the most time-consuming part of your billing operations workflow?",
    ];
  }

  return [
    "How much time does your team spend on payment operations weekly?",
    "What's your biggest payment-related operational challenge right now?",
    "How do you see payment operations scaling over the next 12 months?",
  ];
}
