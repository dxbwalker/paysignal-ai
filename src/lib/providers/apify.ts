/**
 * Apify provider — calls LinkedIn Lead Scraper API and normalizes responses
 * into internal Account/BuyerPersona types.
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
        return normalizeApifyResults(data);
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    },
  };
}

/**
 * Normalize raw Apify results into internal Account records.
 * Groups people by company and creates Account-level records.
 */
function normalizeApifyResults(data: any[]): Account[] {
  if (!Array.isArray(data)) return [];

  const companyMap = new Map<string, { account: Partial<Account>; people: any[] }>();

  for (const item of data) {
    const companyName = item.company || item.companyName || item.organization;
    if (!companyName) continue; // Skip profiles with no company

    const key = companyName.toLowerCase().trim();

    if (!companyMap.has(key)) {
      companyMap.set(key, {
        account: {
          name: companyName,
          location: item.location || item.city || "",
          linkedinUrl: item.companyLinkedinUrl || undefined,
          website: item.companyWebsite || undefined,
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
      id: `persona-${crypto.randomUUID().slice(0, 8)}`,
      name: p.name || p.fullName || "Unknown",
      title: p.title || p.jobTitle || p.headline || "",
      relevanceExplanation: "",
      email: p.email || p.emailAddress || undefined,
      phone: undefined,
      linkedinUrl: p.profileUrl || p.linkedinUrl || p.url || undefined,
      relevanceRank: i + 1,
    }));

    accounts.push({
      id: `account-${crypto.randomUUID().slice(0, 8)}`,
      name: account.name!,
      website: account.website,
      location: account.location || "",
      linkedinUrl: account.linkedinUrl,
      businessModel: account.businessModel || "other",
      personas,
      evidenceCards: [],
      status: "discovered",
      confidencePenalty: false,
    });
  }

  return accounts;
}

/**
 * Simple business model classification from company metadata.
 */
function classifyBusinessModel(name: string, item: any): BusinessModel {
  const text = `${name} ${item.title || ""} ${item.headline || ""}`.toLowerCase();

  if (text.includes("marketplace") || text.includes("two-sided")) return "marketplace";
  if (text.includes("platform")) return "platform";
  if (text.includes("gig") || text.includes("freelance") || text.includes("driver")) return "gig_economy";
  if (text.includes("saas") || text.includes("subscription") || text.includes("software")) return "saas";
  if (text.includes("logistics") || text.includes("freight") || text.includes("shipping")) return "logistics";
  if (text.includes("creator") || text.includes("influencer")) return "creator_economy";
  if (text.includes("health") || text.includes("medical") || text.includes("claims")) return "healthcare_payments";

  return "other";
}
