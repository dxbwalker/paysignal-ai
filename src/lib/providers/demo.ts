/**
 * Demo provider — returns seed data for discovery, enrichment, scoring, and outreach.
 * Used when live APIs are unavailable or when Demo_Mode is active.
 */

import type {
  Account,
  SearchPlan,
  EvidenceCard,
  OutreachPack,
  AccountOpportunityBrief,
} from "@/types";

// Demo provider will use seed data from demo-data.ts (Task 3)
// For now, export the interface that all providers must implement

export interface DemoProvider {
  discover(searchPlan: SearchPlan): Promise<Account[]>;
  enrich(accounts: Account[]): Promise<Account[]>;
  generateOutreach(account: Account): Promise<OutreachPack>;
  generateBrief(account: Account): Promise<AccountOpportunityBrief>;
}

export function createDemoProvider(): DemoProvider {
  return {
    async discover(_searchPlan: SearchPlan): Promise<Account[]> {
      // Will be populated with seed data in Task 3
      const { getDemoAccounts } = await import("@/lib/demo-data");
      return getDemoAccounts();
    },

    async enrich(accounts: Account[]): Promise<Account[]> {
      // Demo enrichment returns accounts with preloaded evidence
      const { getDemoEnrichment } = await import("@/lib/demo-data");
      return getDemoEnrichment(accounts);
    },

    async generateOutreach(account: Account): Promise<OutreachPack> {
      const { getDemoOutreachPack } = await import("@/lib/demo-data");
      return getDemoOutreachPack(account);
    },

    async generateBrief(account: Account): Promise<AccountOpportunityBrief> {
      const { getDemoBrief } = await import("@/lib/demo-data");
      return getDemoBrief(account);
    },
  };
}
