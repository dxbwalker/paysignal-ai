/**
 * MongoDB provider adapter — persists campaigns, accounts, strategies, outcomes.
 * All operations are non-blocking from the UI perspective.
 * Returns safe error messages on failure, never raw driver errors.
 */

import type { Account, CampaignOutcome, SearchPlan } from "@/types";
import {
  getCampaignsCollection,
  getAccountsCollection,
  getCampaignOutcomesCollection,
  ensureIndexes,
  safeWrite,
  isMongoEnabled,
  type Campaign,
} from "@/lib/mongodb";

export interface MongoDBProvider {
  isEnabled(): boolean;
  saveCampaign(campaign: Campaign): Promise<{ success: boolean; error?: string }>;
  saveAccounts(campaignId: string, accounts: Account[]): Promise<{ success: boolean; error?: string }>;
  saveCampaignOutcome(campaignId: string, outcome: CampaignOutcome): Promise<{ success: boolean; error?: string }>;
  loadCampaign(campaignId: string): Promise<{ success: boolean; data?: { campaign: Campaign; accounts: Account[] }; error?: string }>;
  deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }>;
}

export function createMongoDBProvider(): MongoDBProvider {
  return {
    isEnabled(): boolean {
      return isMongoEnabled();
    },

    async saveCampaign(campaign: Campaign) {
      return safeWrite(async () => {
        await ensureIndexes();
        const col = await getCampaignsCollection();
        await col.updateOne(
          { campaignId: campaign.campaignId },
          { $set: { ...campaign, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      });
    },

    async saveAccounts(campaignId: string, accounts: Account[]) {
      return safeWrite(async () => {
        await ensureIndexes();
        const col = await getAccountsCollection();

        const ops = accounts.map((account) => ({
          updateOne: {
            filter: { campaignId, id: account.id },
            update: { $set: { ...account, campaignId } },
            upsert: true,
          },
        }));

        if (ops.length > 0) {
          await col.bulkWrite(ops);
        }
      });
    },

    async saveCampaignOutcome(campaignId: string, outcome: CampaignOutcome) {
      return safeWrite(async () => {
        await ensureIndexes();
        const col = await getCampaignOutcomesCollection();
        await col.updateOne(
          { campaignId, accountId: outcome.accountId },
          { $set: { ...outcome, campaignId, createdAt: new Date().toISOString() } },
          { upsert: true }
        );
      });
    },

    async loadCampaign(campaignId: string) {
      return safeWrite(async () => {
        const campaignsCol = await getCampaignsCollection();
        const accountsCol = await getAccountsCollection();

        const campaign = await campaignsCol.findOne({ campaignId });
        if (!campaign) throw new Error("Campaign not found");

        const accounts = await accountsCol
          .find({ campaignId })
          .toArray() as unknown as Account[];

        return { campaign: campaign as Campaign, accounts };
      });
    },

    async deleteCampaign(campaignId: string) {
      return safeWrite(async () => {
        const campaignsCol = await getCampaignsCollection();
        const accountsCol = await getAccountsCollection();
        const outcomesCol = await getCampaignOutcomesCollection();

        await Promise.all([
          campaignsCol.deleteOne({ campaignId }),
          accountsCol.deleteMany({ campaignId }),
          outcomesCol.deleteMany({ campaignId }),
        ]);
      });
    },
  };
}
