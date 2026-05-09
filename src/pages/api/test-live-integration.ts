/**
 * API Route: /api/test-live-integration
 *
 * Runs live integration tests for all providers.
 * Tests Task 18.7 (end-to-end with all providers) and Task 18.8 (fallback degradation).
 *
 * GET /api/test-live-integration — runs all tests and returns report
 *
 * This endpoint is for development/verification only.
 * It tests:
 * - Apify provider wired to live LinkedIn Lead Scraper API (30s timeout)
 * - Person-to-account normalization from live responses
 * - Business model classification from live metadata
 * - Deduplication with low-confidence flagging
 * - Web search provider wired to live API
 * - LLM provider wired to configured API (scoring + generation)
 * - Full end-to-end pipeline
 * - Graceful fallback when each provider is disabled/fails
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { runLiveIntegrationTests } from "@/lib/providers/live-integration-test";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const report = await runLiveIntegrationTests();

    const statusCode = report.summary.failed > 0 ? 207 : 200;

    return res.status(statusCode).json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      error: `Integration test runner failed: ${message}`,
    });
  }
}
