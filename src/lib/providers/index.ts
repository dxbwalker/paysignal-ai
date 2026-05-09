/**
 * Provider factory — selects demo/live provider based on env config and mode.
 * Returns a capability matrix indicating which capabilities are live, demo, cached, or unavailable.
 *
 * Fallback behavior (Requirements 2.9, 4.8, 5.9, 7.9):
 * - Each provider gracefully falls back to demo/template on failure
 * - Errors are caught and logged, never interrupt the workflow
 */

import type {
  Mode,
  ProviderCapability,
  Account,
  SearchPlan,
  OutreachPack,
  AccountOpportunityBrief,
  EvidenceCard,
} from "@/types";
import { getEnvConfig } from "@/lib/env";
import { createDemoProvider } from "./demo";
import { createApifyProvider } from "./apify";
import { createWebSearchProvider } from "./web-search";
import { createLlmProvider } from "./llm";

export interface ProviderSet {
  capabilities: ProviderCapability;
  discover(searchPlan: SearchPlan, mode: Mode): Promise<Account[]>;
  enrich(accounts: Account[], mode: Mode): Promise<Account[]>;
  enrichSingle(account: Account, mode: Mode): Promise<EvidenceCard[]>;
  scoreWithLlm(
    accounts: Account[],
    icpDescription: string,
    mode: Mode
  ): Promise<Account[]>;
  generateOutreach(account: Account, mode: Mode): Promise<OutreachPack>;
  generateBrief(account: Account, mode: Mode): Promise<AccountOpportunityBrief>;
}

export function createProviders(): ProviderSet {
  const env = getEnvConfig();
  const demo = createDemoProvider();
  const apify = createApifyProvider();
  const webSearch = createWebSearchProvider();
  const llm = createLlmProvider();

  return {
    capabilities: env.capabilities,

    async discover(searchPlan: SearchPlan, mode: Mode): Promise<Account[]> {
      if (mode === "demo" || env.capabilities.discovery === "demo") {
        return demo.discover(searchPlan);
      }

      try {
        return await apify.discover(searchPlan, env.apifyApiKey!);
      } catch {
        // Fallback to demo on failure (Requirement 2.9)
        return demo.discover(searchPlan);
      }
    },

    async enrich(accounts: Account[], mode: Mode): Promise<Account[]> {
      if (mode === "demo" || env.capabilities.enrichment === "demo") {
        return demo.enrich(accounts);
      }

      // Live mode: enrich top 5 accounts in parallel (Requirement 4.11)
      const top5 = [...accounts]
        .sort((a, b) => b.evidenceCards.length - a.evidenceCards.length)
        .slice(0, 5);

      const enriched = await Promise.allSettled(
        top5.map(async (account) => {
          try {
            const newCards = await webSearch.enrichAccount(
              account,
              env.webSearchApiKey!
            );
            return {
              ...account,
              evidenceCards: [...account.evidenceCards, ...newCards],
              status: "enriched" as const,
            };
          } catch {
            return account; // Keep original on failure
          }
        })
      );

      const enrichedById = new Map<string, Account>();
      for (const result of enriched) {
        if (result.status === "fulfilled") {
          enrichedById.set(result.value.id, result.value);
        }
      }

      return accounts.map((a) => enrichedById.get(a.id) ?? a);
    },

    async enrichSingle(account: Account, mode: Mode): Promise<EvidenceCard[]> {
      if (mode === "demo" || env.capabilities.enrichment === "demo") {
        return []; // Demo enrichment handled at account level
      }

      try {
        return await webSearch.enrichAccount(account, env.webSearchApiKey!);
      } catch {
        return [];
      }
    },

    async scoreWithLlm(
      accounts: Account[],
      icpDescription: string,
      mode: Mode
    ): Promise<Account[]> {
      // Only use LLM scoring in live mode with configured API key (Requirement 5.8)
      if (
        mode === "demo" ||
        env.capabilities.scoring !== "live" ||
        !env.llmApiKey ||
        !env.llmProvider
      ) {
        throw new Error(
          "LLM scoring not available — use rule-based fallback"
        );
      }

      try {
        return await llm.scoreAccounts(
          accounts,
          icpDescription,
          env.llmApiKey,
          env.llmProvider
        );
      } catch {
        // Requirement 5.9: fallback to rule-based scoring
        throw new Error(
          "LLM scoring failed — use rule-based fallback"
        );
      }
    },

    async generateOutreach(
      account: Account,
      mode: Mode
    ): Promise<OutreachPack> {
      if (mode === "demo") {
        return demo.generateOutreach(account);
      }

      if (
        env.capabilities.generation === "llm" &&
        env.llmApiKey &&
        env.llmProvider
      ) {
        try {
          return await llm.generateOutreach(
            account,
            env.llmApiKey,
            env.llmProvider
          );
        } catch {
          // Fallback to demo/template (Requirement 7.9)
        }
      }

      return demo.generateOutreach(account);
    },

    async generateBrief(
      account: Account,
      mode: Mode
    ): Promise<AccountOpportunityBrief> {
      if (mode === "demo") {
        return demo.generateBrief(account);
      }

      if (
        env.capabilities.generation === "llm" &&
        env.llmApiKey &&
        env.llmProvider
      ) {
        try {
          return await llm.generateBrief(
            account,
            env.llmApiKey,
            env.llmProvider
          );
        } catch {
          // Fallback to demo/template
        }
      }

      return demo.generateBrief(account);
    },
  };
}
