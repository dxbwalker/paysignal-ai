/**
 * Seed Data Validator — verifies demo accounts meet all quality gates.
 * Can be run as a script or imported for runtime checks.
 */

import { getDemoAccounts } from "./demo-data";
import { generateStrategy } from "./outreach-strategy";

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSeedData(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const accounts = getDemoAccounts();

  // Must have exactly 5 accounts
  if (accounts.length !== 5) {
    errors.push(`Expected 5 seed accounts, got ${accounts.length}`);
  }

  for (const account of accounts) {
    const prefix = `[${account.name}]`;

    // Every account must have an ID
    if (!account.id) errors.push(`${prefix} Missing account ID`);

    // Every account must have evidence cards
    if (account.evidenceCards.length < 1) {
      errors.push(`${prefix} Has no evidence cards`);
    }

    // Accounts scoring ≥60 must have ≥3 evidence cards
    if (account.opportunityScore && account.opportunityScore.total >= 60) {
      if (account.evidenceCards.length < 3) {
        errors.push(`${prefix} Score ≥60 but has fewer than 3 evidence cards (has ${account.evidenceCards.length})`);
      }
    }

    // Every evidence card must have required fields
    for (const card of account.evidenceCards) {
      if (!card.id) errors.push(`${prefix} Evidence card missing ID`);
      if (!card.evidenceType) errors.push(`${prefix} Evidence card ${card.id} missing evidenceType`);
      if (!card.sourceLabel) errors.push(`${prefix} Evidence card ${card.id} missing sourceLabel`);
      if (!card.sourceReliability) errors.push(`${prefix} Evidence card ${card.id} missing sourceReliability`);
      if (!card.confidenceLevel) errors.push(`${prefix} Evidence card ${card.id} missing confidenceLevel`);
      if (!card.dimension) errors.push(`${prefix} Evidence card ${card.id} missing dimension`);
      if (card.sourceOrigin !== "demo") {
        warnings.push(`${prefix} Evidence card ${card.id} has sourceOrigin="${card.sourceOrigin}" (expected "demo" for seed data)`);
      }
    }

    // All accounts must have complete OpportunityScore
    if (!account.opportunityScore) {
      errors.push(`${prefix} Missing opportunityScore`);
    } else {
      const score = account.opportunityScore;
      if (score.dimensions.length !== 5) {
        errors.push(`${prefix} OpportunityScore has ${score.dimensions.length} dimensions (expected 5)`);
      }
      if (!score.recommendedAction) {
        errors.push(`${prefix} OpportunityScore missing recommendedAction`);
      }
    }

    // Accounts scoring ≥60 must have brief and outreach
    if (account.opportunityScore && account.opportunityScore.total >= 60) {
      if (!account.opportunityBrief) {
        errors.push(`${prefix} Score ≥60 but missing AccountOpportunityBrief`);
      }
      if (!account.outreachPack) {
        errors.push(`${prefix} Score ≥60 but missing OutreachPack`);
      }

      // Outreach must have evidence references
      if (account.outreachPack) {
        if (account.outreachPack.claimEvidenceIds.length === 0) {
          errors.push(`${prefix} OutreachPack has no claimEvidenceIds`);
        }
        // Every referenced ID must exist
        for (const refId of account.outreachPack.claimEvidenceIds) {
          if (!account.evidenceCards.some((c) => c.id === refId)) {
            errors.push(`${prefix} OutreachPack references non-existent evidence card "${refId}"`);
          }
        }
      }

      // Brief evidence must be traceable
      if (account.opportunityBrief) {
        for (const ev of account.opportunityBrief.supportingEvidence) {
          if (ev.evidenceCardId && !account.evidenceCards.some((c) => c.id === ev.evidenceCardId)) {
            errors.push(`${prefix} Brief references non-existent evidence card "${ev.evidenceCardId}"`);
          }
        }
      }

      // Strategy should be generatable
      const strategy = generateStrategy(account);
      if (!strategy) {
        warnings.push(`${prefix} Score ≥60 but generateStrategy returned null`);
      } else {
        if (strategy.sequence.length !== 4) {
          warnings.push(`${prefix} Strategy has ${strategy.sequence.length} steps (expected 4)`);
        }
        for (const step of strategy.sequence) {
          if (step.claimEvidenceIds.length === 0) {
            warnings.push(`${prefix} Strategy step "${step.channel} Day ${step.dayOffset}" has no evidence references`);
          }
        }
      }
    }

    // Accounts scoring <60 must have deprioritize/research reason
    if (account.opportunityScore && account.opportunityScore.total < 40) {
      if (!account.deprioritizeReason && !account.opportunityScore.deprioritizeReason) {
        errors.push(`${prefix} Score <40 but missing deprioritizeReason`);
      }
    }

    // Check for unsupported quantified claims in outreach
    if (account.outreachPack) {
      const allText = [
        account.outreachPack.email.body,
        account.outreachPack.linkedinMessage,
        account.outreachPack.followUp,
        account.outreachPack.whyThisAccountWhyNow,
      ].join(" ");

      const quantifiedPattern = /\d+%|\d+x\s+(more|faster|better|cheaper)/i;
      if (quantifiedPattern.test(allText)) {
        errors.push(`${prefix} OutreachPack contains unsupported quantified claim (% or Nx)`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// Run as script if executed directly
if (typeof require !== "undefined" && require.main === module) {
  const result = validateSeedData();
  console.log(`\n=== Seed Data Validation ===`);
  console.log(`Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}`);
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((e) => console.log(`  ❌ ${e}`));
  }
  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
  }
  console.log("");
  process.exit(result.passed ? 0 : 1);
}
