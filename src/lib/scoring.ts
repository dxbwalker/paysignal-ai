/**
 * Opportunity Scorer — rule-based scoring engine with 5 weighted dimensions.
 * Weights: payment_complexity 30%, operational_urgency 20%, automation_fit 20%,
 *          buyer_accessibility 15%, confidence 15%
 */

import type { Account, OpportunityScore, DimensionScore, ScoringDimension, EvidenceCard, RecommendedAction } from "@/types";

const DIMENSION_WEIGHTS: Record<ScoringDimension, number> = {
  payment_complexity: 0.30,
  operational_urgency: 0.20,
  automation_fit: 0.20,
  buyer_accessibility: 0.15,
  confidence: 0.15,
};

// Signal strength by evidence type and reliability
function getSignalStrength(card: EvidenceCard): number {
  const baseStrength =
    card.confidenceLevel === "high" ? 30 :
    card.confidenceLevel === "medium" ? 20 : 10;

  // Observed evidence weighted 2x over inferred
  const typeMultiplier = card.evidenceType === "observed" ? 2.0 : 1.0;

  // Reliability bonus
  const reliabilityBonus =
    card.sourceReliability === "high" ? 5 :
    card.sourceReliability === "medium" ? 2 : 0;

  return baseStrength * typeMultiplier + reliabilityBonus;
}

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

  // Sum signal strengths, cap at 100
  const totalStrength = relevantCards.reduce((sum, card) => sum + getSignalStrength(card), 0);
  const subScore = Math.min(100, totalStrength);

  return {
    name: dimension,
    weight: DIMENSION_WEIGHTS[dimension],
    subScore,
    contributingSignals: relevantCards.map((c) => c.id),
  };
}

function getTopFactors(cards: EvidenceCard[], limit: number): string[] {
  // Sort by signal strength descending, take top N
  const sorted = [...cards]
    .sort((a, b) => getSignalStrength(b) - getSignalStrength(a))
    .slice(0, limit);

  return sorted.map((card) => card.rawEvidence.slice(0, 100));
}

function getMissingFactors(dimensions: DimensionScore[]): string[] {
  const missing: string[] = [];

  for (const dim of dimensions) {
    if (dim.subScore === 0) {
      missing.push(`No evidence for ${dim.name.replace(/_/g, " ")}`);
    } else if (dim.subScore < 40) {
      missing.push(`Weak evidence for ${dim.name.replace(/_/g, " ")} (score: ${dim.subScore})`);
    }
  }

  return missing.slice(0, 3);
}

function getDeprioritizeReason(dimensions: DimensionScore[], cards: EvidenceCard[]): string {
  const weakDimensions = dimensions
    .filter((d) => d.subScore < 30)
    .map((d) => d.name.replace(/_/g, " "));

  if (weakDimensions.length >= 3) {
    return `Weak or missing evidence across ${weakDimensions.join(", ")}. Not enough signal to justify outreach.`;
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

/**
 * Calculate the Opportunity Score for a single account.
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

  // Apply confidence penalty if flagged by enrichment
  if (account.confidencePenalty) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) confDim.subScore = Math.max(0, confDim.subScore - 20);
  }

  // Apply inferred evidence penalty: halve confidence when >50% scoring evidence is inferred
  const scoringCards = cards.filter((c) =>
    dimensions.some((d) => d.contributingSignals.includes(c.id))
  );
  const inferredRatio = scoringCards.filter((c) => c.evidenceType === "inferred").length / Math.max(1, scoringCards.length);

  if (inferredRatio > 0.5) {
    const confDim = dimensions.find((d) => d.name === "confidence");
    if (confDim) confDim.subScore = Math.floor(confDim.subScore / 2);
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
    topFactors: getTopFactors(cards, 3),
    missingFactors: getMissingFactors(dimensions),
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

/**
 * Score multiple accounts and rank by total score (confidence as tiebreaker).
 */
export function scoreAccounts(accounts: Account[]): Account[] {
  const scored = accounts.map(scoreAccount);

  return scored.sort((a, b) => {
    const scoreA = a.opportunityScore?.total ?? 0;
    const scoreB = b.opportunityScore?.total ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // Tiebreaker: confidence sub-score
    const confA = a.opportunityScore?.dimensions.find((d) => d.name === "confidence")?.subScore ?? 0;
    const confB = b.opportunityScore?.dimensions.find((d) => d.name === "confidence")?.subScore ?? 0;
    return confB - confA;
  });
}
