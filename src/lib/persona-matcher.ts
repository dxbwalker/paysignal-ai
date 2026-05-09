/**
 * Persona Matcher — title-based relevance ranking for buyer personas.
 *
 * Prioritizes payment/finance decision makers, filters out irrelevant titles,
 * generates relevance explanations linking persona to account evidence signals,
 * and recommends target titles when no named contacts are available.
 *
 * Requirements: 6.1-6.6
 */

import type { Account, BuyerPersona, EvidenceCard } from "@/types";

// Priority titles ranked by relevance (lower index = higher priority)
// Requirement 6.2: CFO, COO, Head of Payments, Head of Finance Operations,
// VP Product, Head of Platform, Operations Director, Payment Operations Manager
const PRIORITY_TITLES: string[] = [
  "cfo",
  "chief financial officer",
  "coo",
  "chief operating officer",
  "head of payments",
  "vp of payments",
  "vp payments",
  "head of finance operations",
  "head of finance ops",
  "vp finance",
  "vp of finance",
  "vp product",
  "head of platform",
  "operations director",
  "director of operations",
  "payment operations manager",
  "payment ops manager",
  "head of billing",
  "director of revenue operations",
  "head of treasury",
];

// Requirement 6.4: Low-relevance titles to filter out even if keyword-matched
const LOW_RELEVANCE_TITLES: string[] = [
  "marketing",
  "content",
  "social media",
  "hr ",
  "human resources",
  "recruiter",
  "recruiting",
  "talent acquisition",
  "talent ",
  "designer",
  "design ",
  "ux ",
  "ui ",
  "sales development",
  "sales representative",
  "sales manager",
  "account executive",
  "sdr",
  "bdr",
  "customer success",
  "support",
  "intern",
  "engineering manager",
  "software engineer",
  "frontend",
  "backend",
  "devops",
  "data scientist",
  "machine learning",
];

/**
 * Check if a title contains engineering keywords but is payment-related
 * (payment engineers are relevant, generic engineers are not).
 */
function isPaymentRelatedEngineering(title: string): boolean {
  const lower = title.toLowerCase();
  const engineeringTerms = ["engineer", "engineering", "developer"];
  const paymentTerms = ["payment", "billing", "fintech", "finance", "payout"];

  const isEngineering = engineeringTerms.some((t) => lower.includes(t));
  const isPaymentRelated = paymentTerms.some((t) => lower.includes(t));

  return isEngineering && isPaymentRelated;
}

/**
 * Get the priority rank for a title. Lower = higher priority.
 * Returns 999 if not in the priority list.
 */
function getTitlePriority(title: string): number {
  const lower = title.toLowerCase();
  const idx = PRIORITY_TITLES.findIndex((pt) => lower.includes(pt));
  return idx >= 0 ? idx : 999;
}

/**
 * Requirement 6.4: Filter out personas whose title does not indicate
 * decision-making authority or operational responsibility for payments,
 * finance operations, or platform/product infrastructure.
 */
function isRelevantTitle(title: string): boolean {
  const lower = title.toLowerCase();

  // Payment-related engineering is relevant
  if (isPaymentRelatedEngineering(lower)) return true;

  // Exclude low-relevance titles
  if (LOW_RELEVANCE_TITLES.some((ex) => lower.includes(ex))) return false;

  // Must have some finance/ops/payment/product signal
  const relevantKeywords = [
    "finance",
    "financial",
    "payment",
    "billing",
    "operations",
    "ops",
    "treasury",
    "revenue",
    "accounting",
    "procurement",
    "platform",
    "product",
    "cfo",
    "coo",
    "cto",
    "vp",
    "head",
    "director",
    "chief",
    "founder",
    "ceo",
    "payout",
    "reconciliation",
  ];

  return relevantKeywords.some((kw) => lower.includes(kw));
}

/**
 * Requirement 6.3: Generate 1-3 sentence relevance explanation linking
 * the persona's role to at least one payment complexity signal from
 * the account's Evidence_Cards.
 */
function generateRelevanceExplanation(
  persona: BuyerPersona,
  account: Account
): string {
  const titleLower = persona.title.toLowerCase();
  const evidenceCards = account.evidenceCards || [];

  // Find the most relevant evidence card for this persona
  const relevantEvidence = findRelevantEvidence(titleLower, evidenceCards);
  const evidenceSuffix = relevantEvidence
    ? ` Evidence: ${relevantEvidence.rawEvidence.slice(0, 100).trim()}.`
    : "";

  if (titleLower.includes("payment") || titleLower.includes("payout")) {
    return `Directly owns payment operations at ${account.name}, making them the primary decision-maker for payment automation.${evidenceSuffix}`;
  }

  if (titleLower.includes("cfo") || titleLower.includes("chief financial")) {
    return `Controls budget for payment operations and automation investments at ${account.name}. Payment ops complexity makes this a CFO-level conversation.${evidenceSuffix}`;
  }

  if (titleLower.includes("coo") || titleLower.includes("chief operating")) {
    return `Oversees operational efficiency including payment workflows at ${account.name}. Automation ROI directly impacts their KPIs.${evidenceSuffix}`;
  }

  if (titleLower.includes("billing") || titleLower.includes("revenue")) {
    return `Owns billing and revenue operations at ${account.name} — the exact processes that payment automation would streamline.${evidenceSuffix}`;
  }

  if (titleLower.includes("platform")) {
    return `Owns platform infrastructure decisions at ${account.name}. Payment automation is a core platform capability investment.${evidenceSuffix}`;
  }

  if (titleLower.includes("product")) {
    return `Leads product strategy at ${account.name}. Payment infrastructure decisions fall within their scope for platform capabilities.${evidenceSuffix}`;
  }

  if (
    titleLower.includes("operations director") ||
    titleLower.includes("director of operations")
  ) {
    return `Directs operations at ${account.name}, including payment and finance workflows that benefit from automation.${evidenceSuffix}`;
  }

  if (titleLower.includes("founder") || titleLower.includes("ceo")) {
    return `As founder/CEO of ${account.name}, has authority over strategic infrastructure investments including payment automation.${evidenceSuffix}`;
  }

  if (titleLower.includes("finance") || titleLower.includes("treasury")) {
    return `Manages finance operations at ${account.name}, directly involved in payment process decisions.${evidenceSuffix}`;
  }

  return `Role at ${account.name} suggests involvement in payment or finance operations decisions.${evidenceSuffix}`;
}

/**
 * Find the most relevant evidence card for a given persona title.
 */
function findRelevantEvidence(
  titleLower: string,
  evidenceCards: EvidenceCard[]
): EvidenceCard | undefined {
  if (evidenceCards.length === 0) return undefined;

  // Map title keywords to relevant signal types
  const titleSignalMap: Record<string, string[]> = {
    payment: ["complex_payouts", "billing_operations", "payment_role"],
    payout: ["complex_payouts", "marketplace_model"],
    billing: ["billing_operations", "legacy_tools"],
    finance: ["ap_management", "finance_ops_growth"],
    operations: ["billing_operations", "manual_reconciliation"],
    platform: ["marketplace_model", "complex_payouts"],
    product: ["marketplace_model", "complex_payouts"],
    cfo: ["finance_ops_growth", "ap_management", "recent_funding"],
    coo: ["billing_operations", "manual_reconciliation"],
    revenue: ["billing_operations", "complex_payouts"],
  };

  // Find matching signal types for this title
  const matchingSignals: string[] = [];
  for (const [keyword, signals] of Object.entries(titleSignalMap)) {
    if (titleLower.includes(keyword)) {
      matchingSignals.push(...signals);
    }
  }

  // Find evidence card matching the persona's domain
  if (matchingSignals.length > 0) {
    const match = evidenceCards.find((ec) =>
      matchingSignals.includes(ec.signalType)
    );
    if (match) return match;
  }

  // Fallback: return highest-confidence evidence card
  const sorted = [...evidenceCards].sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    return (confOrder[a.confidenceLevel] ?? 2) - (confOrder[b.confidenceLevel] ?? 2);
  });

  return sorted[0];
}

/**
 * Match and rank personas for an account.
 * Returns account with personas ranked by relevance, limited to top 5.
 *
 * Requirement 6.1: Up to 5 relevant buyer personas, ranked by relevance
 * Requirement 6.2: Priority title ranking
 * Requirement 6.4: Filter out low-relevance titles
 * Requirement 6.5: Attach contact information
 */
export function matchPersonas(account: Account): Account {
  // Filter to relevant personas only (Requirement 6.4)
  const relevant = account.personas.filter((p) => isRelevantTitle(p.title));

  // Sort by priority title ranking (Requirement 6.2)
  // Limit to top 5 (Requirement 6.1)
  const ranked = relevant
    .sort((a, b) => getTitlePriority(a.title) - getTitlePriority(b.title))
    .slice(0, 5)
    .map((persona, i) => ({
      ...persona,
      relevanceRank: i + 1,
      // Requirement 6.3: Generate relevance explanation
      relevanceExplanation:
        persona.relevanceExplanation ||
        generateRelevanceExplanation(persona, account),
    }));

  return {
    ...account,
    personas: ranked,
  };
}

/**
 * Requirement 6.6: When no named contacts are available, recommend
 * 1-3 target titles and 1-2 search queries tailored to the account's
 * payment complexity.
 */
export function recommendTargetTitles(account: Account): {
  titles: string[];
  searchQueries: string[];
} {
  const model = account.businessModel;
  const evidenceCards = account.evidenceCards || [];

  // Determine recommended titles based on business model and evidence
  let titles: string[];

  if (
    model === "marketplace" ||
    model === "platform" ||
    model === "gig_economy"
  ) {
    titles = ["Head of Payments", "VP Platform Operations", "COO"];
  } else if (model === "saas") {
    titles = ["Director of Revenue Operations", "VP Finance", "Head of Billing"];
  } else if (model === "logistics") {
    titles = [
      "CFO",
      "Head of Finance Operations",
      "Payment Operations Manager",
    ];
  } else if (model === "creator_economy") {
    titles = ["Head of Payments", "VP Product", "Head of Platform"];
  } else if (model === "healthcare_payments") {
    titles = ["CFO", "Head of Payments", "Operations Director"];
  } else {
    titles = ["CFO", "Head of Payments", "VP Finance"];
  }

  // Refine based on evidence signals
  const hasPaymentRole = evidenceCards.some(
    (ec) => ec.signalType === "payment_role"
  );
  const hasMarketplace = evidenceCards.some(
    (ec) => ec.signalType === "marketplace_model"
  );
  const hasFinanceGrowth = evidenceCards.some(
    (ec) => ec.signalType === "finance_ops_growth"
  );

  if (hasPaymentRole && !titles.includes("Head of Payments")) {
    titles[0] = "Head of Payments";
  }
  if (hasMarketplace && !titles.includes("VP Platform Operations")) {
    titles = ["Head of Payments", "VP Platform Operations", ...titles.slice(2)];
  }
  if (hasFinanceGrowth && !titles.includes("CFO")) {
    titles.push("CFO");
  }

  // Limit to 3 titles
  titles = titles.slice(0, 3);

  // Generate 1-2 search queries tailored to the account
  const searchQueries: string[] = [
    `"${account.name}" ${titles[0]} LinkedIn`,
  ];

  if (titles.length > 1) {
    searchQueries.push(
      `"${account.name}" payments OR finance operations site:linkedin.com`
    );
  }

  return { titles, searchQueries: searchQueries.slice(0, 2) };
}

/**
 * Match personas for multiple accounts.
 * For accounts with no relevant personas after matching, adds
 * recommended target title placeholders.
 */
export function matchPersonasForAccounts(accounts: Account[]): Account[] {
  return accounts.map((account) => {
    const matched = matchPersonas(account);

    // Requirement 6.6: If no named contacts, recommend target titles
    if (matched.personas.length === 0) {
      const { titles, searchQueries } = recommendTargetTitles(account);
      const recommendedPersona: BuyerPersona = {
        id: `persona-rec-${account.id.slice(0, 8)}`,
        name: "(Recommended search)",
        title: titles[0] || "Head of Payments",
        relevanceExplanation: `No named contacts found. Recommended target titles: ${titles.join(", ")}. Search: ${searchQueries[0]}`,
        relevanceRank: 1,
      };
      return {
        ...matched,
        personas: [recommendedPersona],
      };
    }

    return matched;
  });
}
