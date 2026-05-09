/**
 * POST /api/enrich-web
 *
 * Enriches accounts with web-sourced payment complexity evidence.
 * Uses Brave Search API in live mode, with graceful fallback to demo data.
 *
 * Input: { accounts: Account[], limit?: number }
 * Output: { accounts: Account[], logEntry: string }
 *
 * Requirements: 4.1-4.11, 12.2, 12.7, 13.5
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { Account, EnrichWebResponse } from "@/types";
import { assertServerSide, getEnvConfig } from "@/lib/env";
import { getDemoEnrichment } from "@/lib/demo-data";
import { createWebSearchProvider } from "@/lib/providers/web-search";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnrichWebResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  assertServerSide();
  const env = getEnvConfig();
  const { accounts, limit = 5 } = req.body;

  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  // If no web search key, return demo enrichment (Requirement 13.5)
  if (!env.webSearchApiKey) {
    const enriched = getDemoEnrichment(accounts);
    return res.status(200).json({
      accounts: enriched,
      logEntry: `Demo Mode: Enrichment using preloaded data for ${enriched.length} accounts. Configure WEB_SEARCH_API_KEY for live enrichment.`,
    });
  }

  // Live enrichment: top N accounts by evidence count, in parallel (Requirement 4.11)
  const webSearch = createWebSearchProvider();

  const sorted = [...accounts].sort(
    (a: Account, b: Account) =>
      (b.evidenceCards?.length || 0) - (a.evidenceCards?.length || 0)
  );
  const topN = sorted.slice(0, limit);

  const results = await Promise.allSettled(
    topN.map(async (account: Account) => {
      // Web search provider handles errors gracefully (returns empty on failure)
      const result = await webSearch.enrichAccountWithStatus(account, env.webSearchApiKey!);
      if (result.cards.length > 0) {
        return {
          account: {
            ...account,
            evidenceCards: [...(account.evidenceCards || []), ...result.cards],
            status: "enriched" as const,
          },
          success: true as const,
        };
      }
      return { account, success: false as const };
    })
  );

  const enrichedMap = new Map<string, Account>();
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      enrichedMap.set(result.value.account.id, result.value.account);
      if (result.value.success) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }
  }

  const enriched = accounts.map((a: Account) => enrichedMap.get(a.id) ?? a);

  if (successCount === 0 && failCount > 0) {
    // All enrichment failed — fallback to demo data (Requirement 4.8)
    const demoEnriched = getDemoEnrichment(accounts);
    return res.status(200).json({
      accounts: demoEnriched,
      logEntry: `Web enrichment failed for all ${failCount} accounts. Using demo enrichment data as fallback.`,
    });
  }

  return res.status(200).json({
    accounts: enriched,
    logEntry: `Web enrichment completed for ${successCount}/${topN.length} accounts.${failCount > 0 ? ` ${failCount} failed (graceful degradation).` : ""}`,
  });
}
