import type { NextApiRequest, NextApiResponse } from "next";
import type {
  CollectEvidenceRequest,
  CollectEvidenceResponse,
  Account,
} from "@/types";
import { collectEvidenceForAccount } from "@/lib/evidence-collector";
import { getEnvConfig } from "@/lib/env";

/**
 * POST /api/collect-evidence
 *
 * Processes accounts through the Evidence_Collector to detect payment complexity
 * signals from LinkedIn metadata. Uses provider abstraction:
 * - Demo mode: returns seed data evidence (preloaded)
 * - Live mode: runs rule-based signal detection from account metadata
 *
 * Performance target: < 10 seconds per account.
 *
 * Requirements: 3.1-3.8
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CollectEvidenceResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as CollectEvidenceRequest | undefined;

  if (!body || !Array.isArray(body.accounts)) {
    return res.status(400).json({
      error: "Request body must include an 'accounts' array.",
    });
  }

  const { accounts } = body;

  if (accounts.length === 0) {
    return res.status(200).json({
      accounts: [],
      logEntry: "No accounts to process for evidence collection.",
    });
  }

  try {
    const env = getEnvConfig();
    const mode = env.capabilities.discovery === "demo" ? "demo" : "live";

    let processedAccounts: Account[];

    if (mode === "demo") {
      // In demo mode, use preloaded evidence from seed data if available,
      // otherwise still run the collector (it works rule-based without APIs)
      processedAccounts = accounts.map((account) => {
        // If account already has evidence cards (from seed data), keep them
        if (account.evidenceCards && account.evidenceCards.length > 0) {
          return { ...account, status: "evidence_collected" as const };
        }
        // Otherwise run the collector
        return collectEvidenceForAccount(account);
      });
    } else {
      // Live mode: run evidence collection on each account
      // Rule-based detection from metadata — no external API calls needed
      processedAccounts = accounts.map((account) => {
        return collectEvidenceForAccount(account);
      });
    }

    // Build log entry
    const totalCards = processedAccounts.reduce(
      (sum, a) => sum + a.evidenceCards.length,
      0
    );
    const lowEvidenceCount = processedAccounts.filter(
      (a) => a.lowEvidenceWarning
    ).length;

    let logEntry = `Evidence collected for ${processedAccounts.length} accounts. Found ${totalCards} total signals.`;
    if (lowEvidenceCount > 0) {
      logEntry += ` ${lowEvidenceCount} account(s) flagged as low-confidence (no strong signals detected).`;
    }

    return res.status(200).json({
      accounts: processedAccounts,
      logEntry,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during evidence collection";
    return res.status(500).json({
      error: `Evidence collection failed: ${message}`,
    });
  }
}
