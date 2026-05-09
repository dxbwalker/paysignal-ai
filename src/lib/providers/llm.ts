/**
 * LLM provider — adapter for scoring and generation.
 * Returns internal types only, never raw API responses.
 * Supports OpenAI and Anthropic via LLM_PROVIDER env var.
 */

import type { Account, OutreachPack, AccountOpportunityBrief } from "@/types";

export interface LlmProvider {
  scoreAccounts(accounts: Account[], icpDescription: string, apiKey: string, provider: string): Promise<Account[]>;
  generateOutreach(account: Account, apiKey: string, provider: string): Promise<OutreachPack>;
  generateBrief(account: Account, apiKey: string, provider: string): Promise<AccountOpportunityBrief>;
}

export function createLlmProvider(): LlmProvider {
  return {
    async scoreAccounts(
      accounts: Account[],
      icpDescription: string,
      apiKey: string,
      provider: string
    ): Promise<Account[]> {
      // LLM scoring proposes sub-scores but final calculation uses predefined weights
      // Implementation will call OpenAI/Anthropic API and parse structured response
      // For now, throw to trigger rule-based fallback
      throw new Error("LLM scoring not yet implemented — using rule-based fallback");
    },

    async generateOutreach(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<OutreachPack> {
      // LLM-based outreach generation
      // Implementation will call API with evidence context and return structured pack
      throw new Error("LLM outreach not yet implemented — using template fallback");
    },

    async generateBrief(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<AccountOpportunityBrief> {
      // LLM-based brief generation
      throw new Error("LLM brief not yet implemented — using template fallback");
    },
  };
}
