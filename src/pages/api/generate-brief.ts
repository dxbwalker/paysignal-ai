/**
 * API Route: POST /api/generate-brief
 * Generates an Account Opportunity Brief using template or LLM via provider.
 * Only generates for accounts with score >= 60.
 * Supports regeneration after evidence/persona edits.
 *
 * Requirements: 8.1-8.9, 11.13
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { generateBrief } from "@/lib/brief-templates";
import type { GenerateBriefResponse } from "@/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { account, regenerate } = req.body;
  if (!account) {
    return res.status(400).json({ error: "account required" });
  }

  // Req 8.1: Only generate for accounts with score >= 60
  if (!account.opportunityScore || account.opportunityScore.total < 60) {
    return res.status(400).json({
      error: "Account score below 60. Brief not generated.",
      scoreRequired: 60,
      currentScore: account.opportunityScore?.total ?? 0,
    });
  }

  // Generate brief (supports regeneration via options)
  const brief = generateBrief(account, { regenerate: !!regenerate });
  if (!brief) {
    return res.status(400).json({ error: "Could not generate brief. Ensure account has evidence cards." });
  }

  const response: GenerateBriefResponse = { brief };
  return res.status(200).json(response);
}
