/**
 * POST /api/score-accounts
 *
 * Scores accounts using rule-based scoring engine.
 * If LLM is available, uses LLM to propose sub-scores but final calculation
 * still uses predefined weights (30/20/20/15/15).
 *
 * Input: { accounts: Account[], icpDescription: string }
 * Output: { accounts: Account[], logEntry: string }
 *
 * Requirements: 5.1-5.11
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { Account, ScoreAccountsResponse } from "@/types";
import { scoreAccounts, rankAccounts } from "@/lib/scoring";
import { getEnvConfig } from "@/lib/env";
import { createLlmProvider } from "@/lib/providers/llm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScoreAccountsResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accounts, icpDescription } = req.body;

  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  let scored: Account[];
  let scoringMethod = "rule-based";

  // Check if LLM is available for scoring
  const env = getEnvConfig();
  const llmAvailable = env.capabilities.scoring === "live" && env.llmApiKey && env.llmProvider;

  if (llmAvailable && icpDescription) {
    // LLM proposes sub-scores, but final calculation still uses predefined weights
    try {
      const llm = createLlmProvider();
      const llmScored = await llm.scoreAccounts(
        accounts,
        icpDescription,
        env.llmApiKey!,
        env.llmProvider!
      );
      // LLM returns accounts with proposed scores — rank them
      scored = rankAccounts(llmScored);
      scoringMethod = "llm-assisted";
    } catch {
      // Fallback to rule-based scoring if LLM fails
      scored = scoreAccounts(accounts);
      scoringMethod = "rule-based (LLM fallback)";
    }
  } else {
    // Pure rule-based scoring
    scored = scoreAccounts(accounts);
  }

  const outreachReady = scored.filter(
    (a) => a.opportunityScore?.recommendedAction === "generate_outreach"
  ).length;
  const research = scored.filter(
    (a) => a.opportunityScore?.recommendedAction === "research_further"
  ).length;
  const deprioritized = scored.filter(
    (a) => a.opportunityScore?.recommendedAction === "deprioritize"
  ).length;

  return res.status(200).json({
    accounts: scored,
    logEntry: `Scored ${scored.length} accounts (${scoringMethod}). ${outreachReady} for outreach, ${research} for research, ${deprioritized} deprioritized.`,
  });
}
