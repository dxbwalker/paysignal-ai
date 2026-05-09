/**
 * Demo seed data — 5 accounts with full evidence, scores, personas, briefs, and outreach.
 * Populated in Task 3. This file provides the interface stubs.
 */

import type { Account, OutreachPack, AccountOpportunityBrief } from "@/types";

// Placeholder — full seed data will be added in Task 3
export function getDemoAccounts(): Account[] {
  return [];
}

export function getDemoEnrichment(accounts: Account[]): Account[] {
  return accounts;
}

export function getDemoOutreachPack(account: Account): OutreachPack {
  return {
    accountId: account.id,
    whyThisAccountWhyNow: "Demo outreach — seed data will be populated in Task 3.",
    email: {
      subject: "Payment automation for " + account.name,
      body: "Demo email body.",
    },
    linkedinMessage: "Demo LinkedIn message.",
    callOpener: { talkingPoints: ["Demo point 1", "Demo point 2"] },
    followUp: "Demo follow-up.",
    discoveryQuestions: ["Question 1?", "Question 2?", "Question 3?"],
    generatedAt: new Date().toISOString(),
    generationMethod: "template",
    claimEvidenceIds: [],
  };
}

export function getDemoBrief(account: Account): AccountOpportunityBrief {
  return {
    accountId: account.id,
    companySummary: `${account.name} is a ${account.businessModel} company. Demo brief — seed data will be populated in Task 3.`,
    paymentComplexityHypothesis: "Demo hypothesis.",
    supportingEvidence: [],
    likelyPainPoints: ["Demo pain point 1", "Demo pain point 2"],
    recommendedPersonas: account.personas.map((p) => p.id),
    suggestedOutreachAngle: "Demo outreach angle.",
    discoveryQuestions: ["Question 1?", "Question 2?", "Question 3?"],
  };
}
