import type { NextApiRequest, NextApiResponse } from "next";
import { assertServerSide, getEnvConfig } from "@/lib/env";
import { createApifyProvider } from "@/lib/providers/apify";
import { getDemoAccounts } from "@/lib/demo-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  assertServerSide();
  const env = getEnvConfig();
  const { searchPlan } = req.body;

  if (!searchPlan || !searchPlan.keywords?.length) {
    return res.status(400).json({ error: "searchPlan with keywords required" });
  }

  // If no Apify key, return demo data
  if (!env.apifyApiKey) {
    const accounts = getDemoAccounts();
    return res.status(200).json({
      accounts,
      logEntry: `Demo Mode: Loaded ${accounts.length} synthetic accounts.`,
      mode: "demo",
    });
  }

  try {
    const apify = createApifyProvider();
    const accounts = await apify.discover(searchPlan, env.apifyApiKey);

    return res.status(200).json({
      accounts,
      logEntry: `Discovered ${accounts.length} accounts from LinkedIn via Apify.`,
      mode: "live",
    });
  } catch (error: any) {
    // Fallback to demo data
    const accounts = getDemoAccounts();
    return res.status(200).json({
      accounts,
      logEntry: `Apify unavailable (${error.message}). Loaded ${accounts.length} demo accounts.`,
      mode: "demo",
    });
  }
}
