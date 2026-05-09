/**
 * Opportunity Scorer — rule-based scoring engine with 5 weighted dimensions.
 * Weights: payment_complexity 30%, operational_urgency 20%, automation_fit 20%,
 *          buyer_accessibility 15%, confidence 15%
 *
 * Sub-score calculation per dimension:
 *   - Group evidence cards by their `dimension` field
 *   - Observed cards contribute ~25 points each (weight 2x)
 *   - Inferred cards contribute ~12 points each (weight 1x)
 *   - Sub-score capped at 100
 *   - Dimensions with no evidence get sub-score 0
 *
 * Confidence penalty: if account.confidencePenalty is true, reduce confidence sub-score by 20 (min 0)
 * Inferred ratio penalty: if >50% of all evidence cards are inferred, halve the confidence sub-score
 *
 * Requirements: 5.1-5.11
 */

import type {
  Account,
  OpportunityScore,
  DimensionScore,
  ScoringDimension,
  EvidenceCard,
  RecommendedAction,
} from "@/types";

// --- Dimension Weights ---

export const DIMENSION_WEIGHTS: Record<ScoringDimension, number> = {
  payment_complexity: 0.30,
  operational_urgency: 0.20,
  automation_fit: 0.20,
  buyer_accessibility: 0.15,
  confidence: 0.15,
};

// --- Points per evidence card ---

const OBSERVED_CARD_POINTS = 25;
const INFERRED_CARD_POINTS = 12;

// --- Sub-score calculation ---

/**
 * Calculate the sub-score for a single dimension based on contributing evidence cards.
 * Observed cards contribute ~25 points (2x weight), inferred cards ~12 points (1x weight).
 * Capped at 100.
 */
function scoreDimension(dimension: ScoringDimension, cards: EvidenceCard[]): DimensionScore {
  const relevantCards = cards.filter((c) => c.dimension === dimension);

  if (relevantCards.length === 0) {
    return {
      name: dimension,
      weight: DIMENSION_WEIGHTS[dimension],
      subScore: 0,
      contributingSignals: [],
    };
  }

  // Calculate sub-score: observed cards ~25 pts, inferred cards ~12 pts
  const totalPoints = relevantCards.reduce((sum, card) => {
    const points = card.evidenceType === "observed" ? OBSERVED_CARD_POINTS : INFERRED_CARD_POINTS;
    return sum + points;
  }, 0);

  const subScore = Math.min(100, totalPoints);

  return {
    name: dimension,
    weight: DIMENSION_WEIGHTS[dimension],
    subScore,
    contributingSignals: relevantCards.map((c) => c.id),
  };
}

// --- Top factors ---

/**
 * Pick the top N dimensions with highest sub-scores and describe their strongest signal.
 */
function getTopFactors(dimensions: DimensionScore[], cards: EvidenceCard[], limit: number): string[] {
  const sorted = [...dimensions]
    .filter((d) => d.subScore > 0)
    .sort((a, b) => b.subScore - a.subScore)
    .slice(0, limit);

  return sorted.map((dim) => {
    // Find the strongest signal in this dimension (prefer observed)
    const dimCards = cards.filter((c) => c.dimension === dim.name);
    const bestCard = dimCards.sort((a, b) => {
      // Prefer observed over inferred
      if (a.evidenceType !== b.evidenceType) {
        return a.evidenceType === "observed" ? -1 : 1;
      }
      return 0;
    })[0];

    if (bestCard) {
      return `${dim.name.replace(/_/g, " ")}: ${bestCard.rawEvidence.slice(0, 100)}`;
    }
    return `Strong ${dim.name.replace(/_/g, " ")} signals`;
  });
}

// --- Missing factors ---

/**
 * Pick up to N dimensions with sub-score 0 or very low (<20).
 */
function getMissingFactors(dimensions: DimensionScore[], limit: number): string[] {
  const missing: string[] = [];

  for (const dim of dimensions) {
    if (dim.subScore === 0) {
      missing.push(`No evidence for ${dim.name.replace(/_/g, " ")}`);
    } else if (dim.subScore < 20) {
      missing.push(`Weak evidence for ${dim.name.replace(/_/g, " ")} (score: ${dim.subScore})`);
    }
  }

  return missing.slice(0, limit);
}

// --- Deprioritize reason ---

/**
 * Generate a human-readable explanation for why an account was deprioritized.
 * Based on which dimensions are weakest: weak evidence, poor buyer fit,
 * low payment complexity, or insufficient confidence.
 */
function getDeprioritizeReason(dimensions: DimensionScore[], cards: EvidenceCard[]): string {
  const weakDimensions = dimensions.filter((d) => d.subScore < 20);
  const weakNames = weakDimensions.map((d) => d.name);

  // Check specific weakness patterns
  if (weakNames.includes("payment_complexity")) {
    return "Low payment complexity evidence. The account does not show strong signals of multi-party payments, reconciliation needs, or payout operations.";
  }

  if (weakNames.includes("buyer_accessibility")) {
    return "Poor buyer fit. No identifiable decision-makers with relevant payment operations titles were found.";
  }

  if (weakNames.includes("confidence")) {
    return "Insufficient confidence. Most evidence is inferred rather than directly observed, making it unreliable for outreach.";
  }

  if (weakDimensions.length >= 3) {
    return `Weak evidence across ${weakDimensions.map((d) => d.name.replace(/_/g, " ")).join(", ")}. Not enough signal to justify outreach.`;
  }

  const inferredRatio = cards.filter((c) => c.evidenceType === "inferred").length / Math.max(1, cards.length);
  if (inferredRatio > 0.7) {
    return "Most evidence is inferred rather than directly observed. Insufficient confidence for outreach.";
  }

  if (cards.length < 2) {
    return "Too few evidence signals to assess payment complexity. Needs further research.";
  }

  return "Overall opportunity score too low based on available evidence.";
}

// --- Main scoring function ---

/**
 * Calculate the Opportunity Score for a single account using rule-based scoring.
 */
export function scoreAccount(account: Account): Account {
  const cards = account.evidenceCards;

  // Score each dimension
  const dimensions: DimensionScore[] = [
    scoreDimension("payment_complexity", cards),
    scoreDimension("operational_urgency", cards),
    scoreDimension("automation_fit", cards),
    scoreDimension("buyer_accessibility", cards),
    scoreDimension("confidence", cards),
  ];

  // Apply confidence penalty if flagged by enrichment agent
  if (account.confidencePenalty) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) {
      confDim.subScore = Math.max(0, confDim.subScore - 20);
    }
  }

  // Apply inferred ratio penalty: halve confidence sub-score when >50% of evidence cards are inferred
  const totalCards = cards.length;
  const inferredCount = cards.filter((c) => c.evidenceType === "inferred").length;
  const inferredRatio = inferredCount / Math.max(1, totalCards);

  if (inferredRatio > 0.5) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) {
      confDim.subScore = Math.floor(confDim.subScore / 2);
    }
  }

  // Calculate total weighted score
  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.subScore * d.weight, 0)
  );

  // Determine recommended action
  const recommendedAction: RecommendedAction =
    total >= 60 ? "generate_outreach" :
    total >= 40 ? "research_further" : "deprioritize";

  const opportunityScore: OpportunityScore = {
    total,
    dimensions,
    topFactors: getTopFactors(dimensions, cards, 3),
    missingFactors: getMissingFactors(dimensions, 3),
    recommendedAction,
    deprioritizeReason: recommendedAction === "deprioritize"
      ? getDeprioritizeReason(dimensions, cards)
      : undefined,
  };

  return {
    ...account,
    opportunityScore,
    status: recommendedAction === "deprioritize" ? "deprioritized" : "scored",
    deprioritizeReason: opportunityScore.deprioritizeReason,
  };
}

// --- LLM-assisted scoring ---

/**
 * Apply LLM-proposed sub-scores while still using predefined weights for final calculation.
 * The LLM proposes sub-scores per dimension, but the final total is always calculated
 * using the predefined weight model (30/20/20/15/15).
 */
export function applyLlmProposedScores(
  account: Account,
  proposedSubScores: Partial<Record<ScoringDimension, number>>
): Account {
  const cards = account.evidenceCards;

  // Start with rule-based dimension scores for structure
  const dimensions: DimensionScore[] = [
    scoreDimension("payment_complexity", cards),
    scoreDimension("operational_urgency", cards),
    scoreDimension("automation_fit", cards),
    scoreDimension("buyer_accessibility", cards),
    scoreDimension("confidence", cards),
  ];

  // Override sub-scores with LLM proposals (clamped 0-100)
  for (const dim of dimensions) {
    const proposed = proposedSubScores[dim.name];
    if (proposed !== undefined) {
      dim.subScore = Math.max(0, Math.min(100, Math.round(proposed)));
    }
  }

  // Still apply confidence penalty if flagged
  if (account.confidencePenalty) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) {
      confDim.subScore = Math.max(0, confDim.subScore - 20);
    }
  }

  // Still apply inferred ratio penalty
  const totalCards = cards.length;
  const inferredCount = cards.filter((c) => c.evidenceType === "inferred").length;
  const inferredRatio = inferredCount / Math.max(1, totalCards);

  if (inferredRatio > 0.5) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) {
      confDim.subScore = Math.floor(confDim.subScore / 2);
    }
  }

  // Final calculation ALWAYS uses predefined weights
  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.subScore * d.weight, 0)
  );

  const recommendedAction: RecommendedAction =
    total >= 60 ? "generate_outreach" :
    total >= 40 ? "research_further" : "deprioritize";

  const opportunityScore: OpportunityScore = {
    total,
    dimensions,
    topFactors: getTopFactors(dimensions, cards, 3),
    missingFactors: getMissingFactors(dimensions, 3),
    recommendedAction,
    deprioritizeReason: recommendedAction === "deprioritize"
      ? getDeprioritizeReason(dimensions, cards)
      : undefined,
  };

  return {
    ...account,
    opportunityScore,
    status: recommendedAction === "deprioritize" ? "deprioritized" : "scored",
    deprioritizeReason: opportunityScore.deprioritizeReason,
  };
}

// --- Batch scoring with ranking ---

/**
 * Score multiple accounts and rank by total score descending.
 * Confidence sub-score is used as tiebreaker.
 */
export function scoreAccounts(accounts: Account[]): Account[] {
  const scored = accounts.map(scoreAccount);
  return rankAccounts(scored);
}

/**
 * Rank accounts descending by total score, confidence sub-score as tiebreaker.
 */
export function rankAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    const scoreA = a.opportunityScore?.total ?? 0;
    const scoreB = b.opportunityScore?.total ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // Tiebreaker: confidence sub-score
    const confA = a.opportunityScore?.dimensions.find((d) => d.name === "confidence")?.subScore ?? 0;
    const confB = b.opportunityScore?.dimensions.find((d) => d.name === "confidence")?.subScore ?? 0;
    return confB - confA;
  });
}
