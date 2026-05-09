import type { NextApiRequest, NextApiResponse } from "next";
import { assertServerSide, getEnvConfig } from "@/lib/env";
import { getDemoEnrichment } from "@/lib/demo-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  assertServerSide();
  const env = getEnvConfig();
  const { accounts, limit = 5 } = req.body;

  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  // If no web search key, return demo enrichment
  if (!env.webSearchApiKey) {
    const enriched = getDemoEnrichment(accounts);
    return res.status(200).json({
      accounts: enriched,
      logEntry: `Demo Mode: Enrichment using preloaded data for ${enriched.length} accounts.`,
    });
  }

  // Live enrichment: top N accounts by evidence count, in parallel
  try {
    const { createWebSearchProvider } = await import("@/lib/providers/web-search");
    const webSearch = createWebSearchProvider();

    const sorted = [...accounts].sort((a: any, b: any) =>
      (b.evidenceCards?.length || 0) - (a.evidenceCards?.length || 0)
    );
    const topN = sorted.slice(0, limit);

    const results = await Promise.allSettled(
      topN.map(async (account: any) => {
        const newCards = await webSearch.enrichAccount(account, env.webSearchApiKey!);
        return {
          ...account,
          evidenceCards: [...(account.evidenceCards || []), ...newCards],
          status: "enriched",
        };
      })
    );

    const enrichedMap = new Map<string, any>();
    for (const result of results) {
      if (result.status === "fulfilled") {
        enrichedMap.set(result.value.id, result.value);
      }
    }

    const enriched = accounts.map((a: any) => enrichedMap.get(a.id) ?? a);
    const newCardCount = results.filter((r) => r.status === "fulfilled").length;

    return res.status(200).json({
      accounts: enriched,
      logEntry: `Web enrichment completed for ${newCardCount}/${topN.length} accounts.`,
    });
  } catch (error: any) {
    // Fallback to demo enrichment
    const enriched = getDemoEnrichment(accounts);
    return res.status(200).json({
      accounts: enriched,
      logEntry: `Web enrichment failed (${error.message}). Using demo enrichment data.`,
    });
  }
}
