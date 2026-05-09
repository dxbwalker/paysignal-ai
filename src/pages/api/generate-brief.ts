import type { NextApiRequest, NextApiResponse } from "next";
import { generateBrief } from "@/lib/brief-templates";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { account } = req.body;
  if (!account) {
    return res.status(400).json({ error: "account required" });
  }

  if (!account.opportunityScore || account.opportunityScore.total < 60) {
    return res.status(400).json({ error: "Account score below 60. Brief not generated." });
  }

  const brief = generateBrief(account);
  if (!brief) {
    return res.status(400).json({ error: "Could not generate brief." });
  }

  return res.status(200).json({ brief });
}
