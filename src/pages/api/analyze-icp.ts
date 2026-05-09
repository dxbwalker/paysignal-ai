import type { NextApiRequest, NextApiResponse } from "next";
import type { AnalyzeIcpResponse } from "@/types";
import { parseIcp, hasBusinessContext } from "@/lib/icp-parser";

/**
 * POST /api/analyze-icp
 *
 * Accepts an ICP description, validates it, runs the ICP parser
 * (rule-based extraction), and returns a SearchPlan + rationale.
 *
 * Validation:
 * - Rejects descriptions < 20 characters
 * - Rejects descriptions > 2000 characters
 * - Rejects descriptions with no identifiable business context
 * - Suggests narrowing if < 2 targeting dimensions found
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeIcpResponse | { error: string; suggestedNarrowing?: string[] }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { icpDescription } = req.body as { icpDescription?: string };

  // Validate presence
  if (!icpDescription || typeof icpDescription !== "string") {
    return res.status(400).json({
      error: "ICP description is required.",
    });
  }

  const trimmed = icpDescription.trim();

  // Validate length
  if (trimmed.length < 20) {
    return res.status(400).json({
      error: "ICP description must be at least 20 characters. Please provide more detail about your target customers.",
    });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({
      error: "ICP description must be 2000 characters or fewer.",
    });
  }

  // Validate business context
  if (!hasBusinessContext(trimmed)) {
    return res.status(400).json({
      error: "No identifiable business context found. Please include at least one business-relevant targeting concept (industry, company type, payment pain, or buyer persona).",
    });
  }

  // Parse ICP
  const { searchPlan, rationale, dimensionCount } = parseIcp(trimmed);

  // If fewer than 2 targeting dimensions, include suggestedNarrowing in the plan
  // (already handled by parseIcp, but we can also note it in the response)
  if (dimensionCount < 2 && searchPlan.suggestedNarrowing) {
    return res.status(200).json({
      searchPlan,
      rationale: rationale + " Consider adding more targeting dimensions for better results.",
    });
  }

  return res.status(200).json({
    searchPlan,
    rationale,
  });
}
