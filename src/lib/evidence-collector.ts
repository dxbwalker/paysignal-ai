/**
 * Evidence Collector — detects payment complexity signals from LinkedIn metadata.
 * Produces Evidence_Cards with all required fields.
 */

import type { Account, EvidenceCard, SignalType, ScoringDimension, ConfidenceLevel, SourceReliability } from "@/types";

interface SignalPattern {
  keywords: string[];
  signalType: SignalType;
  dimension: ScoringDimension;
  whyItMatters: string;
  outreachAngle: string;
}

const TITLE_PATTERNS: SignalPattern[] = [
  {
    keywords: ["payment", "payout", "settlement"],
    signalType: "payment_role",
    dimension: "payment_complexity",
    whyItMatters: "Dedicated payment roles indicate significant payment operations complexity.",
    outreachAngle: "Reference their payment operations scale and how agents reduce manual workload.",
  },
  {
    keywords: ["billing", "invoicing", "revenue operations"],
    signalType: "billing_operations",
    dimension: "payment_complexity",
    whyItMatters: "Billing operations roles suggest complex invoicing or subscription management.",
    outreachAngle: "Ask about billing complexity and how much time is spent on manual invoicing.",
  },
  {
    keywords: ["accounts payable", "ap ", "ap manager", "procurement"],
    signalType: "ap_management",
    dimension: "automation_fit",
    whyItMatters: "AP roles indicate vendor payment volume that could benefit from automation.",
    outreachAngle: "Reference their vendor payment volume and how agents handle AP workflows.",
  },
  {
    keywords: ["reconciliation", "finance operations", "financial operations"],
    signalType: "manual_reconciliation",
    dimension: "automation_fit",
    whyItMatters: "Reconciliation roles signal manual processes ripe for autonomous automation.",
    outreachAngle: "Ask about reconciliation time and error rates in their current process.",
  },
  {
    keywords: ["cfo", "chief financial", "vp finance", "head of finance", "director of finance"],
    signalType: "decision_maker_present",
    dimension: "buyer_accessibility",
    whyItMatters: "Senior finance leadership can authorize payment automation investments.",
    outreachAngle: "Position the conversation around ROI and operational efficiency at the executive level.",
  },
  {
    keywords: ["head of payments", "vp payments", "director of payments", "payment operations manager"],
    signalType: "decision_maker_present",
    dimension: "buyer_accessibility",
    whyItMatters: "Payment leadership directly owns the processes that agentic payments would automate.",
    outreachAngle: "Speak directly to their payment operations challenges and automation goals.",
  },
];

const COMPANY_PATTERNS: SignalPattern[] = [
  {
    keywords: ["marketplace", "two-sided", "multi-sided"],
    signalType: "marketplace_model",
    dimension: "payment_complexity",
    whyItMatters: "Marketplace models require complex multi-party payment splitting and settlement.",
    outreachAngle: "Reference marketplace payout complexity and how agents handle split logic.",
  },
  {
    keywords: ["gig", "freelance", "on-demand", "driver", "courier"],
    signalType: "complex_payouts",
    dimension: "payment_complexity",
    whyItMatters: "Gig platforms process high-volume payouts to many workers with compliance requirements.",
    outreachAngle: "Ask about payout volume, frequency, and cross-border compliance challenges.",
  },
  {
    keywords: ["international", "global", "cross-border", "multi-country"],
    signalType: "multi_country",
    dimension: "payment_complexity",
    whyItMatters: "International operations multiply payment complexity through currencies, compliance, and routing.",
    outreachAngle: "Reference cross-border payment challenges and how agents handle multi-currency routing.",
  },
  {
    keywords: ["series a", "series b", "series c", "raised", "funding"],
    signalType: "recent_funding",
    dimension: "operational_urgency",
    whyItMatters: "Recent funding signals budget availability and growth pressure on operations.",
    outreachAngle: "Reference their growth trajectory and how payment ops needs to scale with it.",
  },
];

const HIRING_PATTERNS: SignalPattern[] = [
  {
    keywords: ["payment operations", "billing specialist", "ap analyst", "reconciliation"],
    signalType: "hiring_payment_ops",
    dimension: "operational_urgency",
    whyItMatters: "Hiring for payment ops roles signals manual processes that need more headcount to maintain.",
    outreachAngle: "Position agents as an alternative to hiring — automate instead of adding headcount.",
  },
];

const TOOL_PATTERNS: SignalPattern[] = [
  {
    keywords: ["bill.com", "tipalti", "sap", "netsuite", "oracle", "quickbooks", "xero"],
    signalType: "legacy_tools",
    dimension: "automation_fit",
    whyItMatters: "Legacy financial tools suggest manual payment processes that could be automated.",
    outreachAngle: "Reference their current tooling and how agents provide a modern autonomous alternative.",
  },
];

/**
 * Collect evidence from account metadata (personas, company info).
 * Returns the account with evidenceCards populated.
 */
export function collectEvidence(account: Account): Account {
  const cards: EvidenceCard[] = [];
  let cardIndex = 0;

  const generateId = () => `ev-${account.id.slice(0, 8)}-${++cardIndex}`;

  // Scan persona titles
  for (const persona of account.personas) {
    const titleLower = persona.title.toLowerCase();

    for (const pattern of TITLE_PATTERNS) {
      if (pattern.keywords.some((kw) => titleLower.includes(kw))) {
        cards.push({
          id: generateId(),
          signalType: pattern.signalType,
          evidenceType: "observed",
          rawEvidence: `${persona.name} holds the title "${persona.title}" at ${account.name}.`,
          sourceLabel: "LinkedIn Profile",
          sourceOrigin: "linkedin",
          sourceReliability: "high",
          confidenceLevel: "high",
          whyItMatters: pattern.whyItMatters,
          suggestedOutreachAngle: pattern.outreachAngle,
          dimension: pattern.dimension,
        });
        break; // One card per persona
      }
    }
  }

  // Scan company metadata
  const companyText = `${account.name} ${account.industry || ""} ${account.businessModel}`.toLowerCase();

  for (const pattern of COMPANY_PATTERNS) {
    if (pattern.keywords.some((kw) => companyText.includes(kw))) {
      cards.push({
        id: generateId(),
        signalType: pattern.signalType,
        evidenceType: "inferred",
        rawEvidence: `${account.name} appears to be a ${account.businessModel.replace("_", " ")} company${account.industry ? ` in ${account.industry}` : ""}.`,
        sourceLabel: "LinkedIn Company Page",
        sourceOrigin: "linkedin",
        sourceReliability: "medium",
        inferenceExplanation: `Business model classification "${account.businessModel}" suggests ${pattern.signalType.replace(/_/g, " ")} based on company metadata.`,
        confidenceLevel: "medium",
        whyItMatters: pattern.whyItMatters,
        suggestedOutreachAngle: pattern.outreachAngle,
        dimension: pattern.dimension,
      });
    }
  }

  // Scan for funding signals
  if (account.fundingStage) {
    const fundingLower = account.fundingStage.toLowerCase();
    for (const pattern of COMPANY_PATTERNS) {
      if (pattern.signalType === "recent_funding" && pattern.keywords.some((kw) => fundingLower.includes(kw))) {
        cards.push({
          id: generateId(),
          signalType: "recent_funding",
          evidenceType: "observed",
          rawEvidence: `${account.name} is at ${account.fundingStage} stage.`,
          sourceLabel: "LinkedIn Company Page",
          sourceOrigin: "linkedin",
          sourceReliability: "medium",
          confidenceLevel: "medium",
          whyItMatters: "Recent funding signals budget availability and growth pressure on operations.",
          suggestedOutreachAngle: "Reference their growth trajectory and how payment ops needs to scale with it.",
          dimension: "operational_urgency",
        });
        break;
      }
    }
  }

  // Scan persona titles for hiring patterns (if title suggests ops role)
  for (const persona of account.personas) {
    const titleLower = persona.title.toLowerCase();
    for (const pattern of HIRING_PATTERNS) {
      if (pattern.keywords.some((kw) => titleLower.includes(kw))) {
        cards.push({
          id: generateId(),
          signalType: pattern.signalType,
          evidenceType: "inferred",
          rawEvidence: `${account.name} has a "${persona.title}" role, suggesting active payment operations staffing.`,
          sourceLabel: "LinkedIn Profile",
          sourceOrigin: "linkedin",
          sourceReliability: "medium",
          inferenceExplanation: "Presence of this role title suggests the company invests in payment operations headcount.",
          confidenceLevel: "medium",
          whyItMatters: pattern.whyItMatters,
          suggestedOutreachAngle: pattern.outreachAngle,
          dimension: pattern.dimension,
        });
        break;
      }
    }
  }

  // Scan for tool mentions in persona descriptions/titles
  for (const persona of account.personas) {
    const text = `${persona.title} ${persona.relevanceExplanation}`.toLowerCase();
    for (const pattern of TOOL_PATTERNS) {
      if (pattern.keywords.some((kw) => text.includes(kw))) {
        cards.push({
          id: generateId(),
          signalType: pattern.signalType,
          evidenceType: "inferred",
          rawEvidence: `Employee at ${account.name} mentions legacy financial tools in their profile.`,
          sourceLabel: "LinkedIn Profile",
          sourceOrigin: "linkedin",
          sourceReliability: "low",
          inferenceExplanation: "Tool mention in individual profile does not confirm company-wide usage.",
          confidenceLevel: "low",
          whyItMatters: pattern.whyItMatters,
          suggestedOutreachAngle: pattern.outreachAngle,
          dimension: pattern.dimension,
        });
        break;
      }
    }
  }

  // Deduplicate by signal type (keep first/strongest)
  const seen = new Set<string>();
  const dedupedCards = cards.filter((card) => {
    const key = `${card.signalType}-${card.dimension}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Flag low-confidence if no evidence found
  const hasEvidence = dedupedCards.length > 0;

  return {
    ...account,
    evidenceCards: [...account.evidenceCards, ...dedupedCards],
    status: "evidence_collected",
    lowEvidenceWarning: !hasEvidence,
  };
}

/**
 * Collect evidence for multiple accounts.
 */
export function collectEvidenceForAccounts(accounts: Account[]): Account[] {
  return accounts.map(collectEvidence);
}
