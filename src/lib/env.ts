/**
 * Safe server-side environment loader.
 * Returns configuration with Demo_Mode defaults when keys are missing.
 * Must only be imported in server-side code (API routes).
 */

import type { Mode, ProviderCapability } from "@/types";

export interface EnvConfig {
  apifyApiKey: string | null;
  llmApiKey: string | null;
  llmProvider: "openai" | "anthropic" | null;
  webSearchApiKey: string | null;
  mongodbUri: string | null;
  mongodbDbName: string;
  mongodbEnabled: boolean;
  mongodbModelApiKey: string | null;
  defaultMode: Mode;
  capabilities: ProviderCapability;
}

export function getEnvConfig(): EnvConfig {
  assertServerSide();

  const apifyApiKey = process.env.APIFY_API_KEY || null;
  const llmApiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || null;
  const llmProvider = (process.env.LLM_PROVIDER as "openai" | "anthropic") || (process.env.OPENAI_API_KEY ? "openai" : null);
  const webSearchApiKey = process.env.WEB_SEARCH_API_KEY || null;
  const mongodbUri = process.env.MONGODB_URI || null;
  const mongodbDbName = process.env.MONGODB_DB_NAME || "paysignal";
  const mongodbEnabled = process.env.MONGODB_ENABLE_PERSISTENCE === "true" && !!mongodbUri;
  const mongodbModelApiKey = process.env.MONGODB_MODEL_API_KEY || null;

  // Determine default mode based on available keys
  const hasAnyLiveKey = !!(apifyApiKey || webSearchApiKey);
  const defaultMode: Mode = hasAnyLiveKey ? "live" : "demo";

  // Build capability matrix
  const capabilities: ProviderCapability = {
    discovery: apifyApiKey ? "live" : "demo",
    enrichment: webSearchApiKey ? "live" : "demo",
    scoring: llmApiKey ? "live" : "rule_based",
    generation: llmApiKey ? "llm" : "template",
  };

  return {
    apifyApiKey,
    llmApiKey,
    llmProvider,
    webSearchApiKey,
    mongodbUri,
    mongodbDbName,
    mongodbEnabled,
    mongodbModelApiKey,
    defaultMode,
    capabilities,
  };
}

/**
 * Guard: verify this is running server-side.
 * Throws if accidentally imported in client code.
 */
export function assertServerSide(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "env.ts must only be used in server-side code (API routes). " +
        "Do not import this in client components."
    );
  }
}
