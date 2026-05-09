/**
 * Web search provider — searches public web for payment complexity signals.
 * Returns normalized EvidenceCards.
 *
 * Features:
 * - Wired to Brave Search API (configurable via adapter pattern)
 * - 30s timeout on API calls (Requirement 4.8 fallback)
 * - Normalized EvidenceCard output with source attribution
 * - Source reliability classification (3-tier: high/medium/low)
 * - Treats web content as untrusted input (Requirement 4.9)
 * - Graceful error handling: returns empty results on failure, never throws (Requirement 12.2)
 */

import type {
  Account,
  EvidenceCard,
  ConfidenceLevel,
  SourceReliability,
  SignalType,
  ScoringDimension,
} from "@/types";

const TIMEOUT_MS = 30_000;

export interface WebSearchResult {
  cards: EvidenceCard[];
  error?: string;
}

export interface WebSearchProvider {
  /** Enrich account with web evidence. Returns empty array on failure (never throws). */
  enrichAccount(account: Account, apiKey: string): Promise<EvidenceCard[]>;
  /** Enrich with detailed result including error info for logging. */
  enrichAccountWithStatus(account: Account, apiKey: string): Promise<WebSearchResult>;
}

export function createWebSearchProvider(): WebSearchProvider {
  return {
    async enrichAccount(
      account: Account,
      apiKey: string
    ): Promise<EvidenceCard[]> {
      const result = await this.enrichAccountWithStatus(account, apiKey);
      return result.cards;
    },

    async enrichAccountWithStatus(
      account: Account,
      apiKey: string
    ): Promise<WebSearchResult> {
      // Build search query from account data
      const query = buildSearchQuery(account);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Brave Search API — adapter pattern allows swapping providers
        const response = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": apiKey,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {
          return {
            cards: [],
            error: `Web search API error: ${response.status}`,
          };
        }

        const data = await response.json();
        return { cards: extractEvidenceFromResults(account, data) };
      } catch (error) {
        clearTimeout(timeout);
        const message = error instanceof Error ? error.message : "Unknown error";
        const isTimeout = message.includes("abort");
        return {
          cards: [],
          error: isTimeout
            ? "Web search API timed out after 30s"
            : `Web search API failed: ${message}`,
        };
      }
    },
  };
}

/**
 * Build a search query targeting payment complexity signals for the account.
 * Combines company name with payment-related keywords.
 */
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

/**
 * Extract EvidenceCards from web search results.
 * Treats all web content as untrusted (Requirement 4.9).
 * Only creates cards for results with traceable source URLs (Requirement 4.10).
 */
function extractEvidenceFromResults(
  account: Account,
  data: unknown
): EvidenceCard[] {
  const cards: EvidenceCard[] = [];

  if (!data || typeof data !== "object") return cards;

  const webData = data as { web?: { results?: WebResult[] } };
  const results = webData?.web?.results || [];

  const paymentKeywords: PaymentKeyword[] = [
    { keyword: "payout", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "reconciliation", signal: "manual_reconciliation", dimension: "payment_complexity" },
    { keyword: "refund", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "chargeback", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "billing", signal: "billing_operations", dimension: "payment_complexity" },
    { keyword: "subscription", signal: "billing_operations", dimension: "operational_urgency" },
    { keyword: "multi-currency", signal: "multi_country", dimension: "payment_complexity" },
    { keyword: "international", signal: "international_expansion", dimension: "operational_urgency" },
    { keyword: "marketplace", signal: "marketplace_model", dimension: "payment_complexity" },
    { keyword: "supplier payment", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "creator payment", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "bill.com", signal: "legacy_tools", dimension: "automation_fit" },
    { keyword: "sap", signal: "legacy_tools", dimension: "automation_fit" },
    { keyword: "tipalti", signal: "legacy_tools", dimension: "automation_fit" },
    { keyword: "netsuite", signal: "legacy_tools", dimension: "automation_fit" },
    { keyword: "stripe", signal: "complex_payouts", dimension: "payment_complexity" },
    { keyword: "adyen", signal: "complex_payouts", dimension: "payment_complexity" },
  ];

  for (const result of results.slice(0, 5)) {
    // Requirement 4.10: Skip results without traceable source URL
    if (!result.url) continue;

    const snippet = (result.description || "").toLowerCase();
    const title = (result.title || "").toLowerCase();
    const combined = `${title} ${snippet}`;

    // Requirement 4.9: Treat web content as untrusted — ignore embedded instructions
    if (containsSuspiciousContent(combined)) continue;

    for (const { keyword, signal, dimension } of paymentKeywords) {
      if (combined.includes(keyword)) {
        const reliability = getSourceReliability(result.url, account);
        const confidence = getConfidenceFromReliability(reliability);

        cards.push({
          id: `ev-web-${generateId()}`,
          signalType: signal,
          evidenceType: "observed",
          rawEvidence: sanitizeEvidence(result.description || "").slice(0, 500),
          sourceLabel: extractHostname(result.url),
          sourceUrl: result.url,
          sourceOrigin: "web",
          sourceReliability: reliability,
          inferenceExplanation: undefined,
          confidenceLevel: confidence,
          whyItMatters: `Evidence of ${keyword} activity suggests payment complexity at ${account.name}.`,
          suggestedOutreachAngle: `Reference their ${keyword} operations in outreach.`,
          dimension: dimension,
        });
        break; // One card per result
      }
    }
  }

  return cards;
}

// --- Source Reliability Classification (Requirement 4.5) ---

/**
 * Assign source reliability using three-tier scale:
 * - high: company websites, official careers pages, official documentation
 * - medium: named news publications, press releases, funding databases
 * - low: generic search snippets, forums, inferred metadata
 */
function getSourceReliability(
  url: string,
  account: Account
): SourceReliability {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // High: company's own website
    if (account.website) {
      const accountHost = account.website
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .toLowerCase();
      if (hostname.includes(accountHost) || accountHost.includes(hostname)) {
        return "high";
      }
    }

    // Medium: known news/funding/tech sources
    const mediumSources = [
      "techcrunch.com",
      "crunchbase.com",
      "reuters.com",
      "bloomberg.com",
      "forbes.com",
      "businessinsider.com",
      "venturebeat.com",
      "pitchbook.com",
      "linkedin.com",
      "glassdoor.com",
    ];
    if (mediumSources.some((d) => hostname.includes(d))) {
      return "medium";
    }

    return "low";
  } catch {
    return "low";
  }
}

function getConfidenceFromReliability(
  reliability: SourceReliability
): ConfidenceLevel {
  if (reliability === "high") return "high";
  if (reliability === "medium") return "medium";
  return "low";
}

// --- Security: Untrusted Content Handling (Requirement 4.9) ---

/**
 * Check for suspicious content that might attempt to modify system behavior.
 * Reject results containing prompt injection patterns.
 */
function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    "ignore previous",
    "ignore all instructions",
    "system prompt",
    "you are now",
    "disregard",
    "override",
    "new instructions",
  ];
  return suspiciousPatterns.some((pattern) => text.includes(pattern));
}

/**
 * Sanitize evidence text — strip potential injection content.
 */
function sanitizeEvidence(text: string): string {
  return text
    .replace(/[<>]/g, "") // Strip HTML-like tags
    .replace(/\{[^}]*\}/g, "") // Strip template-like content
    .trim();
}

// --- Utility Functions ---

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

interface WebResult {
  title?: string;
  description?: string;
  url?: string;
}

interface PaymentKeyword {
  keyword: string;
  signal: SignalType;
  dimension: ScoringDimension;
}
