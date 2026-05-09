import type { NextApiRequest, NextApiResponse } from "next";
import { collectEvidenceForAccounts } from "@/lib/evidence-collector";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accounts } = req.body;
  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  const enriched = collectEvidenceForAccounts(accounts);
  const totalCards = enriched.reduce((sum, a) => sum + a.evidenceCards.length, 0);

  return res.status(200).json({
    accounts: enriched,
    logEntry: `Collected ${totalCards} evidence cards across ${enriched.length} accounts.`,
  });
}
