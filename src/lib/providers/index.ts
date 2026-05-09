/**
 * Provider factory — selects demo/live provider based on env config and mode.
 * Returns a capability matrix indicating which capabilities are live, demo, cached, or unavailable.
 */

import type { Mode, ProviderCapability, Account, SearchPlan, OutreachPack, AccountOpportunityBrief, EvidenceCard } from "@/types";
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
        // Fallback to demo on failure
        return demo.discover(searchPlan);
      }
    },

    async enrich(accounts: Account[], mode: Mode): Promise<Account[]> {
      if (mode === "demo" || env.capabilities.enrichment === "demo") {
        return demo.enrich(accounts);
      }

      // Live mode: enrich top 5 accounts in parallel
      const top5 = accounts
        .sort((a, b) => b.evidenceCards.length - a.evidenceCards.length)
        .slice(0, 5);

      const enriched = await Promise.allSettled(
        top5.map(async (account) => {
          try {
            const newCards = await webSearch.enrichAccount(account, env.webSearchApiKey!);
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

    async generateOutreach(account: Account, mode: Mode): Promise<OutreachPack> {
      if (mode === "demo") {
        return demo.generateOutreach(account);
      }

      if (env.capabilities.generation === "llm" && env.llmApiKey && env.llmProvider) {
        try {
          return await llm.generateOutreach(account, env.llmApiKey, env.llmProvider);
        } catch {
          // Fallback to demo/template
        }
      }

      return demo.generateOutreach(account);
    },

    async generateBrief(account: Account, mode: Mode): Promise<AccountOpportunityBrief> {
      if (mode === "demo") {
        return demo.generateBrief(account);
      }

      if (env.capabilities.generation === "llm" && env.llmApiKey && env.llmProvider) {
        try {
          return await llm.generateBrief(account, env.llmApiKey, env.llmProvider);
        } catch {
          // Fallback to demo/template
        }
      }

      return demo.generateBrief(account);
    },
  };
}
