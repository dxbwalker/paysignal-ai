/**
 * Web search provider — searches public web for payment complexity signals.
 * Returns normalized EvidenceCards.
 */

import type { Account, EvidenceCard, ConfidenceLevel, SourceReliability } from "@/types";

const TIMEOUT_MS = 30_000;

export interface WebSearchProvider {
  enrichAccount(account: Account, apiKey: string): Promise<EvidenceCard[]>;
}

export function createWebSearchProvider(): WebSearchProvider {
  return {
    async enrichAccount(account: Account, apiKey: string): Promise<EvidenceCard[]> {
      // Build search query from account data
      const query = buildSearchQuery(account);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Generic web search API call — adapter pattern allows swapping providers
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
          {
            headers: {
              "Accept": "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": apiKey,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Web search API error: ${response.status}`);
        }

        const data = await response.json();
        return extractEvidenceFromResults(account, data);
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    },
  };
}

function buildSearchQuery(account: Account): string {
  const terms = [
    account.name,
    "payments OR payouts OR billing OR reconciliation OR invoicing",
  ];
  if (account.website) {
    terms.push(`site:${account.website}`);
  }
  return terms.join(" ");
}

function extractEvidenceFromResults(account: Account, data: any): EvidenceCard[] {
  const cards: EvidenceCard[] = [];
  const results = data?.web?.results || [];

  const paymentKeywords = [
    "payout", "reconciliation", "refund", "chargeback", "billing",
    "subscription", "multi-currency", "international", "marketplace",
    "supplier payment", "creator payment", "bill.com", "sap", "tipalti",
    "netsuite", "stripe", "adyen",
  ];

  for (const result of results.slice(0, 5)) {
    const snippet = (result.description || "").toLowerCase();
    const title = (result.title || "").toLowerCase();
    const combined = `${title} ${snippet}`;

    for (const keyword of paymentKeywords) {
      if (combined.includes(keyword)) {
        const reliability = getSourceReliability(result.url, account);
        const confidence = getConfidenceFromReliability(reliability);

        cards.push({
          id: `ev-web-${crypto.randomUUID().slice(0, 8)}`,
          signalType: mapKeywordToSignalType(keyword),
          evidenceType: "observed",
          rawEvidence: (result.description || "").slice(0, 500),
          sourceLabel: new URL(result.url).hostname,
          sourceUrl: result.url,
          sourceOrigin: "web",
          sourceReliability: reliability,
          inferenceExplanation: undefined,
          confidenceLevel: confidence,
          whyItMatters: `Evidence of ${keyword} activity suggests payment complexity at ${account.name}.`,
          suggestedOutreachAngle: `Reference their ${keyword} operations in outreach.`,
          dimension: mapKeywordToDimension(keyword),
        });
        break; // One card per result
      }
    }
  }

  return cards;
}

function getSourceReliability(url: string, account: Account): SourceReliability {
  try {
    const hostname = new URL(url).hostname;
    // High: company's own website
    if (account.website && hostname.includes(account.website.replace(/https?:\/\//, "").replace("www.", ""))) {
      return "high";
    }
    // Medium: known news/funding sources
    if (["techcrunch.com", "crunchbase.com", "reuters.com", "bloomberg.com"].some(d => hostname.includes(d))) {
      return "medium";
    }
    return "low";
  } catch {
    return "low";
  }
}

function getConfidenceFromReliability(reliability: SourceReliability): ConfidenceLevel {
  if (reliability === "high") return "high";
  if (reliability === "medium") return "medium";
  return "low";
}

function mapKeywordToSignalType(keyword: string): import("@/types").SignalType {
  if (keyword.includes("payout") || keyword.includes("marketplace")) return "complex_payouts";
  if (keyword.includes("reconciliation")) return "manual_reconciliation";
  if (keyword.includes("billing") || keyword.includes("subscription")) return "billing_operations";
  if (keyword.includes("multi-currency") || keyword.includes("international")) return "multi_country";
  if (keyword.includes("bill.com") || keyword.includes("sap") || keyword.includes("tipalti") || keyword.includes("netsuite")) return "legacy_tools";
  return "other";
}

function mapKeywordToDimension(keyword: string): import("@/types").ScoringDimension {
  if (["payout", "reconciliation", "multi-currency", "marketplace", "chargeback", "refund"].some(k => keyword.includes(k))) {
    return "payment_complexity";
  }
  if (["international", "subscription"].some(k => keyword.includes(k))) {
    return "operational_urgency";
  }
  if (["bill.com", "sap", "tipalti", "netsuite"].some(k => keyword.includes(k))) {
    return "automation_fit";
  }
  return "payment_complexity";
}
