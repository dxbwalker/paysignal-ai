/**
 * Outreach Strategy Generator — creates an agentic outreach plan per account.
 * Selects persona, channel, angle, builds sequence, identifies risks and fallback.
 */

import type { Account, EvidenceCard, BuyerPersona, ConfidenceLevel } from "@/types";

// --- Types (will be added to src/types/index.ts) ---

export interface OutreachStrategy {
  id: string;
  campaignId?: string;
  accountId: string;
  primaryPersonaId?: string;
  recommendedPersonaTitle: string;
  recommendedChannel: "linkedin" | "email" | "call" | "follow_up";
  recommendedAngle: string;
  rationale: string;
  nextBestAction: string;
  sequence: OutreachSequenceStep[];
  successHypothesis: string;
  risks: string[];
  fallbackPlan: string;
  confidence: ConfidenceLevel;
  generatedAt: string;
}

export interface OutreachSequenceStep {
  id: string;
  personaId?: string;
  dayOffset: number;
  channel: "linkedin" | "email" | "call" | "follow_up";
  objective: string;
  message: string;
  claimEvidenceIds: string[];
  status: "draft" | "approved" | "copied" | "contacted" | "replied" | "no_response" | "skipped";
}

/**
 * Generate an OutreachStrategy for an account.
 * Returns null if account has insufficient evidence or is suppressed.
 */
export function generateStrategy(account: Account, campaignId?: string): OutreachStrategy | null {
  if (account.evidenceCards.length < 1) return null;
  if (account.suppressedAt) return null;
  if (!account.opportunityScore || account.opportunityScore.total < 60) return null;

  const primaryPersona = selectPrimaryPersona(account);
  const channel = selectChannel(primaryPersona, account);
  const angle = selectAngle(account);
  const rationale = buildRationale(primaryPersona, channel, angle, account);
  const sequence = buildSequence(account, primaryPersona, channel, angle);
  const successHypothesis = buildSuccessHypothesis(account, angle);
  const risks = identifyRisks(account, primaryPersona);
  const fallbackPlan = buildFallbackPlan(account, primaryPersona);
  const confidence = assessConfidence(account);
  const nextBestAction = buildNextBestAction(sequence[0], primaryPersona, account);

  return {
    id: `strategy-${account.id.slice(0, 8)}-${Date.now().toString(36)}`,
    campaignId,
    accountId: account.id,
    primaryPersonaId: primaryPersona?.id,
    recommendedPersonaTitle: primaryPersona?.title || "Head of Payments",
    recommendedChannel: channel,
    recommendedAngle: angle,
    rationale,
    nextBestAction,
    sequence,
    successHypothesis,
    risks,
    fallbackPlan,
    confidence,
    generatedAt: new Date().toISOString(),
  };
}

function selectPrimaryPersona(account: Account): BuyerPersona | undefined {
  if (account.personas.length === 0) return undefined;

  // Find persona whose domain matches strongest evidence dimension
  const strongestDimension = account.opportunityScore?.dimensions
    .filter((d) => d.name !== "confidence")
    .sort((a, b) => b.subScore - a.subScore)[0];

  if (strongestDimension) {
    const paymentPersona = account.personas.find((p) => {
      const title = p.title.toLowerCase();
      if (strongestDimension.name === "payment_complexity") {
        return title.includes("payment") || title.includes("payout") || title.includes("platform");
      }
      if (strongestDimension.name === "operational_urgency") {
        return title.includes("operations") || title.includes("ops") || title.includes("coo");
      }
      if (strongestDimension.name === "automation_fit") {
        return title.includes("finance") || title.includes("billing") || title.includes("cfo");
      }
      return false;
    });
    if (paymentPersona) return paymentPersona;
  }

  return account.personas[0]; // Fallback to highest-ranked
}

function selectChannel(persona: BuyerPersona | undefined, account: Account): "linkedin" | "email" | "call" | "follow_up" {
  if (!persona) return "linkedin";

  // C-level: prefer call
  const title = persona.title.toLowerCase();
  if (title.includes("cfo") || title.includes("ceo") || title.includes("coo")) {
    return persona.email ? "email" : "linkedin";
  }

  // Has confirmed email: prefer email
  if (persona.email) return "email";

  // Default: LinkedIn (lowest barrier)
  return "linkedin";
}

function selectAngle(account: Account): string {
  // Use strongest observed evidence card's suggested angle
  const strongestCard = account.evidenceCards
    .filter((c) => c.evidenceType === "observed" && c.confidenceLevel !== "low")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidenceLevel] - order[b.confidenceLevel];
    })[0];

  if (strongestCard) return strongestCard.suggestedOutreachAngle;

  // Fallback angle based on business model
  const model = account.businessModel;
  if (model === "marketplace" || model === "platform") return "Multi-party payment complexity and reconciliation overhead";
  if (model === "gig_economy") return "High-volume cross-border payout operations";
  if (model === "saas") return "Subscription billing and dunning automation";
  return "Payment operations scaling without proportional headcount";
}

function buildRationale(persona: BuyerPersona | undefined, channel: string, angle: string, account: Account): string {
  const personaReason = persona
    ? `Start with ${persona.title} because their role directly owns the payment operations that evidence points to.`
    : `No named contact identified — recommend targeting Head of Payments or equivalent.`;

  const channelReason =
    channel === "email" ? "Use email because we have a confirmed address."
    : channel === "linkedin" ? "Use LinkedIn because no confirmed email is available — lower barrier to connect."
    : channel === "call" ? "Use call because this is a C-level contact who may respond better to direct outreach."
    : "Follow up after initial contact.";

  return `${personaReason} ${channelReason}`;
}

function buildSequence(account: Account, persona: BuyerPersona | undefined, channel: "linkedin" | "email" | "call" | "follow_up", angle: string): OutreachSequenceStep[] {
  const topCards = account.evidenceCards
    .filter((c) => c.confidenceLevel !== "low")
    .slice(0, 4);

  const personaName = persona?.name.split(" ")[0] || "there";

  const steps: OutreachSequenceStep[] = [
    {
      id: `step-1-${account.id.slice(0, 6)}`,
      personaId: persona?.id,
      dayOffset: 1,
      channel,
      objective: "Initial connection — establish relevance with evidence-backed opening",
      message: channel === "linkedin"
        ? `Hi ${personaName} — noticed ${account.name} is scaling payment operations. We help ${account.businessModel.replace(/_/g, " ")} companies automate with autonomous agents. Worth connecting?`
        : `Hi ${personaName},\n\nI noticed ${account.name} ${topCards[0]?.rawEvidence.slice(0, 80) || "has significant payment complexity"}. We've built autonomous payment agents that handle this without human intervention.\n\nWorth a quick conversation?`,
      claimEvidenceIds: topCards.slice(0, 1).map((c) => c.id),
      status: "draft",
    },
    {
      id: `step-2-${account.id.slice(0, 6)}`,
      personaId: persona?.id,
      dayOffset: 2,
      channel: "email",
      objective: "Deeper value proposition — reference specific evidence and pain hypothesis",
      message: `Hi ${personaName},\n\nFollowing up on ${account.name}'s payment operations. ${topCards[1]?.rawEvidence.slice(0, 100) || "Your team structure suggests manual processes that could be automated."}\n\nOur agents handle reconciliation, routing, and exception handling autonomously. Would a 15-minute demo be useful?`,
      claimEvidenceIds: topCards.slice(0, 2).map((c) => c.id),
      status: "draft",
    },
    {
      id: `step-3-${account.id.slice(0, 6)}`,
      personaId: persona?.id,
      dayOffset: 5,
      channel: "follow_up",
      objective: "Soft follow-up with discovery question if no response",
      message: `Hi ${personaName}, quick follow-up — I'm curious: how is ${account.name} planning to scale payment operations as volume grows? Happy to share how similar ${account.businessModel.replace(/_/g, " ")} companies have approached this.`,
      claimEvidenceIds: topCards.slice(0, 1).map((c) => c.id),
      status: "draft",
    },
    {
      id: `step-4-${account.id.slice(0, 6)}`,
      personaId: persona?.id,
      dayOffset: 7,
      channel: "call",
      objective: "Direct outreach if no digital response — use call opener with talking points",
      message: `Call opener: Reference ${topCards[0]?.signalType.replace(/_/g, " ") || "payment complexity"} at ${account.name}. Ask about their current process. Introduce autonomous agents as alternative to scaling headcount.`,
      claimEvidenceIds: topCards.slice(0, 2).map((c) => c.id),
      status: "draft",
    },
  ];

  return steps;
}

function buildSuccessHypothesis(account: Account, angle: string): string {
  const topSignal = account.evidenceCards[0];
  return `If they respond, it will likely be because ${topSignal?.whyItMatters.slice(0, 100) || "payment operations complexity is a recognized pain point"} and the timing aligns with their current growth trajectory.`;
}

function identifyRisks(account: Account, persona: BuyerPersona | undefined): string[] {
  const risks: string[] = [];

  const inferredRatio = account.evidenceCards.filter((c) => c.evidenceType === "inferred").length / Math.max(1, account.evidenceCards.length);
  if (inferredRatio > 0.5) risks.push("Most evidence is inferred — pain hypothesis may not match reality");

  if (!persona?.email) risks.push("No confirmed email — LinkedIn-only contact path");

  if (account.evidenceCards.length < 3) risks.push("Limited evidence — outreach angle may feel generic");

  if (account.confidencePenalty) risks.push("Confidence penalty applied — weak or conflicting web evidence");

  return risks.slice(0, 3);
}

function buildFallbackPlan(account: Account, primaryPersona: BuyerPersona | undefined): string {
  const secondaryPersona = account.personas.find((p) => p.id !== primaryPersona?.id);

  if (secondaryPersona) {
    return `If no response from ${primaryPersona?.title || "primary contact"}, try ${secondaryPersona.title} with a finance operations angle instead.`;
  }

  return `If no response, research additional contacts at ${account.name} via LinkedIn Sales Navigator or Apollo.`;
}

function assessConfidence(account: Account): ConfidenceLevel {
  const observedHighCards = account.evidenceCards.filter(
    (c) => c.evidenceType === "observed" && c.confidenceLevel === "high"
  );

  if (observedHighCards.length >= 3) return "high";
  if (observedHighCards.length >= 1) return "medium";
  return "low";
}

function buildNextBestAction(firstStep: OutreachSequenceStep, persona: BuyerPersona | undefined, account: Account): string {
  const channelLabel = firstStep.channel === "linkedin" ? "LinkedIn connection message" : firstStep.channel === "email" ? "email" : "call";
  const personaLabel = persona?.name || persona?.title || "primary contact";
  return `Send ${channelLabel} to ${personaLabel} at ${account.name}`;
}
