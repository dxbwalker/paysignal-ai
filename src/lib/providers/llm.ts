/**
 * LLM provider — adapter for scoring and generation.
 * Returns internal types only, never raw API responses.
 * Supports OpenAI and Anthropic via LLM_PROVIDER env var.
 *
 * Features:
 * - Scoring: LLM proposes sub-scores, final calculation uses predefined weights (Requirement 5.8, 5.11)
 * - Generation: Outreach packs and opportunity briefs (Requirements 7.1-7.10, 8.1-8.9)
 * - 30s timeout on all API calls
 * - Graceful error propagation for fallback handling (Requirement 12.2)
 */

import type {
  Account,
  OutreachPack,
  AccountOpportunityBrief,
  DimensionScore,
  BriefEvidence,
} from "@/types";

const TIMEOUT_MS = 30_000;

export interface LlmResult<T> {
  data?: T;
  error?: string;
}

export interface LlmProvider {
  scoreAccounts(
    accounts: Account[],
    icpDescription: string,
    apiKey: string,
    provider: string
  ): Promise<Account[]>;
  generateOutreach(
    account: Account,
    apiKey: string,
    provider: string
  ): Promise<OutreachPack>;
  generateBrief(
    account: Account,
    apiKey: string,
    provider: string
  ): Promise<AccountOpportunityBrief>;
  /** Score with detailed error info for fallback logging. */
  scoreAccountsWithStatus(
    accounts: Account[],
    icpDescription: string,
    apiKey: string,
    provider: string
  ): Promise<LlmResult<Account[]>>;
  /** Generate outreach with detailed error info for fallback logging. */
  generateOutreachWithStatus(
    account: Account,
    apiKey: string,
    provider: string
  ): Promise<LlmResult<OutreachPack>>;
  /** Generate brief with detailed error info for fallback logging. */
  generateBriefWithStatus(
    account: Account,
    apiKey: string,
    provider: string
  ): Promise<LlmResult<AccountOpportunityBrief>>;
}

export function createLlmProvider(): LlmProvider {
  return {
    async scoreAccounts(
      accounts: Account[],
      icpDescription: string,
      apiKey: string,
      provider: string
    ): Promise<Account[]> {
      const result = await this.scoreAccountsWithStatus(accounts, icpDescription, apiKey, provider);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },

    async scoreAccountsWithStatus(
      accounts: Account[],
      icpDescription: string,
      apiKey: string,
      provider: string
    ): Promise<LlmResult<Account[]>> {
      try {
        // LLM scoring: proposes sub-scores but final calculation uses predefined weights
        const scored = await Promise.all(
          accounts.map(async (account) => {
            try {
              const dimensions = await llmProposeSubScores(
                account,
                icpDescription,
                apiKey,
                provider
              );
              const total = Math.round(
                dimensions.reduce((sum, d) => sum + d.subScore * d.weight, 0)
              );

              const topFactors = dimensions
                .filter((d) => d.subScore >= 60)
                .sort((a, b) => b.subScore * b.weight - a.subScore * a.weight)
                .slice(0, 3)
                .map((d) => d.name);

              const missingFactors = dimensions
                .filter((d) => d.subScore < 30)
                .slice(0, 3)
                .map((d) => d.name);

              const recommendedAction =
                total >= 60
                  ? ("generate_outreach" as const)
                  : total >= 40
                    ? ("research_further" as const)
                    : ("deprioritize" as const);

              return {
                ...account,
                opportunityScore: {
                  total,
                  dimensions,
                  topFactors,
                  missingFactors,
                  recommendedAction,
                  deprioritizeReason:
                    total < 40
                      ? `Low overall score (${total}/100). Key gaps: ${missingFactors.join(", ")}`
                      : undefined,
                },
                status: "scored" as const,
              };
            } catch {
              // If LLM fails for individual account, return unscored
              return account;
            }
          })
        );
        return { data: scored };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown LLM error";
        return { error: `LLM scoring failed: ${message}` };
      }
    },

    async generateOutreach(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<OutreachPack> {
      const result = await this.generateOutreachWithStatus(account, apiKey, provider);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },

    async generateOutreachWithStatus(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<LlmResult<OutreachPack>> {
      try {
        const prompt = buildOutreachPrompt(account);
        const response = await callLlmApi(prompt, apiKey, provider);
        return { data: parseOutreachResponse(response, account) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown LLM error";
        return { error: `LLM outreach generation failed: ${message}` };
      }
    },

    async generateBrief(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<AccountOpportunityBrief> {
      const result = await this.generateBriefWithStatus(account, apiKey, provider);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },

    async generateBriefWithStatus(
      account: Account,
      apiKey: string,
      provider: string
    ): Promise<LlmResult<AccountOpportunityBrief>> {
      try {
        const prompt = buildBriefPrompt(account);
        const response = await callLlmApi(prompt, apiKey, provider);
        return { data: parseBriefResponse(response, account) };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown LLM error";
        return { error: `LLM brief generation failed: ${message}` };
      }
    },
  };
}

// --- LLM Scoring (Requirement 5.8, 5.11) ---

async function llmProposeSubScores(
  account: Account,
  icpDescription: string,
  apiKey: string,
  provider: string
): Promise<DimensionScore[]> {
  const evidenceSummary = account.evidenceCards
    .map(
      (e) =>
        `[${e.signalType}] ${e.rawEvidence.slice(0, 100)} (${e.evidenceType}, ${e.confidenceLevel})`
    )
    .join("\n");

  const prompt = `You are scoring a company for payment automation opportunity.

ICP: ${icpDescription}

Company: ${account.name}
Business Model: ${account.businessModel}
Industry: ${account.industry || "unknown"}
Location: ${account.location}

Evidence:
${evidenceSummary || "No evidence collected yet."}

Score this company on 5 dimensions (0-100 each):
1. payment_complexity (weight: 0.30) - multi-country, multi-currency, marketplace, payouts, reconciliation
2. operational_urgency (weight: 0.20) - hiring payment ops, recent funding, expansion
3. automation_fit (weight: 0.20) - manual reconciliation signs, legacy tools, finance ops growth
4. buyer_accessibility (weight: 0.15) - identifiable decision-makers with relevant titles
5. confidence (weight: 0.15) - strength and directness of evidence

Respond ONLY with JSON in this exact format:
{"scores": [{"name": "payment_complexity", "score": 75}, {"name": "operational_urgency", "score": 60}, {"name": "automation_fit", "score": 55}, {"name": "buyer_accessibility", "score": 40}, {"name": "confidence", "score": 50}]}`;

  const response = await callLlmApi(prompt, apiKey, provider);

  try {
    const parsed = JSON.parse(extractJson(response));
    const weights: Record<string, number> = {
      payment_complexity: 0.3,
      operational_urgency: 0.2,
      automation_fit: 0.2,
      buyer_accessibility: 0.15,
      confidence: 0.15,
    };

    return parsed.scores.map(
      (s: { name: string; score: number }): DimensionScore => ({
        name: s.name as DimensionScore["name"],
        weight: weights[s.name] || 0.15,
        subScore: Math.max(0, Math.min(100, s.score)),
        contributingSignals: account.evidenceCards
          .filter((e) => e.dimension === s.name)
          .map((e) => e.id),
      })
    );
  } catch {
    throw new Error("Failed to parse LLM scoring response");
  }
}

// --- Outreach Generation (Requirements 7.1-7.10) ---

function buildOutreachPrompt(account: Account): string {
  const evidenceList = account.evidenceCards
    .slice(0, 5)
    .map((e) => `- [${e.signalType}] ${e.rawEvidence.slice(0, 200)}`)
    .join("\n");

  const personaList = account.personas
    .slice(0, 3)
    .map((p) => `- ${p.name} (${p.title})`)
    .join("\n");

  return `Generate a complete outreach pack for this company. Reference ONLY the evidence provided — do NOT invent facts.

Company: ${account.name}
Business Model: ${account.businessModel}
Industry: ${account.industry || "unknown"}
Location: ${account.location}

Evidence:
${evidenceList || "Limited evidence available."}

Key Personas:
${personaList || "No specific personas identified."}

Generate JSON with this exact structure:
{
  "whyThisAccountWhyNow": "max 100 words explaining why this account, why now",
  "email": {
    "subject": "max 60 chars subject line",
    "body": "max 150 words personalized email body"
  },
  "linkedinMessage": "max 50 words LinkedIn connection message",
  "callOpener": {
    "talkingPoints": ["point 1", "point 2", "point 3"]
  },
  "followUp": "max 100 words follow-up message",
  "discoveryQuestions": ["question 1", "question 2", "question 3"]
}

Rules:
- Each message must reference at least one evidence-backed signal
- Use plain language, no jargon
- Do not invent facts, metrics, or customer names
- Keep within word limits`;
}

function parseOutreachResponse(
  response: string,
  account: Account
): OutreachPack {
  try {
    const parsed = JSON.parse(extractJson(response));

    // Map evidence card IDs referenced in the outreach
    const claimEvidenceIds = account.evidenceCards.slice(0, 5).map((e) => e.id);

    return {
      accountId: account.id,
      whyThisAccountWhyNow: truncateWords(
        parsed.whyThisAccountWhyNow || "",
        100
      ),
      email: {
        subject: (parsed.email?.subject || "").slice(0, 60),
        body: truncateWords(parsed.email?.body || "", 150),
      },
      linkedinMessage: truncateWords(parsed.linkedinMessage || "", 50),
      callOpener: {
        talkingPoints: (parsed.callOpener?.talkingPoints || []).slice(0, 3),
      },
      followUp: truncateWords(parsed.followUp || "", 100),
      discoveryQuestions: (parsed.discoveryQuestions || []).slice(0, 3),
      generatedAt: new Date().toISOString(),
      generationMethod: "llm",
      claimEvidenceIds,
    };
  } catch {
    throw new Error("Failed to parse LLM outreach response");
  }
}

// --- Brief Generation (Requirements 8.1-8.9) ---

function buildBriefPrompt(account: Account): string {
  const evidenceList = account.evidenceCards
    .map(
      (e) =>
        `- [${e.signalType}] (${e.evidenceType}, ${e.confidenceLevel}) ${e.rawEvidence.slice(0, 200)} | Source: ${e.sourceLabel}`
    )
    .join("\n");

  return `Generate an Account Opportunity Brief for this company. Label each claim as observed, inferred, or hypothesis.

Company: ${account.name}
Business Model: ${account.businessModel}
Industry: ${account.industry || "unknown"}
Location: ${account.location}
Score: ${account.opportunityScore?.total || "unscored"}

Evidence:
${evidenceList || "Limited evidence available."}

Generate JSON with this exact structure:
{
  "companySummary": "max 150 words company summary",
  "paymentComplexityHypothesis": "hypothesis about their payment complexity",
  "supportingEvidence": [
    {"claim": "specific claim", "evidenceType": "observed|inferred|hypothesis", "source": "source name", "confidenceLevel": "high|medium|low"}
  ],
  "likelyPainPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "suggestedOutreachAngle": "recommended approach angle",
  "discoveryQuestions": ["question 1", "question 2", "question 3"]
}

Rules:
- Only reference evidence from the provided list
- Label each claim with its evidence type
- Include 2-5 pain points
- Keep company summary under 150 words`;
}

function parseBriefResponse(
  response: string,
  account: Account
): AccountOpportunityBrief {
  try {
    const parsed = JSON.parse(extractJson(response));

    const supportingEvidence: BriefEvidence[] = (
      parsed.supportingEvidence || []
    ).map((e: { claim: string; evidenceType: string; source: string; confidenceLevel: string }) => ({
      claim: e.claim || "",
      evidenceType: e.evidenceType || "hypothesis",
      source: e.source || "unknown",
      confidenceLevel: e.confidenceLevel || "low",
    }));

    // Check for low-evidence warning
    const highMediumCards = account.evidenceCards.filter(
      (e) => e.confidenceLevel === "high" || e.confidenceLevel === "medium"
    );
    const lowEvidenceWarning =
      highMediumCards.length < 2
        ? "This brief relies on limited high-confidence evidence. Some sections may be based on inferred or low-confidence data."
        : undefined;

    return {
      accountId: account.id,
      companySummary: truncateWords(parsed.companySummary || "", 150),
      paymentComplexityHypothesis:
        parsed.paymentComplexityHypothesis || "",
      supportingEvidence,
      likelyPainPoints: (parsed.likelyPainPoints || []).slice(0, 5),
      recommendedPersonas: account.personas.slice(0, 3).map((p) => p.id),
      suggestedOutreachAngle: parsed.suggestedOutreachAngle || "",
      discoveryQuestions: (parsed.discoveryQuestions || []).slice(0, 3),
      lowEvidenceWarning,
    };
  } catch {
    throw new Error("Failed to parse LLM brief response");
  }
}

// --- LLM API Call (supports OpenAI and Anthropic) ---

async function callLlmApi(
  prompt: string,
  apiKey: string,
  provider: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (provider === "anthropic") {
      return await callAnthropic(prompt, apiKey, controller.signal);
    }
    // Default to OpenAI
    return await callOpenAI(prompt, apiKey, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a B2B sales intelligence assistant. Respond only with the requested JSON format.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system:
        "You are a B2B sales intelligence assistant. Respond only with the requested JSON format.",
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// --- Utility Functions ---

/**
 * Extract JSON from LLM response that may contain markdown code blocks or extra text.
 */
function extractJson(text: string): string {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
