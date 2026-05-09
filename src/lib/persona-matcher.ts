/**
 * Persona Matcher — title-based relevance ranking for buyer personas.
 * Prioritizes payment/finance decision makers, filters out irrelevant titles.
 */

import type { Account, BuyerPersona, EvidenceCard } from "@/types";

// Priority titles ranked by relevance (lower index = higher priority)
const PRIORITY_TITLES = [
  "cfo",
  "chief financial officer",
  "coo",
  "chief operating officer",
  "head of payments",
  "vp of payments",
  "vp payments",
  "head of finance operations",
  "vp finance",
  "vp of finance",
  "head of platform",
  "vp product",
  "operations director",
  "director of operations",
  "payment operations manager",
  "head of billing",
  "director of revenue operations",
  "head of treasury",
];

// Titles that indicate irrelevance even if keyword-matched
const EXCLUDED_TITLES = [
  "marketing",
  "content",
  "social media",
  "hr ",
  "human resources",
  "recruiter",
  "talent",
  "designer",
  "ux ",
  "ui ",
  "sales development",
  "sdr",
  "bdr",
  "customer success",
  "support",
  "intern",
];

function getTitlePriority(title: string): number {
  const lower = title.toLowerCase();
  const idx = PRIORITY_TITLES.findIndex((pt) => lower.includes(pt));
  return idx >= 0 ? idx : 999;
}

function isRelevantTitle(title: string): boolean {
  const lower = title.toLowerCase();

  // Exclude irrelevant titles
  if (EXCLUDED_TITLES.some((ex) => lower.includes(ex))) return false;

  // Must have some finance/ops/payment/product signal
  const relevantKeywords = [
    "finance", "financial", "payment", "billing", "operations",
    "ops", "treasury", "revenue", "accounting", "procurement",
    "platform", "product", "cfo", "coo", "cto", "vp", "head",
    "director", "chief", "founder", "ceo",
  ];

  return relevantKeywords.some((kw) => lower.includes(kw));
}

function generateRelevanceExplanation(persona: BuyerPersona, account: Account): string {
  const titleLower = persona.title.toLowerCase();
  const topSignal = account.evidenceCards[0];

  if (titleLower.includes("payment") || titleLower.includes("payout")) {
    return `Directly owns payment operations at ${account.name}. ${topSignal ? `Key evidence: ${topSignal.rawEvidence.slice(0, 80)}` : ""}`.trim();
  }

  if (titleLower.includes("cfo") || titleLower.includes("chief financial")) {
    return `Controls budget for payment operations and automation investments. Payment ops headcount growth makes this a CFO-level conversation.`;
  }

  if (titleLower.includes("coo") || titleLower.includes("operations")) {
    return `Oversees operational efficiency including payment workflows. Automation ROI directly impacts their KPIs.`;
  }

  if (titleLower.includes("billing") || titleLower.includes("revenue")) {
    return `Owns billing and revenue operations — the exact processes that agentic payments would automate.`;
  }

  if (titleLower.includes("platform") || titleLower.includes("product")) {
    return `Owns platform infrastructure decisions. Payment automation is a platform capability investment.`;
  }

  if (titleLower.includes("founder") || titleLower.includes("ceo")) {
    return `As founder/CEO, has authority over strategic infrastructure investments including payment automation.`;
  }

  return `Role at ${account.name} suggests involvement in payment or finance operations decisions.`;
}

/**
 * Match and rank personas for an account.
 * Returns account with personas ranked by relevance, limited to top 5.
 */
export function matchPersonas(account: Account): Account {
  // Filter to relevant personas only
  const relevant = account.personas.filter((p) => isRelevantTitle(p.title));

  // Sort by priority title ranking
  const ranked = relevant
    .sort((a, b) => getTitlePriority(a.title) - getTitlePriority(b.title))
    .slice(0, 5)
    .map((persona, i) => ({
      ...persona,
      relevanceRank: i + 1,
      relevanceExplanation: persona.relevanceExplanation || generateRelevanceExplanation(persona, account),
    }));

  // If no named contacts, recommend target titles
  if (ranked.length === 0) {
    const recommendedTitles = getRecommendedTitles(account);
    // Add placeholder personas with recommendations
    ranked.push({
      id: `persona-rec-${account.id.slice(0, 6)}`,
      name: "(Recommended search)",
      title: recommendedTitles[0] || "Head of Payments",
      relevanceExplanation: `No named contacts found. Recommended target titles: ${recommendedTitles.join(", ")}. Search LinkedIn for "${account.name} ${recommendedTitles[0]}".`,
      relevanceRank: 1,
    });
  }

  return {
    ...account,
    personas: ranked,
  };
}

function getRecommendedTitles(account: Account): string[] {
  const model = account.businessModel;

  if (model === "marketplace" || model === "platform" || model === "gig_economy") {
    return ["Head of Payments", "VP Platform Operations", "COO"];
  }
  if (model === "saas") {
    return ["Director of Revenue Operations", "VP Finance", "Head of Billing"];
  }
  if (model === "logistics") {
    return ["CFO", "Head of Finance Operations", "Payment Operations Manager"];
  }
  return ["CFO", "Head of Payments", "VP Finance"];
}

/**
 * Match personas for multiple accounts.
 */
export function matchPersonasForAccounts(accounts: Account[]): Account[] {
  return accounts.map(matchPersonas);
}
