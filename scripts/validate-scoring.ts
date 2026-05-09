/**
 * Scoring Validation Script
 * Lightweight validation for:
 * 1. Scoring weight calculation correctness
 * 2. Inferred-evidence penalty application
 * 3. Outreach claim traceability (using src/lib/traceability.ts)
 *
 * Requirements: 5.1-5.11, 7.6, 8.9, 9.10
 * Run: npx tsx scripts/validate-scoring.ts
 */

import { demoAccounts } from "../src/lib/demo-data";
import { scoreAccount, DIMENSION_WEIGHTS } from "../src/lib/scoring";
import { validateAllTraceability } from "../src/lib/traceability";
import type { Account } from "../src/types";

// --- Helpers ---

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function section(title: string): void {
  console.log(`\n━━━ ${title} ━━━`);
}

// ============================================================
// 1. SCORING WEIGHT CALCULATION
// ============================================================

section("1. Scoring Weight Calculation");

// Verify dimension weights are correct (30/20/20/15/15)
assert(
  DIMENSION_WEIGHTS.payment_complexity === 0.30,
  `payment_complexity weight = 0.30 (actual: ${DIMENSION_WEIGHTS.payment_complexity})`
);
assert(
  DIMENSION_WEIGHTS.operational_urgency === 0.20,
  `operational_urgency weight = 0.20 (actual: ${DIMENSION_WEIGHTS.operational_urgency})`
);
assert(
  DIMENSION_WEIGHTS.automation_fit === 0.20,
  `automation_fit weight = 0.20 (actual: ${DIMENSION_WEIGHTS.automation_fit})`
);
assert(
  DIMENSION_WEIGHTS.buyer_accessibility === 0.15,
  `buyer_accessibility weight = 0.15 (actual: ${DIMENSION_WEIGHTS.buyer_accessibility})`
);
assert(
  DIMENSION_WEIGHTS.confidence === 0.15,
  `confidence weight = 0.15 (actual: ${DIMENSION_WEIGHTS.confidence})`
);

// Verify weights sum to 1.0
const weightSum = Object.values(DIMENSION_WEIGHTS).reduce((s, w) => s + w, 0);
assert(
  Math.abs(weightSum - 1.0) < 0.001,
  `All weights sum to 1.0 (actual: ${weightSum.toFixed(4)})`
);

// Verify scoring function produces correct total from sub-scores
for (const account of demoAccounts) {
  if (!account.opportunityScore) continue;

  const dims = account.opportunityScore.dimensions;
  const expectedTotal = Math.round(
    dims.reduce((sum, d) => sum + d.subScore * d.weight, 0)
  );
  const actualTotal = account.opportunityScore.total;

  assert(
    Math.abs(expectedTotal - actualTotal) <= 1,
    `${account.name}: total ${actualTotal} matches weighted sum ${expectedTotal} (±1 rounding)`
  );

  // Verify each dimension has correct weight
  for (const dim of dims) {
    assert(
      dim.weight === DIMENSION_WEIGHTS[dim.name],
      `${account.name} → ${dim.name}: weight ${dim.weight} matches expected ${DIMENSION_WEIGHTS[dim.name]}`
    );
  }
}

// Verify re-scoring produces consistent results
section("1b. Re-scoring Consistency");

for (const account of demoAccounts) {
  // Strip existing score and re-score
  const stripped: Account = {
    ...account,
    opportunityScore: undefined,
    status: "discovered",
  };
  const rescored = scoreAccount(stripped);

  assert(
    !!rescored.opportunityScore,
    `${account.name}: re-scoring produces a score`
  );

  if (rescored.opportunityScore) {
    // Verify recommended action matches score threshold
    const score = rescored.opportunityScore.total;
    const action = rescored.opportunityScore.recommendedAction;

    if (score >= 60) {
      assert(action === "generate_outreach", `${account.name}: score ${score} → generate_outreach`);
    } else if (score >= 40) {
      assert(action === "research_further", `${account.name}: score ${score} → research_further`);
    } else {
      assert(action === "deprioritize", `${account.name}: score ${score} → deprioritize`);
    }
  }
}

// ============================================================
// 2. INFERRED-EVIDENCE PENALTY
// ============================================================

section("2. Inferred-Evidence Penalty");

// Test: account with >50% inferred evidence should have halved confidence sub-score
const freightPay = demoAccounts.find((a) => a.name === "FreightPay");
if (freightPay) {
  const totalCards = freightPay.evidenceCards.length;
  const inferredCards = freightPay.evidenceCards.filter(
    (c) => c.evidenceType === "inferred"
  ).length;
  const inferredRatio = inferredCards / Math.max(1, totalCards);

  console.log(
    `  FreightPay: ${inferredCards}/${totalCards} inferred (${(inferredRatio * 100).toFixed(0)}%)`
  );

  assert(
    inferredRatio > 0.5,
    `FreightPay has >50% inferred evidence (${(inferredRatio * 100).toFixed(0)}%)`
  );

  // FreightPay also has confidencePenalty = true
  assert(
    freightPay.confidencePenalty === true,
    `FreightPay has confidencePenalty flag set`
  );

  // Re-score to verify penalty is applied
  const stripped: Account = {
    ...freightPay,
    opportunityScore: undefined,
    status: "discovered",
  };
  const rescored = scoreAccount(stripped);

  if (rescored.opportunityScore) {
    const confDim = rescored.opportunityScore.dimensions.find(
      (d) => d.name === "confidence"
    );
    assert(
      !!confDim,
      `FreightPay re-scored: confidence dimension exists`
    );

    if (confDim) {
      // With both penalties (confidencePenalty -20 AND inferred ratio halving),
      // confidence should be significantly reduced
      assert(
        confDim.subScore < 50,
        `FreightPay confidence sub-score penalized: ${confDim.subScore} < 50`
      );
    }
  }
}

// Test: account with mostly observed evidence should NOT have penalty
const marketFlow = demoAccounts.find((a) => a.name === "MarketFlow");
if (marketFlow) {
  const totalCards = marketFlow.evidenceCards.length;
  const inferredCards = marketFlow.evidenceCards.filter(
    (c) => c.evidenceType === "inferred"
  ).length;
  const inferredRatio = inferredCards / Math.max(1, totalCards);

  assert(
    inferredRatio <= 0.5,
    `MarketFlow has ≤50% inferred evidence (${(inferredRatio * 100).toFixed(0)}%) — no penalty`
  );

  assert(
    marketFlow.confidencePenalty === false,
    `MarketFlow has no confidencePenalty flag`
  );
}

// Test: verify observed evidence is weighted 2x over inferred
section("2b. Observed vs Inferred Weighting");

// Create a synthetic test: same dimension, one observed vs one inferred
const syntheticObserved: Account = {
  id: "test-observed",
  name: "TestObserved",
  location: "Test",
  businessModel: "saas",
  personas: [],
  evidenceCards: [
    {
      id: "test-ev-1",
      signalType: "complex_payouts",
      evidenceType: "observed",
      rawEvidence: "Test observed evidence",
      sourceLabel: "Test",
      sourceOrigin: "demo",
      sourceReliability: "high",
      confidenceLevel: "high",
      whyItMatters: "Test",
      suggestedOutreachAngle: "Test",
      dimension: "payment_complexity",
    },
  ],
  status: "discovered",
  confidencePenalty: false,
};

const syntheticInferred: Account = {
  ...syntheticObserved,
  id: "test-inferred",
  name: "TestInferred",
  evidenceCards: [
    {
      ...syntheticObserved.evidenceCards[0],
      id: "test-ev-2",
      evidenceType: "inferred",
    },
  ],
};

const scoredObserved = scoreAccount(syntheticObserved);
const scoredInferred = scoreAccount(syntheticInferred);

const obsPaymentScore = scoredObserved.opportunityScore?.dimensions.find(
  (d) => d.name === "payment_complexity"
)?.subScore ?? 0;
const infPaymentScore = scoredInferred.opportunityScore?.dimensions.find(
  (d) => d.name === "payment_complexity"
)?.subScore ?? 0;

assert(
  obsPaymentScore > infPaymentScore,
  `Observed evidence scores higher than inferred: ${obsPaymentScore} > ${infPaymentScore}`
);
assert(
  obsPaymentScore >= infPaymentScore * 2,
  `Observed evidence weighted ≥2x inferred: ${obsPaymentScore} ≥ ${infPaymentScore * 2}`
);

// ============================================================
// 3. OUTREACH CLAIM TRACEABILITY
// ============================================================

section("3. Outreach Claim Traceability");

const traceResult = validateAllTraceability(demoAccounts);

console.log(`  Total claims checked: ${traceResult.totalClaimsChecked}`);
console.log(`  Traced claims: ${traceResult.tracedClaimCount}`);
console.log(`  Hypothesis claims: ${traceResult.hypothesisCount}`);
console.log(`  Errors: ${traceResult.errors.length}`);
console.log(`  Warnings: ${traceResult.warnings.length}`);

assert(
  traceResult.valid,
  `All traceability checks pass (no errors)`
);

assert(
  traceResult.totalClaimsChecked > 0,
  `At least one claim was checked (${traceResult.totalClaimsChecked} total)`
);

assert(
  traceResult.tracedClaimCount > 0,
  `At least one claim is properly traced to evidence (${traceResult.tracedClaimCount})`
);

// Report any errors
if (traceResult.errors.length > 0) {
  console.error(`\n  Traceability errors:`);
  for (const err of traceResult.errors) {
    console.error(`    - ${err}`);
  }
}

// Report warnings (non-fatal)
if (traceResult.warnings.length > 0) {
  console.log(`\n  Traceability warnings (non-fatal):`);
  for (const warn of traceResult.warnings) {
    console.log(`    ⚠ ${warn}`);
  }
}

// Verify each outreach-ready account has valid evidence references
section("3b. Per-Account Outreach Traceability");

for (const account of demoAccounts) {
  if (!account.outreachPack) continue;

  const validIds = new Set(account.evidenceCards.map((c) => c.id));
  const packRefs = account.outreachPack.claimEvidenceIds;

  assert(
    packRefs.length > 0,
    `${account.name}: outreach pack references ≥1 evidence card`
  );

  const allValid = packRefs.every((id) => validIds.has(id));
  assert(
    allValid,
    `${account.name}: all outreach evidence references are valid`
  );

  // Verify brief traceability for accounts with briefs
  if (account.opportunityBrief) {
    const briefEvidence = account.opportunityBrief.supportingEvidence;
    const nonHypothesis = briefEvidence.filter(
      (e) => e.evidenceType !== "hypothesis"
    );
    const traced = nonHypothesis.filter(
      (e) => e.evidenceCardId && validIds.has(e.evidenceCardId)
    );

    assert(
      traced.length === nonHypothesis.length || nonHypothesis.length === 0,
      `${account.name}: all non-hypothesis brief claims traced to evidence (${traced.length}/${nonHypothesis.length})`
    );
  }
}

// ============================================================
// SUMMARY
// ============================================================

section("Summary");
console.log(`\n  Total: ${passed + failed} checks`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  console.error(`\n  ⚠️  ${failed} validation(s) failed!`);
  process.exit(1);
} else {
  console.log(`\n  ✅ All scoring validations passed!`);
  process.exit(0);
}
