/**
 * Evidence Collector — detects payment complexity signals from LinkedIn metadata.
 * Produces Evidence_Cards with all required fields.
 *
 * Requirements: 3.1-3.8
 * - Gathers observable payment complexity signals from LinkedIn data (within 10s per account)
 * - Detects signals from: job titles, company descriptions, business model indicators,
 *   geographic presence, and hiring patterns
 * - Assigns source reliability: high (direct company/job data), medium (inferred from titles),
 *   low (indirect indicators)
 * - Handles incomplete metadata: proceeds with available data, reduces confidence, notes missing fields
 * - Flags accounts with no evidence as low-confidence with absent signal categories listed
 */

import type {
  Account,
  EvidenceCard,
  SignalType,
  ScoringDimension,
  ConfidenceLevel,
  SourceReliability,
} from "@/types";

interface SignalPattern {
  keywords: string[];
  signalType: SignalType;
  dimension: ScoringDimension;
  whyItMatters: string;
  outreachAngle: string;
}

// --- Signal Pattern Definitions ---

const TITLE_PATTERNS: SignalPattern[] = [
  {
    keywords: ["payment", "payout", "settlement"],
    signalType: "payment_role",
    dimension: "payment_complexity",
    whyItMatters:
      "Dedicated payment roles indicate significant payment operations complexity.",
    outreachAngle:
      "Reference their payment operations scale and how agents reduce manual workload.",
  },
  {
    keywords: ["billing", "invoicing", "revenue operations"],
    signalType: "billing_operations",
    dimension: "payment_complexity",
    whyItMatters:
      "Billing operations roles suggest complex invoicing or subscription management.",
    outreachAngle:
      "Ask about billing complexity and how much time is spent on manual invoicing.",
  },
  {
    keywords: ["accounts payable", "ap ", "ap manager", "procurement"],
    signalType: "ap_management",
    dimension: "automation_fit",
    whyItMatters:
      "AP roles indicate vendor payment volume that could benefit from automation.",
    outreachAngle:
      "Reference their vendor payment volume and how agents handle AP workflows.",
  },
  {
    keywords: ["reconciliation", "finance operations", "financial operations", "finance ops"],
    signalType: "manual_reconciliation",
    dimension: "automation_fit",
    whyItMatters:
      "Reconciliation roles signal manual processes ripe for autonomous automation.",
    outreachAngle:
      "Ask about reconciliation time and error rates in their current process.",
  },
  {
    keywords: [
      "cfo",
      "chief financial",
      "vp finance",
      "head of finance",
      "director of finance",
    ],
    signalType: "decision_maker_present",
    dimension: "buyer_accessibility",
    whyItMatters:
      "Senior finance leadership can authorize payment automation investments.",
    outreachAngle:
      "Position the conversation around ROI and operational efficiency at the executive level.",
  },
  {
    keywords: [
      "head of payments",
      "vp payments",
      "director of payments",
      "payment operations manager",
    ],
    signalType: "decision_maker_present",
    dimension: "buyer_accessibility",
    whyItMatters:
      "Payment leadership directly owns the processes that agentic payments would automate.",
    outreachAngle:
      "Speak directly to their payment operations challenges and automation goals.",
  },
];

const COMPANY_DESCRIPTION_PATTERNS: SignalPattern[] = [
  {
    keywords: ["marketplace", "two-sided", "multi-sided", "sellers and buyers", "buyers and sellers"],
    signalType: "marketplace_model",
    dimension: "payment_complexity",
    whyItMatters:
      "Marketplace models require complex multi-party payment splitting and settlement.",
    outreachAngle:
      "Reference marketplace payout complexity and how agents handle split logic.",
  },
  {
    keywords: ["gig", "freelance", "on-demand", "driver", "courier"],
    signalType: "complex_payouts",
    dimension: "payment_complexity",
    whyItMatters:
      "Gig platforms process high-volume payouts to many workers with compliance requirements.",
    outreachAngle:
      "Ask about payout volume, frequency, and cross-border compliance challenges.",
  },
  {
    keywords: ["payout", "disbursement", "split payment", "multi-party"],
    signalType: "complex_payouts",
    dimension: "payment_complexity",
    whyItMatters:
      "Complex payout structures indicate payment orchestration needs beyond simple transfers.",
    outreachAngle:
      "Reference their payout complexity and how agents automate disbursement logic.",
  },
  {
    keywords: ["international", "global", "cross-border", "multi-country"],
    signalType: "multi_country",
    dimension: "payment_complexity",
    whyItMatters:
      "International operations multiply payment complexity through currencies, compliance, and routing.",
    outreachAngle:
      "Reference cross-border payment challenges and how agents handle multi-currency routing.",
  },
  {
    keywords: ["billing", "invoicing", "subscription"],
    signalType: "billing_operations",
    dimension: "payment_complexity",
    whyItMatters:
      "Billing and subscription operations create recurring payment complexity at scale.",
    outreachAngle:
      "Ask about billing automation gaps and how much manual work invoicing requires.",
  },
  {
    keywords: ["reconciliation", "exception handling", "manual process"],
    signalType: "manual_reconciliation",
    dimension: "automation_fit",
    whyItMatters:
      "Mentions of reconciliation or manual processes signal automation opportunities.",
    outreachAngle:
      "Reference their reconciliation challenges and how agents handle exceptions autonomously.",
  },
  {
    keywords: ["series a", "series b", "series c", "raised", "funding"],
    signalType: "recent_funding",
    dimension: "operational_urgency",
    whyItMatters:
      "Recent funding signals budget availability and growth pressure on operations.",
    outreachAngle:
      "Reference their growth trajectory and how payment ops needs to scale with it.",
  },
];

const LOCATION_PATTERNS: SignalPattern[] = [
  {
    keywords: ["international", "global", "cross-border", "multi-country", "worldwide"],
    signalType: "multi_country",
    dimension: "payment_complexity",
    whyItMatters:
      "Multi-country presence indicates cross-border payment complexity.",
    outreachAngle:
      "Reference their international footprint and how agents handle multi-currency routing.",
  },
];

const HIRING_PATTERNS: SignalPattern[] = [
  {
    keywords: [
      "payment operations",
      "billing specialist",
      "ap analyst",
      "reconciliation",
      "payment ops",
      "finance ops",
    ],
    signalType: "hiring_payment_ops",
    dimension: "operational_urgency",
    whyItMatters:
      "Hiring for payment ops roles signals manual processes that need more headcount to maintain.",
    outreachAngle:
      "Position agents as an alternative to hiring — automate instead of adding headcount.",
  },
];

const TOOL_PATTERNS: SignalPattern[] = [
  {
    keywords: [
      "bill.com",
      "tipalti",
      "sap",
      "netsuite",
      "oracle",
      "quickbooks",
      "xero",
    ],
    signalType: "legacy_tools",
    dimension: "automation_fit",
    whyItMatters:
      "Legacy financial tools suggest manual payment processes that could be automated.",
    outreachAngle:
      "Reference their current tooling and how agents provide a modern autonomous alternative.",
  },
];

// --- Signal Categories for absence reporting ---

const SIGNAL_CATEGORIES = [
  "job_titles",
  "company_description",
  "business_model_indicators",
  "geographic_presence",
  "hiring_patterns",
] as const;

type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

interface CollectionResult {
  account: Account;
  checkedCategories: SignalCategory[];
  foundCategories: SignalCategory[];
  missingMetadataFields: string[];
}

/**
 * Determine which metadata fields are missing or incomplete for an account.
 */
function detectMissingMetadata(account: Account): string[] {
  const missing: string[] = [];

  if (!account.personas || account.personas.length === 0) {
    missing.push("personas/contacts");
  }

  if (!account.industry) {
    missing.push("industry");
  }

  if (!account.location || account.location.trim() === "") {
    missing.push("location");
  }

  if (!account.website) {
    missing.push("website");
  }

  if (!account.linkedinUrl) {
    missing.push("linkedinUrl");
  }

  if (!account.employeeCount) {
    missing.push("employeeCount");
  }

  if (!account.fundingStage) {
    missing.push("fundingStage");
  }

  return missing;
}

/**
 * Determine confidence level based on missing metadata.
 * More missing fields = lower confidence.
 */
function adjustConfidenceForMissingData(
  baseConfidence: ConfidenceLevel,
  missingFields: string[]
): ConfidenceLevel {
  if (missingFields.length === 0) return baseConfidence;

  // If many fields are missing, reduce confidence
  if (missingFields.length >= 4) {
    return "low";
  }

  if (missingFields.length >= 2 && baseConfidence === "high") {
    return "medium";
  }

  return baseConfidence;
}

/**
 * Collect evidence from account metadata (personas, company info).
 * Returns the account with evidenceCards populated.
 *
 * Handles incomplete metadata by:
 * - Proceeding with available data
 * - Reducing confidence levels when metadata is limited
 * - Noting which fields were unavailable
 */
export function collectEvidence(account: Account): CollectionResult {
  const cards: EvidenceCard[] = [];
  let cardIndex = 0;
  const foundCategories = new Set<SignalCategory>();
  const checkedCategories = new Set<SignalCategory>(SIGNAL_CATEGORIES);

  const missingMetadataFields = detectMissingMetadata(account);

  const generateId = () => `ev-${account.id.slice(0, 8)}-${++cardIndex}`;

  // --- Scan persona titles (job_titles category) ---
  if (account.personas && account.personas.length > 0) {
    for (const persona of account.personas) {
      const titleLower = persona.title.toLowerCase();

      for (const pattern of TITLE_PATTERNS) {
        if (pattern.keywords.some((kw) => titleLower.includes(kw))) {
          const confidence = adjustConfidenceForMissingData("high", missingMetadataFields);
          cards.push({
            id: generateId(),
            signalType: pattern.signalType,
            evidenceType: "observed",
            rawEvidence: `${persona.name} holds the title "${persona.title}" at ${account.name}.`,
            sourceLabel: "LinkedIn Profile",
            sourceOrigin: "linkedin",
            sourceReliability: "high" as SourceReliability,
            confidenceLevel: confidence,
            whyItMatters: pattern.whyItMatters,
            suggestedOutreachAngle: pattern.outreachAngle,
            dimension: pattern.dimension,
          });
          foundCategories.add("job_titles");
          break; // One card per persona
        }
      }
    }
  }

  // --- Scan company description / metadata (company_description category) ---
  const companyDescription = [
    account.name,
    account.industry || "",
    account.businessModel,
    account.website || "",
  ]
    .join(" ")
    .toLowerCase();

  for (const pattern of COMPANY_DESCRIPTION_PATTERNS) {
    if (pattern.keywords.some((kw) => companyDescription.includes(kw))) {
      const reliability: SourceReliability = account.industry ? "medium" : "low";
      const confidence = adjustConfidenceForMissingData(
        reliability === "medium" ? "medium" : "low",
        missingMetadataFields
      );

      cards.push({
        id: generateId(),
        signalType: pattern.signalType,
        evidenceType: "inferred",
        rawEvidence: `${account.name} appears to be a ${account.businessModel.replace(/_/g, " ")} company${account.industry ? ` in ${account.industry}` : ""}.`,
        sourceLabel: "LinkedIn Company Page",
        sourceOrigin: "linkedin",
        sourceReliability: reliability,
        inferenceExplanation: `Business model classification "${account.businessModel}" and company metadata suggest ${pattern.signalType.replace(/_/g, " ")}.`,
        confidenceLevel: confidence,
        whyItMatters: pattern.whyItMatters,
        suggestedOutreachAngle: pattern.outreachAngle,
        dimension: pattern.dimension,
      });
      foundCategories.add("company_description");
    }
  }

  // --- Scan business model indicators (business_model_indicators category) ---
  const businessModelSignals: Record<string, SignalPattern> = {
    marketplace: {
      keywords: [],
      signalType: "marketplace_model",
      dimension: "payment_complexity",
      whyItMatters:
        "Marketplace business model inherently involves multi-party payment flows.",
      outreachAngle:
        "Reference marketplace payment splitting complexity and how agents orchestrate multi-party flows.",
    },
    gig_economy: {
      keywords: [],
      signalType: "complex_payouts",
      dimension: "payment_complexity",
      whyItMatters:
        "Gig economy platforms require high-frequency payouts to many workers.",
      outreachAngle:
        "Ask about payout frequency, worker count, and compliance across jurisdictions.",
    },
    platform: {
      keywords: [],
      signalType: "complex_payouts",
      dimension: "payment_complexity",
      whyItMatters:
        "Platform models often involve payment flows between multiple parties.",
      outreachAngle:
        "Reference platform payment orchestration needs and how agents handle multi-party logic.",
    },
  };

  const modelPattern = businessModelSignals[account.businessModel];
  if (modelPattern) {
    const confidence = adjustConfidenceForMissingData("medium", missingMetadataFields);
    cards.push({
      id: generateId(),
      signalType: modelPattern.signalType,
      evidenceType: "inferred",
      rawEvidence: `${account.name} is classified as a ${account.businessModel.replace(/_/g, " ")} business, which typically involves complex payment flows.`,
      sourceLabel: "LinkedIn Company Page",
      sourceOrigin: "linkedin",
      sourceReliability: "medium" as SourceReliability,
      inferenceExplanation: `Business model "${account.businessModel}" is associated with ${modelPattern.signalType.replace(/_/g, " ")} based on industry patterns.`,
      confidenceLevel: confidence,
      whyItMatters: modelPattern.whyItMatters,
      suggestedOutreachAngle: modelPattern.outreachAngle,
      dimension: modelPattern.dimension,
    });
    foundCategories.add("business_model_indicators");
  }

  // --- Scan geographic presence (geographic_presence category) ---
  const locationText = (account.location || "").toLowerCase();

  // Check for multi-country indicators in location
  const multiCountryIndicators = [
    // Multiple locations separated by commas or slashes
    /,.*,/,
    /\//,
    // Explicit multi-country keywords
    /international/i,
    /global/i,
    /cross-border/i,
    /multi-country/i,
    /worldwide/i,
  ];

  const hasMultiCountry =
    multiCountryIndicators.some((pattern) => pattern.test(account.location || "")) ||
    LOCATION_PATTERNS[0].keywords.some((kw) => locationText.includes(kw));

  if (hasMultiCountry) {
    const confidence = adjustConfidenceForMissingData("medium", missingMetadataFields);
    cards.push({
      id: generateId(),
      signalType: "multi_country",
      evidenceType: "inferred",
      rawEvidence: `${account.name} has presence in multiple locations: "${account.location}".`,
      sourceLabel: "LinkedIn Company Page",
      sourceOrigin: "linkedin",
      sourceReliability: "medium" as SourceReliability,
      inferenceExplanation:
        "Multiple geographic locations suggest cross-border payment operations.",
      confidenceLevel: confidence,
      whyItMatters:
        "Multi-country presence indicates cross-border payment complexity through currencies, compliance, and routing.",
      suggestedOutreachAngle:
        "Reference their international footprint and how agents handle multi-currency routing.",
      dimension: "payment_complexity",
    });
    foundCategories.add("geographic_presence");
  }

  // --- Scan for funding signals ---
  if (account.fundingStage) {
    const fundingLower = account.fundingStage.toLowerCase();
    const fundingKeywords = ["series a", "series b", "series c", "raised", "funding"];
    if (fundingKeywords.some((kw) => fundingLower.includes(kw))) {
      cards.push({
        id: generateId(),
        signalType: "recent_funding",
        evidenceType: "observed",
        rawEvidence: `${account.name} is at ${account.fundingStage} stage.`,
        sourceLabel: "LinkedIn Company Page",
        sourceOrigin: "linkedin",
        sourceReliability: "medium" as SourceReliability,
        confidenceLevel: "medium",
        whyItMatters:
          "Recent funding signals budget availability and growth pressure on operations.",
        suggestedOutreachAngle:
          "Reference their growth trajectory and how payment ops needs to scale with it.",
        dimension: "operational_urgency",
      });
      foundCategories.add("company_description");
    }
  }

  // --- Scan persona titles for hiring patterns (hiring_patterns category) ---
  if (account.personas && account.personas.length > 0) {
    for (const persona of account.personas) {
      const titleLower = persona.title.toLowerCase();
      for (const pattern of HIRING_PATTERNS) {
        if (pattern.keywords.some((kw) => titleLower.includes(kw))) {
          const confidence = adjustConfidenceForMissingData("medium", missingMetadataFields);
          cards.push({
            id: generateId(),
            signalType: pattern.signalType,
            evidenceType: "inferred",
            rawEvidence: `${account.name} has a "${persona.title}" role, suggesting active payment operations staffing.`,
            sourceLabel: "LinkedIn Profile",
            sourceOrigin: "linkedin",
            sourceReliability: "medium" as SourceReliability,
            inferenceExplanation:
              "Presence of this role title suggests the company invests in payment operations headcount.",
            confidenceLevel: confidence,
            whyItMatters: pattern.whyItMatters,
            suggestedOutreachAngle: pattern.outreachAngle,
            dimension: pattern.dimension,
          });
          foundCategories.add("hiring_patterns");
          break;
        }
      }
    }
  }

  // --- Scan for tool mentions (part of company_description category) ---
  if (account.personas && account.personas.length > 0) {
    for (const persona of account.personas) {
      const text =
        `${persona.title} ${persona.relevanceExplanation}`.toLowerCase();
      for (const pattern of TOOL_PATTERNS) {
        if (pattern.keywords.some((kw) => text.includes(kw))) {
          cards.push({
            id: generateId(),
            signalType: pattern.signalType,
            evidenceType: "inferred",
            rawEvidence: `Employee at ${account.name} mentions legacy financial tools in their profile.`,
            sourceLabel: "LinkedIn Profile",
            sourceOrigin: "linkedin",
            sourceReliability: "low" as SourceReliability,
            inferenceExplanation:
              "Tool mention in individual profile does not confirm company-wide usage.",
            confidenceLevel: "low",
            whyItMatters: pattern.whyItMatters,
            suggestedOutreachAngle: pattern.outreachAngle,
            dimension: pattern.dimension,
          });
          foundCategories.add("company_description");
          break;
        }
      }
    }
  }

  // --- Deduplicate by signal type + dimension (keep first/strongest) ---
  const seen = new Set<string>();
  const dedupedCards = cards.filter((card) => {
    const key = `${card.signalType}-${card.dimension}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // --- Build result ---
  const hasEvidence = dedupedCards.length > 0;

  const updatedAccount: Account = {
    ...account,
    evidenceCards: [...account.evidenceCards, ...dedupedCards],
    status: "evidence_collected",
    lowEvidenceWarning: !hasEvidence,
  };

  return {
    account: updatedAccount,
    checkedCategories: [...checkedCategories],
    foundCategories: [...foundCategories],
    missingMetadataFields,
  };
}

/**
 * Get a human-readable summary of absent signal categories for low-evidence accounts.
 */
export function getAbsentCategoriesSummary(result: CollectionResult): string | undefined {
  if (result.account.lowEvidenceWarning) {
    const absent = result.checkedCategories.filter(
      (cat) => !result.foundCategories.includes(cat)
    );
    return `No evidence found. Checked categories: ${absent.map((c) => c.replace(/_/g, " ")).join(", ")}. All returned absent.`;
  }

  return undefined;
}

/**
 * Collect evidence for a single account (simplified interface).
 * Returns the account with evidenceCards populated.
 */
export function collectEvidenceForAccount(account: Account): Account {
  const result = collectEvidence(account);

  // If no evidence, attach the absent categories summary as a note
  if (result.account.lowEvidenceWarning) {
    const summary = getAbsentCategoriesSummary(result);
    if (summary) {
      // Add a low-confidence "other" evidence card noting the absence
      const noteCard: EvidenceCard = {
        id: `ev-${account.id.slice(0, 8)}-absent`,
        signalType: "other",
        evidenceType: "inferred",
        rawEvidence: summary,
        sourceLabel: "Evidence Collector",
        sourceOrigin: "linkedin",
        sourceReliability: "low",
        inferenceExplanation:
          "No payment complexity signals detected from available metadata. Account flagged as low-confidence.",
        confidenceLevel: "low",
        whyItMatters:
          "Absence of payment signals suggests this account may not have significant payment complexity, or metadata is insufficient.",
        suggestedOutreachAngle:
          "Research further before outreach — look for payment complexity signals on company website or news.",
        dimension: "confidence",
      };

      return {
        ...result.account,
        evidenceCards: [...result.account.evidenceCards, noteCard],
      };
    }
  }

  // If metadata was incomplete, add a note about reduced confidence
  if (result.missingMetadataFields.length >= 3 && result.account.evidenceCards.length > 0) {
    const existingCards = result.account.evidenceCards;
    const lastCard = existingCards[existingCards.length - 1];
    if (lastCard && !lastCard.inferenceExplanation?.includes("metadata")) {
      // The confidence was already reduced via adjustConfidenceForMissingData
      // No additional card needed — the reduced confidence levels communicate this
    }
  }

  return result.account;
}

/**
 * Collect evidence for multiple accounts.
 */
export function collectEvidenceForAccounts(accounts: Account[]): Account[] {
  return accounts.map(collectEvidenceForAccount);
}
