import type { NextApiRequest, NextApiResponse } from "next";
import { scoreAccounts } from "@/lib/scoring";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accounts } = req.body;
  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  const scored = scoreAccounts(accounts);
  const outreachReady = scored.filter((a) => a.opportunityScore?.recommendedAction === "generate_outreach").length;
  const research = scored.filter((a) => a.opportunityScore?.recommendedAction === "research_further").length;
  const deprioritized = scored.filter((a) => a.opportunityScore?.recommendedAction === "deprioritize").length;

  return res.status(200).json({
    accounts: scored,
    logEntry: `Scored ${scored.length} accounts. ${outreachReady} for outreach, ${research} for research, ${deprioritized} deprioritized.`,
  });
}
