/**
 * Rule-based ICP parser — extracts keywords, industries, geographies,
 * and persona targets from natural language ICP descriptions.
 */

import type { BusinessModel, SearchPlan } from "@/types";

// --- Keyword dictionaries ---

const PAYMENT_KEYWORDS = [
  "payouts",
  "reconciliation",
  "billing",
  "payments",
  "invoicing",
  "settlement",
  "refunds",
  "dunning",
  "compliance",
  "chargebacks",
  "subscriptions",
  "multi-currency",
  "cross-border",
  "disbursements",
  "ledger",
  "treasury",
  "accounts payable",
  "accounts receivable",
  "payment operations",
  "finance operations",
  "payment automation",
  "revenue recognition",
];

const INDUSTRY_KEYWORDS: Record<string, BusinessModel> = {
  marketplace: "marketplace",
  marketplaces: "marketplace",
  platform: "platform",
  platforms: "platform",
  "gig economy": "gig_economy",
  "gig-economy": "gig_economy",
  freelance: "gig_economy",
  "creator economy": "creator_economy",
  "creator-economy": "creator_economy",
  creators: "creator_economy",
  saas: "saas",
  "software-as-a-service": "saas",
  logistics: "logistics",
  freight: "logistics",
  shipping: "logistics",
  healthcare: "healthcare_payments",
  "healthcare payments": "healthcare_payments",
};

const GEOGRAPHY_KEYWORDS: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states": "United States",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  eu: "Europe",
  europe: "Europe",
  international: "International",
  global: "Global",
  "cross-border": "Cross-border",
  apac: "Asia-Pacific",
  "asia-pacific": "Asia-Pacific",
  latam: "Latin America",
  "latin america": "Latin America",
  emea: "EMEA",
  canada: "Canada",
  australia: "Australia",
  germany: "Germany",
  france: "France",
  india: "India",
  singapore: "Singapore",
  "middle east": "Middle East",
  africa: "Africa",
};

const PERSONA_KEYWORDS: Record<string, string> = {
  cfo: "CFO",
  coo: "COO",
  "head of payments": "Head of Payments",
  "head of finance": "Head of Finance Operations",
  "vp finance": "VP Finance",
  "vp product": "VP Product",
  "head of platform": "Head of Platform",
  "operations director": "Operations Director",
  "payment ops": "Payment Operations Manager",
  "finance ops": "Finance Operations Manager",
  "treasury": "Treasury Manager",
  "controller": "Financial Controller",
};

const EXCLUSION_INDICATORS = [
  "not banks",
  "exclude banks",
  "no banks",
  "not agencies",
  "exclude agencies",
  "no agencies",
  "not PSPs",
  "exclude PSPs",
  "no PSPs",
  "not consultancies",
  "exclude consultancies",
  "not startups",
  "not enterprise",
];

const DEFAULT_EXCLUSIONS = ["banks", "pure PSPs", "agencies"];

// --- Parser ---

export interface IcpParseResult {
  searchPlan: SearchPlan;
  rationale: string;
  dimensionCount: number;
}

/**
 * Parse a natural language ICP description into a structured SearchPlan.
 * Returns the plan, a rationale string, and the number of targeting dimensions found.
 */
export function parseIcp(icpDescription: string): IcpParseResult {
  const text = icpDescription.toLowerCase();

  // Extract keywords
  const keywords = extractKeywords(text);

  // Extract company types / industries
  const companyTypes = extractCompanyTypes(text);

  // Extract geographies
  const geographicFilters = extractGeographies(text);

  // Extract persona targets
  const personaTargets = extractPersonas(text);

  // Extract exclusions
  const exclusionCriteria = extractExclusions(text);

  // Count targeting dimensions
  const dimensionCount = countDimensions({
    keywords,
    companyTypes,
    geographicFilters,
    personaTargets,
  });

  // Generate suggested narrowing if <2 dimensions
  const suggestedNarrowing =
    dimensionCount < 2 ? generateNarrowingSuggestions(companyTypes, geographicFilters, personaTargets) : undefined;

  const searchPlan: SearchPlan = {
    keywords: keywords.length > 0 ? keywords : ["payment operations"],
    companyTypes,
    geographicFilters,
    personaTargets: personaTargets.length > 0 ? personaTargets : ["Head of Payments", "CFO", "VP Finance Operations"],
    exclusionCriteria: exclusionCriteria.length > 0 ? exclusionCriteria : DEFAULT_EXCLUSIONS,
    suggestedNarrowing,
  };

  const rationale = buildRationale(searchPlan, dimensionCount);

  return { searchPlan, rationale, dimensionCount };
}

function extractKeywords(text: string): string[] {
  const found: string[] = [];
  for (const keyword of PAYMENT_KEYWORDS) {
    if (text.includes(keyword)) {
      found.push(keyword);
    }
  }
  return [...new Set(found)].slice(0, 8);
}

function extractCompanyTypes(text: string): BusinessModel[] {
  const found: BusinessModel[] = [];
  for (const [keyword, model] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (text.includes(keyword)) {
      found.push(model);
    }
  }
  return [...new Set(found)];
}

function extractGeographies(text: string): string[] {
  const found: string[] = [];
  // Sort by length descending to match longer phrases first
  const sortedEntries = Object.entries(GEOGRAPHY_KEYWORDS).sort(
    ([a], [b]) => b.length - a.length
  );
  for (const [keyword, geo] of sortedEntries) {
    if (text.includes(keyword) && !found.includes(geo)) {
      found.push(geo);
    }
  }
  return found;
}

function extractPersonas(text: string): string[] {
  const found: string[] = [];
  // Sort by length descending to match longer phrases first
  const sortedEntries = Object.entries(PERSONA_KEYWORDS).sort(
    ([a], [b]) => b.length - a.length
  );
  for (const [keyword, persona] of sortedEntries) {
    if (text.includes(keyword) && !found.includes(persona)) {
      found.push(persona);
    }
  }
  return found;
}

function extractExclusions(text: string): string[] {
  const found: string[] = [];
  for (const indicator of EXCLUSION_INDICATORS) {
    if (text.includes(indicator.toLowerCase())) {
      // Extract the excluded entity
      const entity = indicator.replace(/^(not|exclude|no)\s+/i, "");
      found.push(entity);
    }
  }
  return [...new Set(found)];
}

function countDimensions(parts: {
  keywords: string[];
  companyTypes: BusinessModel[];
  geographicFilters: string[];
  personaTargets: string[];
}): number {
  let count = 0;
  if (parts.companyTypes.length > 0) count++; // industry / business model
  if (parts.geographicFilters.length > 0) count++; // geography
  if (parts.personaTargets.length > 0) count++; // buyer persona
  if (parts.keywords.length >= 2) count++; // payment pain signals (need at least 2 for meaningful targeting)
  return count;
}

function generateNarrowingSuggestions(
  companyTypes: BusinessModel[],
  geographicFilters: string[],
  personaTargets: string[]
): string[] {
  const suggestions: string[] = [];
  if (companyTypes.length === 0) {
    suggestions.push("Add a target industry or business model (e.g., marketplace, SaaS, gig economy)");
  }
  if (geographicFilters.length === 0) {
    suggestions.push("Add a geographic focus (e.g., US, EU, international)");
  }
  if (personaTargets.length === 0) {
    suggestions.push("Add target buyer personas (e.g., Head of Payments, CFO)");
  }
  suggestions.push("Add company stage or size (e.g., Series A+, 50-500 employees)");
  return suggestions.slice(0, 3);
}

function buildRationale(plan: SearchPlan, dimensionCount: number): string {
  const parts: string[] = [];

  parts.push(`Extracted ${plan.keywords.length} keyword${plan.keywords.length !== 1 ? "s" : ""}`);

  if (plan.companyTypes.length > 0) {
    parts.push(`${plan.companyTypes.length} company type${plan.companyTypes.length !== 1 ? "s" : ""}`);
  }

  if (plan.geographicFilters.length > 0) {
    parts.push(`${plan.geographicFilters.length} geographic filter${plan.geographicFilters.length !== 1 ? "s" : ""}`);
  }

  if (plan.personaTargets.length > 0) {
    parts.push(`${plan.personaTargets.length} persona target${plan.personaTargets.length !== 1 ? "s" : ""}`);
  }

  let rationale = `Parsed ICP: ${parts.join(", ")}.`;

  if (dimensionCount < 2 && plan.suggestedNarrowing) {
    rationale += ` Note: Only ${dimensionCount} targeting dimension${dimensionCount !== 1 ? "s" : ""} found — consider narrowing for better results.`;
  }

  return rationale;
}

/**
 * Validates whether an ICP description has identifiable business context.
 * Returns true if the text contains at least one business-relevant term.
 */
export function hasBusinessContext(text: string): boolean {
  const lower = text.toLowerCase();

  // Check for any payment/business keyword
  const hasPaymentKeyword = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasPaymentKeyword) return true;

  // Check for any industry keyword
  const hasIndustryKeyword = Object.keys(INDUSTRY_KEYWORDS).some((kw) => lower.includes(kw));
  if (hasIndustryKeyword) return true;

  // Check for generic business terms
  const businessTerms = [
    "company", "companies", "business", "enterprise", "startup",
    "b2b", "b2c", "fintech", "ecommerce", "e-commerce", "commerce",
    "vendor", "supplier", "merchant", "customer", "client",
    "revenue", "growth", "expansion", "hiring", "funding",
    "series a", "series b", "series c", "seed",
  ];
  return businessTerms.some((term) => lower.includes(term));
}
