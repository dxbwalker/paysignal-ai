/**
 * Claim Traceability Validator
 * Verifies that every generated claim in outreach and briefs
 * references an Evidence_Card ID or is explicitly labelled as hypothesis.
 *
 * Requirements: 8.9, 9.10, 9.13, 7.6
 */

import type { Account, OutreachPack, AccountOpportunityBrief } from "@/types";

export interface TraceabilityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Number of claims that are properly traced to evidence */
  tracedClaimCount: number;
  /** Number of claims labelled as hypothesis */
  hypothesisCount: number;
  /** Total claims checked */
  totalClaimsChecked: number;
}

/**
 * Validate that an outreach pack only references existing evidence card IDs.
 * Req 7.6: SHALL only reference evidence contained in the account's Evidence_Cards
 * Req 9.10: SHALL NOT generate misleading claims not traceable to an Evidence_Card
 */
export function validateOutreachTraceability(
  pack: OutreachPack,
  account: Account
): TraceabilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validIds = new Set(account.evidenceCards.map((c) => c.id));
  let tracedClaimCount = 0;
  let hypothesisCount = 0;

  // Check all claimed evidence IDs exist
  for (const id of pack.claimEvidenceIds) {
    if (!validIds.has(id)) {
      errors.push(
        `Outreach references evidence card "${id}" which does not exist on account "${account.name}".`
      );
    } else {
      tracedClaimCount++;
    }
  }

  // Check that at least one evidence ID is referenced (Req 7.3)
  if (pack.claimEvidenceIds.length === 0) {
    errors.push(
      `Outreach pack for "${account.name}" has no evidence references (claimEvidenceIds is empty).`
    );
  }

  // Warn if outreach exists for suppressed account (Req 9.13)
  if (account.suppressedAt) {
    warnings.push(
      `Outreach pack exists for suppressed account "${account.name}".`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tracedClaimCount,
    hypothesisCount,
    totalClaimsChecked: pack.claimEvidenceIds.length,
  };
}

/**
 * Validate that a brief only includes claims traceable to evidence cards or labelled as hypotheses.
 * Req 8.9: SHALL only include claims traceable to Evidence_Cards or clearly labelled as hypotheses
 */
export function validateBriefTraceability(
  brief: AccountOpportunityBrief,
  account: Account
): TraceabilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validIds = new Set(account.evidenceCards.map((c) => c.id));
  let tracedClaimCount = 0;
  let hypothesisCount = 0;

  // Check supporting evidence references
  for (const ev of brief.supportingEvidence) {
    if (ev.evidenceCardId && !validIds.has(ev.evidenceCardId)) {
      errors.push(
        `Brief evidence claim "${ev.claim.slice(0, 50)}..." references non-existent card "${ev.evidenceCardId}".`
      );
    }

    // Claims must be observed, inferred, or hypothesis
    if (!["observed", "inferred", "hypothesis"].includes(ev.evidenceType)) {
      errors.push(
        `Brief evidence claim has invalid type "${ev.evidenceType}".`
      );
    }

    // Non-hypothesis claims should have an evidence card ID
    if (ev.evidenceType !== "hypothesis" && !ev.evidenceCardId) {
      warnings.push(
        `Brief claim "${ev.claim.slice(0, 50)}..." is not a hypothesis but has no evidence card reference.`
      );
    }

    // Count traced vs hypothesis
    if (ev.evidenceType === "hypothesis") {
      hypothesisCount++;
    } else if (ev.evidenceCardId && validIds.has(ev.evidenceCardId)) {
      tracedClaimCount++;
    }
  }

  // Check recommended personas exist
  for (const personaId of brief.recommendedPersonas) {
    if (!account.personas.some((p) => p.id === personaId)) {
      warnings.push(
        `Brief recommends persona "${personaId}" which is not linked to account.`
      );
    }
  }

  const totalClaimsChecked = brief.supportingEvidence.length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tracedClaimCount,
    hypothesisCount,
    totalClaimsChecked,
  };
}

/**
 * Validate all accounts in a dataset for traceability.
 * Checks outreach packs, briefs, evidence cards, and score references.
 */
export function validateAllTraceability(accounts: Account[]): TraceabilityResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let totalTraced = 0;
  let totalHypothesis = 0;
  let totalChecked = 0;

  for (const account of accounts) {
    // Validate outreach pack
    if (account.outreachPack) {
      const result = validateOutreachTraceability(account.outreachPack, account);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      totalTraced += result.tracedClaimCount;
      totalHypothesis += result.hypothesisCount;
      totalChecked += result.totalClaimsChecked;
    }

    // Validate brief
    if (account.opportunityBrief) {
      const result = validateBriefTraceability(account.opportunityBrief, account);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      totalTraced += result.tracedClaimCount;
      totalHypothesis += result.hypothesisCount;
      totalChecked += result.totalClaimsChecked;
    }

    // Validate evidence cards have required fields
    for (const card of account.evidenceCards) {
      if (!card.id) allErrors.push(`Evidence card in "${account.name}" missing ID.`);
      if (!card.dimension) allErrors.push(`Evidence card "${card.id}" missing dimension.`);
      if (!card.sourceLabel) allErrors.push(`Evidence card "${card.id}" missing sourceLabel.`);
      if (!card.evidenceType) allErrors.push(`Evidence card "${card.id}" missing evidenceType.`);
    }

    // Validate score references valid evidence
    if (account.opportunityScore) {
      for (const dim of account.opportunityScore.dimensions) {
        for (const signalId of dim.contributingSignals) {
          if (!account.evidenceCards.some((c) => c.id === signalId)) {
            allErrors.push(
              `Score dimension "${dim.name}" references non-existent evidence "${signalId}" in "${account.name}".`
            );
          }
        }
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    tracedClaimCount: totalTraced,
    hypothesisCount: totalHypothesis,
    totalClaimsChecked: totalChecked,
  };
}

/**
 * Quick check: does an outreach pack have at least one valid evidence reference?
 * Used as a pre-flight check before displaying outreach.
 */
export function hasValidEvidenceReferences(
  pack: OutreachPack,
  account: Account
): boolean {
  const validIds = new Set(account.evidenceCards.map((c) => c.id));
  return pack.claimEvidenceIds.some((id) => validIds.has(id));
}

/**
 * Quick check: does a brief have all claims properly traced?
 * Returns true if every non-hypothesis claim has a valid evidence card reference.
 */
export function isBriefFullyTraced(
  brief: AccountOpportunityBrief,
  account: Account
): boolean {
  const validIds = new Set(account.evidenceCards.map((c) => c.id));
  return brief.supportingEvidence.every((ev) => {
    if (ev.evidenceType === "hypothesis") return true;
    return ev.evidenceCardId ? validIds.has(ev.evidenceCardId) : false;
  });
}
