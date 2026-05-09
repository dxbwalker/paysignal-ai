/**
 * POST /api/discover-accounts
 *
 * Discovers accounts using Apify LinkedIn Lead Scraper in live mode,
 * with graceful fallback to demo data when API is unavailable.
 *
 * Input: { searchPlan: SearchPlan }
 * Output: { accounts: Account[], logEntry: string, mode: Mode }
 *
 * Requirements: 2.1-2.10, 12.2, 12.7, 13.5
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { DiscoverAccountsResponse } from "@/types";
import { assertServerSide, getEnvConfig } from "@/lib/env";
import { createApifyProvider } from "@/lib/providers/apify";
import { getDemoAccounts } from "@/lib/demo-data";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoverAccountsResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  assertServerSide();
  const env = getEnvConfig();
  const { searchPlan } = req.body;

  if (!searchPlan || !searchPlan.keywords?.length) {
    return res.status(400).json({ error: "searchPlan with keywords required" });
  }

  // If no Apify key, return demo data (Requirement 13.5)
  if (!env.apifyApiKey) {
    const accounts = getDemoAccounts();
    return res.status(200).json({
      accounts,
      logEntry: `Demo Mode: Loaded ${accounts.length} synthetic accounts. Configure APIFY_API_KEY for live discovery.`,
      mode: "demo",
    });
  }

  // Live mode: use Apify provider with graceful error handling (Requirement 2.9, 12.2)
  const apify = createApifyProvider();
  const result = await apify.discoverWithStatus(searchPlan, env.apifyApiKey);

  if (result.accounts.length > 0) {
    // Live discovery succeeded
    const modelCounts = result.accounts.reduce((acc, a) => {
      acc[a.businessModel] = (acc[a.businessModel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const modelSummary = Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([model, count]) => `${count} ${model}`)
      .join(", ");

    const duplicates = result.accounts.filter((a) => a.possibleDuplicate).length;
    const dedupNote = duplicates > 0 ? ` ${duplicates} flagged as possible duplicates.` : "";

    // Store in MongoDB for future retrieval
    try {
      const { createMongoDBProvider } = await import("@/lib/providers/mongodb");
      const mongo = createMongoDBProvider();
      if (mongo.isEnabled()) {
        await mongo.saveAccounts("live-discovery", result.accounts);
      }
    } catch { /* non-blocking */ }

    return res.status(200).json({
      accounts: result.accounts,
      logEntry: `Discovered ${result.accounts.length} accounts from LinkedIn via Apify. Classified: ${modelSummary}.${dedupNote}`,
      mode: "live",
    });
  }

  // Fallback to demo data (Requirement 2.9)
  const accounts = getDemoAccounts();
  const fallbackReason = result.error || "No results returned";
  return res.status(200).json({
    accounts,
    logEntry: `Apify unavailable (${fallbackReason}). Loaded ${accounts.length} demo accounts as fallback.`,
    mode: "demo",
  });
}
