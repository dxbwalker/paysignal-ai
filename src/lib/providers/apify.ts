/**
 * Apify provider — calls LinkedIn Lead Scraper API and normalizes responses
 * into internal Account/BuyerPersona types.
 *
 * Features:
 * - 30s timeout on API calls (Requirement 2.9)
 * - Person-to-account normalization (Requirement 2.3)
 * - Business model classification from metadata (Requirement 2.5)
 * - Deduplication with low-confidence flagging for fuzzy matches (Requirement 2.6, 2.7)
 */

import type { Account, SearchPlan, BuyerPersona, BusinessModel } from "@/types";

const ACTOR_ID = "scraper-engine/linkedin-lead-scraper";
const TIMEOUT_MS = 30_000;

export interface ApifyProvider {
  discover(searchPlan: SearchPlan, apiKey: string): Promise<Account[]>;
}

export function createApifyProvider(): ApifyProvider {
  return {
    async discover(searchPlan: SearchPlan, apiKey: string): Promise<Account[]> {
      const actorInput = {
        keywords: searchPlan.keywords,
        platform: "Linkedin",
        location: searchPlan.geographicFilters[0] || "",
        maxEmails: 30,
        engine: "legacy",
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(
          `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actorInput),
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Apify API error: ${response.status}`);
        }

        const data = await response.json();
        const accounts = normalizeApifyResults(data);
        return deduplicateAccounts(accounts);
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    },
  };
}

// --- Person-to-Account Normalization (Requirement 2.3) ---

/**
 * Normalize raw Apify results into internal Account records.
 * Groups people by company and creates Account-level records.
 * Profiles with no company are excluded from Account normalization (Requirement 2.4).
 */
function normalizeApifyResults(data: unknown): Account[] {
  if (!Array.isArray(data)) return [];

  const companyMap = new Map<string, { account: Partial<Account>; people: RawPerson[] }>();

  for (const item of data) {
    if (!item || typeof item !== "object") continue;

    const companyName = item.company || item.companyName || item.organization;
    if (!companyName) continue; // Requirement 2.4: Skip profiles with no company

    const key = normalizeCompanyKey(companyName);

    if (!companyMap.has(key)) {
      companyMap.set(key, {
        account: {
          name: companyName,
          location: item.location || item.city || "",
          linkedinUrl: item.companyLinkedinUrl || item.companyUrl || undefined,
          website: item.companyWebsite || item.website || undefined,
          industry: item.industry || item.companyIndustry || undefined,
          employeeCount: parseEmployeeCount(item.employeeCount || item.companySize),
          businessModel: classifyBusinessModel(companyName, item),
        },
        people: [],
      });
    }

    companyMap.get(key)!.people.push(item);
  }

  const accounts: Account[] = [];

  for (const [, { account, people }] of companyMap) {
    const personas: BuyerPersona[] = people.map((p, i) => ({
      id: `persona-${generateId()}`,
      name: p.name || p.fullName || "Unknown",
      title: p.title || p.jobTitle || p.headline || "",
      relevanceExplanation: "",
      email: p.email || p.emailAddress || undefined,
      phone: p.phone || p.phoneNumber || undefined,
      linkedinUrl: p.profileUrl || p.linkedinUrl || p.url || undefined,
      relevanceRank: i + 1,
    }));

    accounts.push({
      id: `account-${generateId()}`,
      name: account.name!,
      website: account.website,
      location: account.location || "",
      linkedinUrl: account.linkedinUrl,
      businessModel: account.businessModel || "other",
      industry: account.industry,
      employeeCount: account.employeeCount,
      personas,
      evidenceCards: [],
      status: "discovered",
      confidencePenalty: false,
    });
  }

  return accounts;
}

// --- Deduplication with Fuzzy Match Flagging (Requirements 2.6, 2.7) ---

/**
 * Deduplicate accounts by company name + LinkedIn URL.
 * Exact matches (same normalized name AND matching LinkedIn URL or website) are merged.
 * Fuzzy matches (similar names without matching URL) are flagged as possibleDuplicate
 * rather than merged automatically.
 */
function deduplicateAccounts(accounts: Account[]): Account[] {
  const result: Account[] = [];
  const seen = new Map<string, Account>(); // normalized key -> account

  for (const account of accounts) {
    const key = normalizeCompanyKey(account.name);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, account);
      result.push(account);
      continue;
    }

    // Exact duplicate: same normalized name AND matching LinkedIn URL or website
    if (isExactDuplicate(existing, account)) {
      // Merge personas into existing account
      mergePersonas(existing, account);
      continue;
    }

    // Fuzzy match: similar name but no matching URL — flag as possibleDuplicate
    account.possibleDuplicate = existing.id;
    account.confidencePenalty = true;
    result.push(account);
  }

  // Second pass: check for fuzzy matches across different normalized keys
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[j].possibleDuplicate) continue; // Already flagged

      if (isFuzzyNameMatch(result[i].name, result[j].name)) {
        if (!isExactDuplicate(result[i], result[j])) {
          result[j].possibleDuplicate = result[i].id;
          result[j].confidencePenalty = true;
        }
      }
    }
  }

  return result;
}

function isExactDuplicate(a: Account, b: Account): boolean {
  // Same LinkedIn URL
  if (a.linkedinUrl && b.linkedinUrl && a.linkedinUrl === b.linkedinUrl) {
    return true;
  }
  // Same website
  if (a.website && b.website && normalizeUrl(a.website) === normalizeUrl(b.website)) {
    return true;
  }
  return false;
}

function isFuzzyNameMatch(nameA: string, nameB: string): boolean {
  const a = normalizeCompanyKey(nameA);
  const b = normalizeCompanyKey(nameB);

  if (a === b) return true;

  // Check if one contains the other (e.g., "Stripe" vs "Stripe Inc")
  if (a.includes(b) || b.includes(a)) return true;

  // Levenshtein-like similarity for short names
  if (a.length > 3 && b.length > 3) {
    const similarity = calculateSimilarity(a, b);
    return similarity > 0.8;
  }

  return false;
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function mergePersonas(target: Account, source: Account): void {
  const existingUrls = new Set(
    target.personas.map((p) => p.linkedinUrl).filter(Boolean)
  );

  for (const persona of source.personas) {
    if (persona.linkedinUrl && existingUrls.has(persona.linkedinUrl)) continue;
    target.personas.push({
      ...persona,
      relevanceRank: target.personas.length + 1,
    });
  }
}

// --- Business Model Classification (Requirement 2.5) ---

/**
 * Classify business model from company metadata.
 * Uses company name, description, industry, and person titles/headlines.
 */
function classifyBusinessModel(name: string, item: RawPerson): BusinessModel {
  const text = [
    name,
    item.title || "",
    item.headline || "",
    item.companyDescription || "",
    item.industry || "",
    item.companyIndustry || "",
    item.about || "",
  ]
    .join(" ")
    .toLowerCase();

  // Order matters: more specific matches first
  if (
    text.includes("marketplace") ||
    text.includes("two-sided") ||
    text.includes("buyer and seller") ||
    text.includes("p2p")
  ) {
    return "marketplace";
  }
  if (
    text.includes("gig") ||
    text.includes("freelance") ||
    text.includes("driver") ||
    text.includes("on-demand workforce") ||
    text.includes("contractor")
  ) {
    return "gig_economy";
  }
  if (
    text.includes("creator economy") ||
    text.includes("influencer") ||
    text.includes("content creator") ||
    text.includes("creator platform")
  ) {
    return "creator_economy";
  }
  if (
    text.includes("healthcare payment") ||
    text.includes("medical billing") ||
    text.includes("health claims") ||
    text.includes("clinical payment")
  ) {
    return "healthcare_payments";
  }
  if (
    text.includes("logistics") ||
    text.includes("freight") ||
    text.includes("shipping") ||
    text.includes("supply chain") ||
    text.includes("trucking")
  ) {
    return "logistics";
  }
  if (
    text.includes("platform") ||
    text.includes("api") ||
    text.includes("developer platform") ||
    text.includes("infrastructure")
  ) {
    return "platform";
  }
  if (
    text.includes("saas") ||
    text.includes("subscription") ||
    text.includes("software as a service") ||
    text.includes("cloud software")
  ) {
    return "saas";
  }

  return "other";
}

// --- Utility Functions ---

function normalizeCompanyKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(inc|llc|ltd|corp|co|company|group|holdings)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

function parseEmployeeCount(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Handle ranges like "51-200" or "1001-5000"
    const match = value.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}

function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawPerson = Record<string, any>;
