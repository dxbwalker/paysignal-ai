/**
 * MongoDB Atlas connection singleton — server-side only.
 * Reuses connection across serverless invocations.
 * Never imported by client-side React components.
 */

import { MongoClient, Db, Collection } from "mongodb";
import type { Account, CampaignOutcome, SearchPlan } from "@/types";

// --- Types ---

export interface Campaign {
  campaignId: string;
  icpText: string;
  searchPlan: SearchPlan;
  mode: "demo" | "live";
  createdAt: string;
  updatedAt: string;
  status: "draft" | "completed" | "failed";
  accountCount: number;
  outreachReadyCount: number;
  persistenceSource: "mongodb" | "local";
}

// --- Server-side guard ---

if (typeof window !== "undefined") {
  throw new Error(
    "mongodb.ts must only be used in server-side code (API routes). " +
      "Do not import this in client components."
  );
}

// --- Connection singleton ---

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "paysignal";
const MONGODB_ENABLED = process.env.MONGODB_ENABLE_PERSISTENCE === "true";

export function isMongoEnabled(): boolean {
  return MONGODB_ENABLED && !!MONGODB_URI;
}

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not configured");
  }

  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 3000,
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 3000,
  });

  cachedClient = await client.connect();
  return cachedClient;
}

async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  const client = await getClient();
  cachedDb = client.db(MONGODB_DB_NAME);
  return cachedDb;
}

// --- Collection accessors ---

export async function getCampaignsCollection(): Promise<Collection<Campaign>> {
  const db = await getDb();
  return db.collection<Campaign>("campaigns");
}

export async function getAccountsCollection(): Promise<Collection<Account & { campaignId: string }>> {
  const db = await getDb();
  return db.collection("accounts");
}

export async function getCampaignOutcomesCollection(): Promise<Collection<CampaignOutcome & { campaignId: string }>> {
  const db = await getDb();
  return db.collection("campaign_outcomes");
}

// --- Index creation (called once on first use) ---

let indexesCreated = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;

  try {
    const db = await getDb();

    await db.collection("campaigns").createIndex({ campaignId: 1 }, { unique: true });
    await db.collection("campaigns").createIndex({ createdAt: -1 });
    await db.collection("accounts").createIndex({ campaignId: 1, id: 1 });
    await db.collection("campaign_outcomes").createIndex({ campaignId: 1, accountId: 1, createdAt: -1 });

    indexesCreated = true;
  } catch {
    // Non-fatal — indexes may already exist
  }
}

// --- Safe write wrapper (3s timeout, never throws to caller) ---

export async function safeWrite<T>(
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!isMongoEnabled()) {
    return { success: false, error: "MongoDB persistence disabled" };
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB write timeout (3s)")), 3000)
    );

    const data = await Promise.race([operation(), timeoutPromise]);
    return { success: true, data };
  } catch (err: any) {
    // Redact connection details from error
    const safeError = (err.message || "Unknown error")
      .replace(/mongodb(\+srv)?:\/\/[^\s]+/g, "[REDACTED_URI]")
      .replace(/password[=:][^\s&]+/g, "password=[REDACTED]");

    return { success: false, error: safeError };
  }
}
