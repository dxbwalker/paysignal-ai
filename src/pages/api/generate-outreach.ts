/**
 * API Route: POST /api/generate-outreach
 * Generates an Outreach Pack using template or LLM via provider.
 * Blocks generation for suppressed accounts or accounts with <1 Evidence_Card.
 * Supports regeneration after evidence/persona edits.
 * Supports JSON export via ?export=json query param.
 *
 * Requirements: 7.1-7.10, 9.13, 11.13
 */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  generateOutreachPack,
  checkOutreachBlocked,
  exportOutreachPackAsJson,
} from "@/lib/outreach-templates";
import type { GenerateOutreachResponse } from "@/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { account, regenerate, exportJson } = req.body;
  if (!account) {
    return res.status(400).json({ error: "account required" });
  }

  // Check blocking conditions (Req 7.10, 9.13)
  const blocked = checkOutreachBlocked(account);
  if (blocked) {
    const statusCode = blocked.reason === "suppressed" ? 403 : 400;
    return res.status(statusCode).json({
      error: blocked.message,
      reason: blocked.reason,
    });
  }

  // If not regenerating and account already has a pack, return existing
  if (account.outreachPack && !regenerate) {
    // Support JSON export of existing pack
    if (exportJson) {
      const exported = exportOutreachPackAsJson(account.outreachPack, account.name);
      return res.status(200).json({ outreachPack: account.outreachPack, export: exported });
    }
    const response: GenerateOutreachResponse = { outreachPack: account.outreachPack };
    return res.status(200).json(response);
  }

  // Generate new outreach pack
  const pack = generateOutreachPack(account);
  if (!pack) {
    return res.status(400).json({ error: "Could not generate outreach pack." });
  }

  // Support JSON export (Req 8.5)
  if (exportJson) {
    const exported = exportOutreachPackAsJson(pack, account.name);
    return res.status(200).json({ outreachPack: pack, export: exported });
  }

  const response: GenerateOutreachResponse = { outreachPack: pack };
  return res.status(200).json(response);
}
