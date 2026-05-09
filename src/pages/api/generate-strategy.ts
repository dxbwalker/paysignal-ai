import type { NextApiRequest, NextApiResponse } from "next";
import { generateStrategy } from "@/lib/outreach-strategy";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { account, campaignId } = req.body;

  if (!account) {
    return res.status(400).json({ success: false, error: "account required" });
  }

  if (account.suppressedAt) {
    return res.status(403).json({ success: false, error: "Account is suppressed. Cannot generate strategy." });
  }

  if (!account.evidenceCards || account.evidenceCards.length < 1) {
    return res.status(400).json({ success: false, error: "Insufficient evidence. At least 1 Evidence_Card required." });
  }

  if (!account.opportunityScore || account.opportunityScore.total < 60) {
    return res.status(400).json({ success: false, error: "Account score below 60. Strategy not generated." });
  }

  const strategy = generateStrategy(account, campaignId);

  if (!strategy) {
    return res.status(400).json({ success: false, error: "Could not generate strategy for this account." });
  }

  return res.status(200).json({ success: true, strategy });
}
