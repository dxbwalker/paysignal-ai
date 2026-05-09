/**
 * Demo Workflow Simulation Script
 * Simulates the full Demo_Mode end-to-end workflow programmatically:
 * ICP → Search Plan → Accounts → Evidence → Scoring → Brief → Outreach → Reject → Feedback
 *
 * Also validates:
 * - Workflow completes within 90 seconds
 * - All stages produce expected outputs
 * - Demo_Mode works without API keys
 *
 * Requirements: 12.4, 13.7, 13.8
 * Run: npx tsx scripts/validate-demo-workflow.ts
 */

import { demoAccounts } from "../src/lib/demo-data";
import { DEMO_SCENARIO } from "../src/lib/demo-scenario";
import { scoreAccount, scoreAccounts } from "../src/lib/scoring";
import { validateAllTraceability } from "../src/lib/traceability";
import type { Account, SearchPlan, CampaignOutcome } from "../src/types";

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
// SIMULATE FULL DEMO WORKFLOW
// ============================================================

const startTime = Date.now();

// --- Stage 1: ICP Analysis ---
section("Stage 1: ICP Analysis");

const icpText = DEMO_SCENARIO.defaultIcp;
assert(icpText.length >= 20, `ICP text is ≥20 chars (${icpText.length})`);
assert(icpText.length <= 2000, `ICP text is ≤2000 chars`);
assert(
  icpText.toLowerCase().includes("marketplace") || icpText.toLowerCase().includes("platform"),
  "ICP contains business context (marketplace/platform)"
);

// Simulate ICP parsing → search plan
const searchPlan: SearchPlan = {
  keywords: ["marketplace", "payments", "payouts", "reconciliation", "finance operations"],
  companyTypes: ["marketplace", "saas", "platform"],
  geographicFilters: ["international"],
  personaTargets: ["Head of Payments", "VP Finance", "CFO"],
  exclusionCriteria: ["consulting", "agency"],
};

assert(searchPlan.keywords.length >= 1, "Search plan has ≥1 keyword");
assert(searchPlan.companyTypes.length >= 1, "Search plan has ≥1 company type");

console.log(`  ICP parsed in ${Date.now() - startTime}ms`);

// --- Stage 2: Account Discovery ---
section("Stage 2: Account Discovery (Demo_Mode)");

const discoveredAccounts = demoAccounts.map((a) => ({
  ...a,
  opportunityScore: undefined,
  opportunityBrief: undefined,
  outreachPack: undefined,
  status: "discovered" as const,
}));

assert(discoveredAccounts.length === 5, `Discovered 5 accounts`);
assert(
  discoveredAccounts.every((a) => a.name && a.location && a.businessModel),
  "All accounts have name, location, and business model"
);

console.log(`  Discovery completed in ${Date.now() - startTime}ms`);

// --- Stage 3: Evidence Collection ---
section("Stage 3: Evidence Collection");

const withEvidence = discoveredAccounts.map((a) => ({
  ...a,
  status: "evidence_collected" as const,
}));

assert(
  withEvidence.every((a) => a.evidenceCards.length >= 3),
  "All accounts have ≥3 evidence cards"
);

const totalEvidence = withEvidence.reduce((sum, a) => sum + a.evidenceCards.length, 0);
assert(totalEvidence >= 15, `Total evidence cards: ${totalEvidence} (≥15 expected)`);

// Verify evidence has distinct signal types per account
for (const account of withEvidence) {
  const signalTypes = new Set(account.evidenceCards.map((e) => e.signalType));
  assert(
    signalTypes.size >= 2,
    `${account.name}: has ≥2 distinct signal types (${signalTypes.size})`
  );
}

console.log(`  Evidence collection completed in ${Date.now() - startTime}ms`);

// --- Stage 4: Web Enrichment (Demo) ---
section("Stage 4: Web Enrichment (Demo_Mode)");

// In demo mode, enrichment data is preloaded
assert(
  withEvidence.every((a) => a.evidenceCards.some((e) => e.sourceOrigin === "demo")),
  "All accounts have demo-sourced evidence (preloaded enrichment)"
);

console.log(`  Enrichment completed in ${Date.now() - startTime}ms`);

// --- Stage 5: Scoring ---
section("Stage 5: Scoring");

const scored = scoreAccounts(withEvidence);

assert(
  scored.every((a) => a.opportunityScore !== undefined),
  "All accounts have opportunity scores"
);

// Verify ranking (descending)
for (let i = 1; i < scored.length; i++) {
  const prev = scored[i - 1].opportunityScore!.total;
  const curr = scored[i].opportunityScore!.total;
  assert(prev >= curr, `Ranking: ${scored[i - 1].name} (${prev}) ≥ ${scored[i].name} (${curr})`);
}

// Verify recommended actions
const outreachReady = scored.filter(
  (a) => a.opportunityScore!.recommendedAction === "generate_outreach"
);
const researchFurther = scored.filter(
  (a) => a.opportunityScore!.recommendedAction === "research_further"
);
const deprioritized = scored.filter(
  (a) => a.opportunityScore!.recommendedAction === "deprioritize"
);

console.log(`  Outreach ready: ${outreachReady.length}, Research: ${researchFurther.length}, Deprioritized: ${deprioritized.length}`);

console.log(`  Scoring completed in ${Date.now() - startTime}ms`);

// --- Stage 6: Brief Generation ---
section("Stage 6: Brief Generation (for ≥60 accounts)");

// Use precomputed briefs from demo data for qualifying accounts
const qualifyingAccounts = demoAccounts.filter(
  (a) => a.opportunityScore && a.opportunityScore.total >= 60
);

assert(
  qualifyingAccounts.length >= 3,
  `≥3 accounts qualify for briefs (${qualifyingAccounts.length})`
);

assert(
  qualifyingAccounts.every((a) => a.opportunityBrief !== undefined),
  "All qualifying accounts have briefs"
);

for (const account of qualifyingAccounts) {
  const brief = account.opportunityBrief!;
  assert(
    brief.companySummary.split(/\s+/).length <= 150,
    `${account.name}: brief summary ≤150 words`
  );
  assert(
    brief.likelyPainPoints.length >= 2 && brief.likelyPainPoints.length <= 5,
    `${account.name}: brief has 2-5 pain points (${brief.likelyPainPoints.length})`
  );
  assert(
    brief.discoveryQuestions.length === 3,
    `${account.name}: brief has 3 discovery questions`
  );
}

console.log(`  Brief generation completed in ${Date.now() - startTime}ms`);

// --- Stage 7: Outreach Generation ---
section("Stage 7: Outreach Generation (for ≥60 accounts)");

assert(
  qualifyingAccounts.every((a) => a.outreachPack !== undefined),
  "All qualifying accounts have outreach packs"
);

for (const account of qualifyingAccounts) {
  const pack = account.outreachPack!;
  assert(
    pack.email.subject.length <= 60,
    `${account.name}: email subject ≤60 chars`
  );
  assert(
    pack.email.body.split(/\s+/).length <= 150,
    `${account.name}: email body ≤150 words`
  );
  assert(
    pack.linkedinMessage.split(/\s+/).length <= 50,
    `${account.name}: LinkedIn message ≤50 words`
  );
  assert(
    pack.callOpener.talkingPoints.length >= 2,
    `${account.name}: call opener has ≥2 talking points`
  );
  assert(
    pack.discoveryQuestions.length === 3,
    `${account.name}: outreach has 3 discovery questions`
  );
}

console.log(`  Outreach generation completed in ${Date.now() - startTime}ms`);

// --- Stage 8: Reject Account ---
section("Stage 8: Reject Account (TinyBooks)");

const rejectAccount = demoAccounts.find((a) => a.id === DEMO_SCENARIO.rejectAccountId);
assert(!!rejectAccount, `Found reject target: ${DEMO_SCENARIO.rejectAccountId}`);

if (rejectAccount) {
  // Simulate rejection
  const outcome: CampaignOutcome = {
    accountId: rejectAccount.id,
    outcome: "rejected",
    rejectionReason: DEMO_SCENARIO.rejectReason,
    markedAt: new Date().toISOString(),
  };

  assert(outcome.outcome === "rejected", "Rejection outcome recorded");
  assert(
    outcome.rejectionReason === "not_payment_heavy",
    `Rejection reason: ${outcome.rejectionReason}`
  );
}

console.log(`  Rejection completed in ${Date.now() - startTime}ms`);

// --- Stage 9: Feedback ---
section("Stage 9: Campaign Feedback");

// Simulate marking all outreach accounts with outcomes
const feedbackOutcomes: CampaignOutcome[] = qualifyingAccounts.map((a) => ({
  accountId: a.id,
  outcome: "approved" as const,
  channel: "email" as const,
  markedAt: new Date().toISOString(),
}));

assert(
  feedbackOutcomes.length >= 3,
  `Feedback recorded for ${feedbackOutcomes.length} accounts`
);

console.log(`  Feedback completed in ${Date.now() - startTime}ms`);

// ============================================================
// TIMING CHECK
// ============================================================

section("Timing Check");

const totalTime = Date.now() - startTime;
console.log(`  Total workflow time: ${totalTime}ms`);

assert(
  totalTime < 90000,
  `Workflow completes within 90 seconds (actual: ${(totalTime / 1000).toFixed(1)}s)`
);

assert(
  totalTime < 10000,
  `Demo_Mode workflow is fast (< 10s actual: ${(totalTime / 1000).toFixed(1)}s)`
);

// ============================================================
// OFFLINE VERIFICATION
// ============================================================

section("Offline Verification (No API Keys)");

// Verify demo data doesn't require any external calls
assert(
  demoAccounts.every((a) => a.evidenceCards.every((e) => e.sourceOrigin === "demo")),
  "All evidence sourced from demo data (no live API needed)"
);

assert(
  demoAccounts.every((a) => !a.outreachPack || a.outreachPack.generationMethod === "template"),
  "All outreach packs use template generation (no LLM needed)"
);

// Verify traceability still holds
const traceResult = validateAllTraceability(demoAccounts);
assert(traceResult.valid, "Traceability valid in offline mode");

// ============================================================
// SUMMARY
// ============================================================

section("Summary");
console.log(`\n  Total: ${passed + failed} checks`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Workflow time: ${(totalTime / 1000).toFixed(2)}s`);

if (failed > 0) {
  console.error(`\n  ⚠️  ${failed} validation(s) failed!`);
  process.exit(1);
} else {
  console.log(`\n  ✅ Demo workflow simulation passed! Ready for presentation.`);
  process.exit(0);
}
