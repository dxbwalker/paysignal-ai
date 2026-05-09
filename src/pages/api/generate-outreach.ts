import type { NextApiRequest, NextApiResponse } from "next";
import { generateOutreachPack } from "@/lib/outreach-templates";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { account } = req.body;
  if (!account) {
    return res.status(400).json({ error: "account required" });
  }

  if (account.suppressedAt) {
    return res.status(403).json({ error: "Account is suppressed. Cannot generate outreach." });
  }

  if (!account.evidenceCards || account.evidenceCards.length < 1) {
    return res.status(400).json({ error: "Insufficient evidence. At least 1 Evidence_Card required." });
  }

  const pack = generateOutreachPack(account);
  if (!pack) {
    return res.status(400).json({ error: "Could not generate outreach pack." });
  }

  return res.status(200).json({ outreachPack: pack });
}
