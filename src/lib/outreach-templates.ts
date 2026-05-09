/**
 * Outreach Templates — template-based generation with evidence variable substitution.
 * Each message references at least one evidence-backed signal.
 * No unsupported claims — all references traceable to Evidence_Card IDs.
 */

import type { Account, OutreachPack, EvidenceCard } from "@/types";

/**
 * Generate an outreach pack for an account using template-based generation.
 * Returns null if account has fewer than 1 Evidence_Card.
 */
export function generateOutreachPack(account: Account): OutreachPack | null {
  if (account.evidenceCards.length < 1) return null;
  if (account.suppressedAt) return null;

  const topPersona = account.personas[0];
  const firstName = topPersona?.name.split(" ")[0] || "there";
  const topCards = getTopCards(account.evidenceCards, 3);
  const primaryCard = topCards[0];

  const subject = buildSubject(account, primaryCard);
  const body = buildEmailBody(account, firstName, topCards);
  const linkedinMessage = buildLinkedInMessage(account, firstName, primaryCard);
  const callOpener = buildCallOpener(account, topCards);
  const followUp = buildFollowUp(account, firstName, topCards);
  const questions = buildDiscoveryQuestions(account);
  const whyNow = buildWhyNow(account, topCards);

  const claimEvidenceIds = topCards.map((c) => c.id);

  return {
    accountId: account.id,
    whyThisAccountWhyNow: whyNow,
    email: { subject, body },
    linkedinMessage,
    callOpener: { talkingPoints: callOpener },
    followUp,
    discoveryQuestions: questions,
    generatedAt: new Date().toISOString(),
    generationMethod: "template",
    claimEvidenceIds,
  };
}

function getTopCards(cards: EvidenceCard[], limit: number): EvidenceCard[] {
  return [...cards]
    .sort((a, b) => {
      // Prefer observed over inferred
      if (a.evidenceType !== b.evidenceType) {
        return a.evidenceType === "observed" ? -1 : 1;
      }
      // Then by confidence
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidenceLevel] - order[b.confidenceLevel];
    })
    .slice(0, limit);
}

function buildSubject(account: Account, card: EvidenceCard): string {
  const templates: Record<string, string> = {
    complex_payouts: `Scaling ${account.name}'s payouts`,
    manual_reconciliation: "Reconciliation without the headcount",
    hiring_payment_ops: "Scaling ops without scaling team",
    billing_operations: "Billing automation at scale",
    marketplace_model: "Marketplace payment complexity",
    multi_country: "Cross-border payments simplified",
    legacy_tools: "Beyond legacy payment tools",
    ap_management: "AP automation for growing teams",
  };

  return (templates[card.signalType] || `Payment automation for ${account.name}`).slice(0, 60);
}

function buildEmailBody(account: Account, firstName: string, cards: EvidenceCard[]): string {
  const primary = cards[0];
  const secondary = cards[1];

  let opening = `Hi ${firstName},\n\n`;

  // Reference primary evidence
  opening += getEvidenceReference(account, primary);

  // Bridge to value prop
  opening += "\n\nWe've built autonomous payment agents that handle ";
  opening += getValueProp(primary);
  opening += " without human intervention.";

  // Optional secondary reference
  if (secondary) {
    opening += ` This is especially relevant given ${getSecondaryReference(account, secondary)}.`;
  }

  opening += "\n\nWorth a quick conversation?";

  return opening;
}

function getEvidenceReference(account: Account, card: EvidenceCard): string {
  switch (card.signalType) {
    case "hiring_payment_ops":
      return `I noticed ${account.name} is growing the payment operations team. That usually signals manual processes that are breaking under growth pressure.`;
    case "complex_payouts":
      return `I saw ${account.name} handles complex multi-party payouts — the kind of workflow that gets harder to manage as volume grows.`;
    case "manual_reconciliation":
      return `I noticed ${account.name} manages reconciliation across multiple systems. That's typically one of the most time-consuming payment operations tasks.`;
    case "marketplace_model":
      return `As a marketplace, ${account.name} likely deals with split payments, seller payouts, and multi-party settlement — all of which scale poorly with manual processes.`;
    case "multi_country":
      return `With operations across multiple countries, ${account.name} faces cross-border payment complexity that multiplies with each new market.`;
    case "billing_operations":
      return `I noticed ${account.name} manages complex billing operations. Usage-based or subscription billing at scale creates significant invoicing overhead.`;
    case "legacy_tools":
      return `I saw signals that ${account.name} may be working with legacy financial tools. That often means manual workflows that could be automated.`;
    default:
      return `I noticed ${account.name} has significant payment operations complexity based on your team structure and business model.`;
  }
}

function getValueProp(card: EvidenceCard): string {
  switch (card.signalType) {
    case "complex_payouts":
    case "marketplace_model":
      return "multi-party payout routing, split logic, and settlement";
    case "manual_reconciliation":
      return "cross-system reconciliation, exception handling, and matching";
    case "hiring_payment_ops":
      return "the operational workflows that typically require growing headcount";
    case "multi_country":
      return "cross-border routing, compliance checks, and multi-currency settlement";
    case "billing_operations":
      return "invoicing, dunning, dispute resolution, and revenue recognition";
    case "legacy_tools":
      return "the manual workflows currently handled by legacy tools";
    default:
      return "reconciliation, routing, and exception handling";
  }
}

function getSecondaryReference(account: Account, card: EvidenceCard): string {
  switch (card.signalType) {
    case "recent_funding":
      return `your recent funding and growth trajectory`;
    case "multi_country":
      return `your international expansion`;
    case "hiring_payment_ops":
      return `the payment ops hiring you're doing`;
    default:
      return `the payment complexity signals we're seeing at ${account.name}`;
  }
}

function buildLinkedInMessage(account: Account, firstName: string, card: EvidenceCard): string {
  const angle = card.signalType === "marketplace_model"
    ? "automate marketplace payouts"
    : card.signalType === "multi_country"
    ? "simplify cross-border payments"
    : card.signalType === "billing_operations"
    ? "automate billing operations"
    : "automate payment operations";

  return `Hi ${firstName} — saw ${account.name} is scaling payment ops. We help companies ${angle} with autonomous agents. Worth connecting?`;
}

function buildCallOpener(account: Account, cards: EvidenceCard[]): string[] {
  const points: string[] = [];

  if (cards[0]) {
    points.push(`Reference: ${cards[0].rawEvidence.slice(0, 80)}. Ask how they handle this today.`);
  }
  if (cards[1]) {
    points.push(`Ask about: ${cards[1].whyItMatters.slice(0, 80)}`);
  }
  points.push("Introduce autonomous payment agents as an alternative to scaling manual processes.");

  return points.slice(0, 3);
}

function buildFollowUp(account: Account, firstName: string, cards: EvidenceCard[]): string {
  const card = cards[1] || cards[0];
  return `Hi ${firstName}, following up on payment automation for ${account.name}. ${card.suggestedOutreachAngle.slice(0, 80)} Happy to show a quick demo.`;
}

function buildDiscoveryQuestions(account: Account): string[] {
  const model = account.businessModel;

  if (model === "marketplace" || model === "platform") {
    return [
      "How much time does your team spend on payment reconciliation and exception handling?",
      "What happens when a payout fails — how many people touch that exception?",
      "How are you planning to scale payment operations as transaction volume grows?",
    ];
  }
  if (model === "gig_economy") {
    return [
      "What percentage of payouts require manual intervention?",
      "How are you managing payment compliance across different jurisdictions?",
      "What's the biggest bottleneck in your payout process today?",
    ];
  }
  if (model === "saas") {
    return [
      "How much revenue do you estimate falls through due to failed dunning?",
      "How is multi-currency invoicing handled as you expand?",
      "What's the most time-consuming part of your billing workflow?",
    ];
  }

  return [
    "How much time does your team spend on payment operations weekly?",
    "What's your biggest payment-related challenge right now?",
    "How do you see payment operations scaling over the next year?",
  ];
}

function buildWhyNow(account: Account, cards: EvidenceCard[]): string {
  const signals = cards.map((c) => c.signalType);

  if (signals.includes("hiring_payment_ops") && signals.includes("recent_funding")) {
    return `${account.name} is hiring payment ops roles while growing rapidly. This signals manual processes breaking under scale — the exact moment autonomous agents deliver immediate ROI.`;
  }
  if (signals.includes("multi_country")) {
    return `${account.name} is expanding internationally, multiplying payment complexity. Cross-border operations need automation before manual processes become unsustainable.`;
  }
  if (signals.includes("legacy_tools")) {
    return `${account.name} appears to be working with legacy payment tools. Migration moments are the best time to introduce autonomous agents rather than rebuilding manual processes.`;
  }

  return `${account.name} shows payment complexity signals that align with agentic payment automation. Evidence suggests operational overhead that autonomous agents can reduce.`;
}
