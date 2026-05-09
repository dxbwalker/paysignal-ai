/**
 * Claim Traceability Validator
 * Verifies that every generated claim in outreach and briefs
 * references an Evidence_Card ID or is explicitly labelled as hypothesis.
 */

import type { Account, OutreachPack, AccountOpportunityBrief } from "@/types";

export interface TraceabilityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that an outreach pack only references existing evidence card IDs.
 */
export function validateOutreachTraceability(
  pack: OutreachPack,
  account: Account
): TraceabilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validIds = new Set(account.evidenceCards.map((c) => c.id));

  // Check all claimed evidence IDs exist
  for (const id of pack.claimEvidenceIds) {
    if (!validIds.has(id)) {
      errors.push(`Outreach references evidence card "${id}" which does not exist on account "${account.name}".`);
    }
  }

  // Check that at least one evidence ID is referenced
  if (pack.claimEvidenceIds.length === 0) {
    errors.push(`Outreach pack for "${account.name}" has no evidence references (claimEvidenceIds is empty).`);
  }

  // Warn if outreach exists for suppressed account
  if (account.suppressedAt) {
    warnings.push(`Outreach pack exists for suppressed account "${account.name}".`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate that a brief only includes claims traceable to evidence cards or labelled as hypotheses.
 */
export function validateBriefTraceability(
  brief: AccountOpportunityBrief,
  account: Account
): TraceabilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validIds = new Set(account.evidenceCards.map((c) => c.id));

  // Check supporting evidence references
  for (const ev of brief.supportingEvidence) {
    if (ev.evidenceCardId && !validIds.has(ev.evidenceCardId)) {
      errors.push(`Brief evidence claim "${ev.claim.slice(0, 50)}..." references non-existent card "${ev.evidenceCardId}".`);
    }

    // Claims must be observed, inferred, or hypothesis
    if (!["observed", "inferred", "hypothesis"].includes(ev.evidenceType)) {
      errors.push(`Brief evidence claim has invalid type "${ev.evidenceType}".`);
    }

    // Non-hypothesis claims should have an evidence card ID
    if (ev.evidenceType !== "hypothesis" && !ev.evidenceCardId) {
      warnings.push(`Brief claim "${ev.claim.slice(0, 50)}..." is not a hypothesis but has no evidence card reference.`);
    }
  }

  // Check recommended personas exist
  for (const personaId of brief.recommendedPersonas) {
    if (!account.personas.some((p) => p.id === personaId)) {
      warnings.push(`Brief recommends persona "${personaId}" which is not linked to account.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all accounts in a dataset for traceability.
 */
export function validateAllTraceability(accounts: Account[]): TraceabilityResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const account of accounts) {
    // Validate outreach pack
    if (account.outreachPack) {
      const result = validateOutreachTraceability(account.outreachPack, account);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    // Validate brief
    if (account.opportunityBrief) {
      const result = validateBriefTraceability(account.opportunityBrief, account);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
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
            allErrors.push(`Score dimension "${dim.name}" references non-existent evidence "${signalId}" in "${account.name}".`);
          }
        }
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
