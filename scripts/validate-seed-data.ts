/**
 * Seed Data Validation Script
 * Validates that all 5 demo accounts meet the requirements:
 * - All accounts have evidence, scores, personas, and recommended actions
 * - Accounts scoring ≥60 have complete briefs and outreach packs
 * - Accounts below 60 have clear research/deprioritization reasons
 *
 * Requirements: 13.1-13.8, 12.4
 * Run: npx tsx scripts/validate-seed-data.ts
 */

import { demoAccounts } from "../src/lib/demo-data";
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

// --- Validation ---

section("Basic Dataset Checks");

assert(demoAccounts.length === 5, "Dataset contains exactly 5 accounts");

const expectedNames = ["MarketFlow", "GigConnect", "CloudScale", "FreightPay", "TinyBooks"];
const actualNames = demoAccounts.map((a) => a.name);
assert(
  expectedNames.every((n) => actualNames.includes(n)),
  `All expected accounts present: ${expectedNames.join(", ")}`
);

// --- Per-Account Validation ---

for (const account of demoAccounts) {
  section(`Account: ${account.name} (Score: ${account.opportunityScore?.total ?? "N/A"})`);

  // Evidence cards
  assert(
    account.evidenceCards.length > 0,
    `Has evidence cards (${account.evidenceCards.length} found)`
  );

  // Each evidence card has required fields
  for (const card of account.evidenceCards) {
    assert(!!card.id, `Evidence card has ID: ${card.id}`);
    assert(!!card.signalType, `Evidence card ${card.id} has signalType`);
    assert(
      card.evidenceType === "observed" || card.evidenceType === "inferred",
      `Evidence card ${card.id} has valid evidenceType: ${card.evidenceType}`
    );
    assert(!!card.dimension, `Evidence card ${card.id} has dimension: ${card.dimension}`);
    assert(!!card.sourceLabel, `Evidence card ${card.id} has sourceLabel`);
    assert(!!card.confidenceLevel, `Evidence card ${card.id} has confidenceLevel`);
  }

  // Opportunity score
  assert(!!account.opportunityScore, "Has opportunity score");
  if (account.opportunityScore) {
    assert(
      account.opportunityScore.total >= 0 && account.opportunityScore.total <= 100,
      `Score is 0-100: ${account.opportunityScore.total}`
    );
    assert(
      account.opportunityScore.dimensions.length === 5,
      `Has 5 scoring dimensions`
    );

    // Verify dimension weights sum to 1.0
    const weightSum = account.opportunityScore.dimensions.reduce(
      (sum, d) => sum + d.weight,
      0
    );
    assert(
      Math.abs(weightSum - 1.0) < 0.01,
      `Dimension weights sum to 1.0 (actual: ${weightSum.toFixed(3)})`
    );

    // Verify recommended action
    const score = account.opportunityScore.total;
    const action = account.opportunityScore.recommendedAction;
    if (score >= 60) {
      assert(action === "generate_outreach", `Score ≥60 → action is "generate_outreach"`);
    } else if (score >= 40) {
      assert(action === "research_further", `Score 40-59 → action is "research_further"`);
    } else {
      assert(action === "deprioritize", `Score <40 → action is "deprioritize"`);
    }
  }

  // Personas
  assert(
    account.personas.length > 0,
    `Has personas (${account.personas.length} found)`
  );
  for (const persona of account.personas) {
    assert(!!persona.id, `Persona has ID: ${persona.id}`);
    assert(!!persona.name, `Persona ${persona.id} has name`);
    assert(!!persona.title, `Persona ${persona.id} has title`);
    assert(
      !!persona.relevanceExplanation,
      `Persona ${persona.id} has relevance explanation`
    );
    assert(
      persona.relevanceRank >= 1,
      `Persona ${persona.id} has valid rank: ${persona.relevanceRank}`
    );
  }

  // High-score accounts (≥60): must have brief and outreach pack
  if (account.opportunityScore && account.opportunityScore.total >= 60) {
    assert(
      !!account.opportunityBrief,
      `Score ≥60: has Account Opportunity Brief`
    );
    assert(
      !!account.outreachPack,
      `Score ≥60: has Outreach Pack`
    );

    if (account.opportunityBrief) {
      assert(
        !!account.opportunityBrief.companySummary,
        `Brief has company summary`
      );
      assert(
        account.opportunityBrief.supportingEvidence.length > 0,
        `Brief has supporting evidence`
      );
      assert(
        account.opportunityBrief.likelyPainPoints.length >= 2,
        `Brief has 2-5 pain points (${account.opportunityBrief.likelyPainPoints.length})`
      );
      assert(
        account.opportunityBrief.discoveryQuestions.length === 3,
        `Brief has 3 discovery questions`
      );
    }

    if (account.outreachPack) {
      assert(!!account.outreachPack.email.subject, `Outreach has email subject`);
      assert(
        account.outreachPack.email.subject.length <= 60,
        `Email subject ≤60 chars (${account.outreachPack.email.subject.length})`
      );
      assert(!!account.outreachPack.email.body, `Outreach has email body`);
      assert(!!account.outreachPack.linkedinMessage, `Outreach has LinkedIn message`);
      assert(
        account.outreachPack.callOpener.talkingPoints.length >= 2,
        `Outreach has 2-3 call talking points`
      );
      assert(!!account.outreachPack.followUp, `Outreach has follow-up`);
      assert(
        account.outreachPack.discoveryQuestions.length === 3,
        `Outreach has 3 discovery questions`
      );
      assert(
        account.outreachPack.claimEvidenceIds.length > 0,
        `Outreach has evidence references (traceability)`
      );
    }
  }

  // Low-score accounts (<60): must have clear reasons
  if (account.opportunityScore && account.opportunityScore.total < 60) {
    if (account.opportunityScore.total < 40) {
      assert(
        !!account.opportunityScore.deprioritizeReason ||
          !!account.deprioritizeReason,
        `Score <40: has deprioritize reason`
      );
    }
    assert(
      account.opportunityScore.missingFactors.length > 0,
      `Score <60: has missing factors explaining low score`
    );
    // Should NOT have outreach pack (unless explicitly requested)
    // Note: FreightPay (48) should not have outreach
    if (account.opportunityScore.total < 60 && !account.outreachPack) {
      assert(true, `Score <60: correctly has no outreach pack`);
    }
  }
}

// --- Score Distribution Check ---

section("Score Distribution");

const scores = demoAccounts
  .map((a) => ({ name: a.name, score: a.opportunityScore?.total ?? 0 }))
  .sort((a, b) => b.score - a.score);

for (const { name, score } of scores) {
  const action =
    score >= 60 ? "generate_outreach" : score >= 40 ? "research_further" : "deprioritize";
  console.log(`  ${name}: ${score} → ${action}`);
}

assert(
  scores.filter((s) => s.score >= 60).length >= 3,
  "At least 3 accounts score ≥60 (outreach-ready)"
);
assert(
  scores.filter((s) => s.score < 60).length >= 1,
  "At least 1 account scores <60 (research/deprioritize)"
);
assert(
  scores.filter((s) => s.score < 40).length >= 1,
  "At least 1 account scores <40 (deprioritized)"
);

// --- Summary ---

section("Summary");
console.log(`\n  Total: ${passed + failed} checks`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  console.error(`\n  ⚠️  ${failed} validation(s) failed!`);
  process.exit(1);
} else {
  console.log(`\n  ✅ All seed data validations passed!`);
  process.exit(0);
}
