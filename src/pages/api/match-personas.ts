import type { NextApiRequest, NextApiResponse } from "next";
import { matchPersonasForAccounts } from "@/lib/persona-matcher";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { accounts } = req.body;
  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "accounts array required" });
  }

  const matched = matchPersonasForAccounts(accounts);
  const totalPersonas = matched.reduce((sum, a) => sum + a.personas.length, 0);

  return res.status(200).json({
    accounts: matched,
    logEntry: `Matched ${totalPersonas} buyer personas across ${matched.length} accounts.`,
  });
}
