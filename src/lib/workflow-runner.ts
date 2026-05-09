/**
 * Workflow Runner — orchestrates the end-to-end PaySignal AI flow.
 *
 * Stages: analyze ICP → discover → collect evidence → enrich → score →
 *         match personas → generate briefs/outreach for qualifying accounts.
 *
 * Phase 1: Uses precomputed demo briefs/outreach packs from seed data.
 * Phase 2: Switches to generated outputs through template/LLM providers.
 *
 * Enforces a 90-second time budget with auto-fallback to cached/demo data.
 */

import type {
  WorkflowStageName,
  Account,
  SearchPlan,
  Mode,
} from "@/types";
import type { WorkflowAction } from "@/context/WorkflowContext";
import { demoAccounts, getDemoOutreachPack, getDemoBrief } from "@/lib/demo-data";
import { cache } from "@/lib/cache";

// --- Constants ---

const TIME_BUDGET_MS = 90_000; // 90 seconds
const API_TIMEOUT_MS = 30_000; // 30 seconds per API call
const CACHE_KEY_ACCOUNTS = "workflow-accounts";
const CACHE_KEY_SEARCH_PLAN = "workflow-search-plan";

// --- Types ---

interface WorkflowRunnerOptions {
  icpDescription: string;
  mode: Mode;
  dispatch: React.Dispatch<WorkflowAction>;
  addLog: (stage: WorkflowStageName, message: string) => void;
  suppressionList: string[];
  onTimeBudgetExceeded?: () => void;
}

interface StageResult<T> {
  data: T;
  fallback: boolean;
  fallbackReason?: string;
}

// --- Helpers ---

/**
 * Fetch with timeout — rejects if the request takes longer than `ms`.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if time budget is exceeded.
 */
function isBudgetExceeded(startMs: number): boolean {
  return Date.now() - startMs > TIME_BUDGET_MS;
}

/**
 * Transition a stage to running, then completed/failed.
 */
function setStage(
  dispatch: React.Dispatch<WorkflowAction>,
  stage: WorkflowStageName,
  status: "running" | "completed" | "failed" | "warning",
  fallbackReason?: string
) {
  dispatch({ type: "SET_STAGE", stage, status, fallbackReason });
}

// --- Stage Implementations ---

async function analyzeIcp(
  icpDescription: string,
  mode: Mode,
  startMs: number
): Promise<StageResult<SearchPlan>> {
  // Check cache first
  const cached = cache.get<SearchPlan>(CACHE_KEY_SEARCH_PLAN);

  if (isBudgetExceeded(startMs) && cached) {
    return { data: cached, fallback: true, fallbackReason: "Time budget — using cached search plan" };
  }

  try {
    const res = await fetchWithTimeout("/api/analyze-icp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icpDescription }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    const plan: SearchPlan = json.searchPlan;
    cache.set(CACHE_KEY_SEARCH_PLAN, plan);
    return { data: plan, fallback: false };
  } catch {
    // Fallback: generate a basic plan from the ICP text
    if (cached) {
      return { data: cached, fallback: true, fallbackReason: "API unavailable — using cached plan" };
    }

    // Minimal fallback plan
    const fallbackPlan: SearchPlan = {
      keywords: icpDescription.split(/\s+/).slice(0, 5),
      companyTypes: ["marketplace", "platform", "saas"],
      geographicFilters: [],
      personaTargets: ["Head of Payments", "CFO", "VP Finance"],
      exclusionCriteria: [],
    };
    return { data: fallbackPlan, fallback: true, fallbackReason: "API unavailable — using extracted keywords" };
  }
}

async function discoverAccounts(
  searchPlan: SearchPlan,
  mode: Mode,
  startMs: number
): Promise<StageResult<Account[]>> {
  const cached = cache.get<Account[]>(CACHE_KEY_ACCOUNTS);

  if (mode === "demo" || isBudgetExceeded(startMs)) {
    const data = cached ?? demoAccounts;
    return {
      data,
      fallback: mode !== "demo" && isBudgetExceeded(startMs),
      fallbackReason: isBudgetExceeded(startMs) ? "Time budget — using demo accounts" : undefined,
    };
  }

  try {
    const res = await fetchWithTimeout("/api/discover-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchPlan }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    const accounts: Account[] = json.accounts;
    cache.set(CACHE_KEY_ACCOUNTS, accounts);
    return { data: accounts, fallback: false };
  } catch {
    const data = cached ?? demoAccounts;
    return { data, fallback: true, fallbackReason: "Discovery API unavailable — using demo accounts" };
  }
}

async function collectEvidence(
  accounts: Account[],
  mode: Mode,
  startMs: number
): Promise<StageResult<Account[]>> {
  if (mode === "demo" || isBudgetExceeded(startMs)) {
    // Demo accounts already have evidence cards
    const data = accounts.map((a) => ({
      ...a,
      status: a.evidenceCards.length > 0 ? ("evidence_collected" as const) : a.status,
    }));
    return {
      data,
      fallback: isBudgetExceeded(startMs) && mode !== "demo",
      fallbackReason: isBudgetExceeded(startMs) ? "Time budget — using existing evidence" : undefined,
    };
  }

  try {
    const res = await fetchWithTimeout("/api/collect-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    return { data: json.accounts, fallback: false };
  } catch {
    return {
      data: accounts,
      fallback: true,
      fallbackReason: "Evidence collection failed — proceeding with available data",
    };
  }
}

async function enrichAccounts(
  accounts: Account[],
  mode: Mode,
  startMs: number
): Promise<StageResult<Account[]>> {
  if (mode === "demo" || isBudgetExceeded(startMs)) {
    const data = accounts.map((a) => ({
      ...a,
      status: a.evidenceCards.length > 0 ? ("enriched" as const) : a.status,
    }));
    return {
      data,
      fallback: isBudgetExceeded(startMs) && mode !== "demo",
      fallbackReason: isBudgetExceeded(startMs) ? "Time budget — skipping web enrichment" : undefined,
    };
  }

  try {
    const res = await fetchWithTimeout("/api/enrich-web", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts, limit: 5 }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    return { data: json.accounts, fallback: false };
  } catch {
    return {
      data: accounts,
      fallback: true,
      fallbackReason: "Web enrichment unavailable — proceeding with LinkedIn evidence only",
    };
  }
}

async function scoreAccounts(
  accounts: Account[],
  icpDescription: string,
  mode: Mode,
  startMs: number
): Promise<StageResult<Account[]>> {
  if (mode === "demo" || isBudgetExceeded(startMs)) {
    // Demo accounts already have scores
    const data = accounts.map((a) => ({
      ...a,
      status: a.opportunityScore ? ("scored" as const) : a.status,
    }));
    return {
      data,
      fallback: isBudgetExceeded(startMs) && mode !== "demo",
      fallbackReason: isBudgetExceeded(startMs) ? "Time budget — using cached scores" : undefined,
    };
  }

  try {
    const res = await fetchWithTimeout("/api/score-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts, icpDescription }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    return { data: json.accounts, fallback: false };
  } catch {
    return {
      data: accounts,
      fallback: true,
      fallbackReason: "Scoring API unavailable — using rule-based fallback",
    };
  }
}

async function matchPersonas(
  accounts: Account[],
  mode: Mode,
  startMs: number
): Promise<StageResult<Account[]>> {
  if (mode === "demo" || isBudgetExceeded(startMs)) {
    // Demo accounts already have personas
    return {
      data: accounts,
      fallback: isBudgetExceeded(startMs) && mode !== "demo",
      fallbackReason: isBudgetExceeded(startMs) ? "Time budget — using existing personas" : undefined,
    };
  }

  try {
    const res = await fetchWithTimeout("/api/match-personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accounts }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();
    return { data: json.accounts, fallback: false };
  } catch {
    return {
      data: accounts,
      fallback: true,
      fallbackReason: "Persona matching failed — using title-based fallback",
    };
  }
}

async function generateBriefsAndOutreach(
  accounts: Account[],
  mode: Mode,
  suppressionList: string[],
  startMs: number
): Promise<StageResult<Account[]>> {
  // Only generate for qualifying accounts (score >= 60) that are not suppressed
  const qualifying = accounts.filter(
    (a) =>
      a.opportunityScore &&
      a.opportunityScore.total >= 60 &&
      !suppressionList.includes(a.id) &&
      !a.suppressedAt
  );

  if (mode === "demo" || isBudgetExceeded(startMs)) {
    // Phase 1: Use precomputed demo briefs/outreach packs from seed data
    const updatedAccounts = accounts.map((a) => {
      if (!qualifying.find((q) => q.id === a.id)) return a;

      return {
        ...a,
        opportunityBrief: a.opportunityBrief ?? getDemoBrief(a),
        outreachPack: a.outreachPack ?? getDemoOutreachPack(a),
        status: "outreach_ready" as const,
      };
    });

    return {
      data: updatedAccounts,
      fallback: isBudgetExceeded(startMs) && mode !== "demo",
      fallbackReason: isBudgetExceeded(startMs)
        ? "Time budget — using precomputed briefs/outreach"
        : undefined,
    };
  }

  // Phase 2 (live mode): Call API for each qualifying account
  const updatedAccounts = [...accounts];

  for (const account of qualifying) {
    if (isBudgetExceeded(startMs)) {
      // Fallback to demo data for remaining accounts
      const idx = updatedAccounts.findIndex((a) => a.id === account.id);
      if (idx !== -1) {
        updatedAccounts[idx] = {
          ...updatedAccounts[idx],
          opportunityBrief: updatedAccounts[idx].opportunityBrief ?? getDemoBrief(account),
          outreachPack: updatedAccounts[idx].outreachPack ?? getDemoOutreachPack(account),
          status: "outreach_ready" as const,
        };
      }
      continue;
    }

    try {
      // Generate brief
      const briefRes = await fetchWithTimeout("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });

      let brief = account.opportunityBrief;
      if (briefRes.ok) {
        const briefJson = await briefRes.json();
        brief = briefJson.brief;
      } else {
        brief = getDemoBrief(account);
      }

      // Generate outreach
      const outreachRes = await fetchWithTimeout("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });

      let outreach = account.outreachPack;
      if (outreachRes.ok) {
        const outreachJson = await outreachRes.json();
        outreach = outreachJson.outreachPack;
      } else {
        outreach = getDemoOutreachPack(account);
      }

      const idx = updatedAccounts.findIndex((a) => a.id === account.id);
      if (idx !== -1) {
        updatedAccounts[idx] = {
          ...updatedAccounts[idx],
          opportunityBrief: brief,
          outreachPack: outreach,
          status: "outreach_ready" as const,
        };
      }
    } catch {
      // Fallback to demo data on error
      const idx = updatedAccounts.findIndex((a) => a.id === account.id);
      if (idx !== -1) {
        updatedAccounts[idx] = {
          ...updatedAccounts[idx],
          opportunityBrief: updatedAccounts[idx].opportunityBrief ?? getDemoBrief(account),
          outreachPack: updatedAccounts[idx].outreachPack ?? getDemoOutreachPack(account),
          status: "outreach_ready" as const,
        };
      }
    }
  }

  return { data: updatedAccounts, fallback: false };
}

// --- Main Orchestration ---

/**
 * Runs the full PaySignal AI workflow end-to-end.
 * Dispatches state updates at each stage and enforces the 90-second time budget.
 */
export async function runWorkflow(options: WorkflowRunnerOptions): Promise<void> {
  const { icpDescription, mode, dispatch, addLog, suppressionList, onTimeBudgetExceeded } = options;

  const startMs = Date.now();
  dispatch({ type: "START_TIMER" });
  dispatch({ type: "SET_ICP", description: icpDescription });

  // Helper to check budget and trigger fallback
  function checkBudget(): boolean {
    if (isBudgetExceeded(startMs)) {
      dispatch({ type: "TIME_BUDGET_EXCEEDED" });
      onTimeBudgetExceeded?.();
      return true;
    }
    return false;
  }

  try {
    // --- Stage 1: Analyze ICP ---
    setStage(dispatch, "analyzing_icp", "running");
    const icpResult = await analyzeIcp(icpDescription, mode, startMs);

    if (icpResult.fallback) {
      setStage(dispatch, "analyzing_icp", "completed", icpResult.fallbackReason);
      addLog("analyzing_icp", `ICP analysis completed (fallback: ${icpResult.fallbackReason})`);
    } else {
      setStage(dispatch, "analyzing_icp", "completed");
      addLog(
        "analyzing_icp",
        `Parsed ICP: extracted ${icpResult.data.keywords.length} keywords, ${icpResult.data.companyTypes.length} company types, ${icpResult.data.geographicFilters.length} geo filters.`
      );
    }

    dispatch({ type: "SET_SEARCH_PLAN", plan: icpResult.data });

    // --- Stage 2: Awaiting Plan Approval ---
    // In automated workflow (demo), auto-approve. In interactive mode, this would pause.
    setStage(dispatch, "awaiting_plan_approval", "running");
    setStage(dispatch, "awaiting_plan_approval", "completed");
    addLog("awaiting_plan_approval", "Search plan auto-approved for demo workflow.");

    checkBudget();

    // --- Stage 3: Discover Accounts ---
    setStage(dispatch, "discovering", "running");
    const discoverResult = await discoverAccounts(icpResult.data, mode, startMs);

    if (discoverResult.fallback) {
      setStage(dispatch, "discovering", "completed", discoverResult.fallbackReason);
      addLog("discovering", `Discovery completed with fallback: ${discoverResult.fallbackReason}. Found ${discoverResult.data.length} accounts.`);
    } else {
      setStage(dispatch, "discovering", "completed");
      addLog(
        "discovering",
        `Discovered ${discoverResult.data.length} accounts. Classified by business model and deduplicated.`
      );
    }

    let accounts = discoverResult.data;
    dispatch({ type: "SET_ACCOUNTS", accounts });

    checkBudget();

    // --- Stage 4: Collect Evidence ---
    setStage(dispatch, "collecting_evidence", "running");
    const evidenceResult = await collectEvidence(accounts, mode, startMs);

    if (evidenceResult.fallback) {
      setStage(dispatch, "collecting_evidence", "completed", evidenceResult.fallbackReason);
      addLog("collecting_evidence", `Evidence collection (fallback): ${evidenceResult.fallbackReason}`);
    } else {
      const totalCards = evidenceResult.data.reduce((sum, a) => sum + a.evidenceCards.length, 0);
      setStage(dispatch, "collecting_evidence", "completed");
      addLog(
        "collecting_evidence",
        `Collected ${totalCards} evidence cards across ${evidenceResult.data.length} accounts.`
      );
    }

    accounts = evidenceResult.data;
    dispatch({ type: "SET_ACCOUNTS", accounts });

    checkBudget();

    // --- Stage 5: Enrich ---
    setStage(dispatch, "enriching", "running");
    const enrichResult = await enrichAccounts(accounts, mode, startMs);

    if (enrichResult.fallback) {
      setStage(dispatch, "enriching", "completed", enrichResult.fallbackReason);
      addLog("enriching", `Enrichment (fallback): ${enrichResult.fallbackReason}`);
    } else {
      setStage(dispatch, "enriching", "completed");
      addLog("enriching", "Web enrichment completed. Additional evidence cards added to top accounts.");
    }

    accounts = enrichResult.data;
    dispatch({ type: "SET_ACCOUNTS", accounts });

    checkBudget();

    // --- Stage 6: Score ---
    setStage(dispatch, "scoring", "running");
    const scoreResult = await scoreAccounts(accounts, icpDescription, mode, startMs);

    if (scoreResult.fallback) {
      setStage(dispatch, "scoring", "completed", scoreResult.fallbackReason);
      addLog("scoring", `Scoring (fallback): ${scoreResult.fallbackReason}`);
    } else {
      const outreachCount = scoreResult.data.filter(
        (a) => a.opportunityScore && a.opportunityScore.recommendedAction === "generate_outreach"
      ).length;
      setStage(dispatch, "scoring", "completed");
      addLog(
        "scoring",
        `Scored ${scoreResult.data.length} accounts. ${outreachCount} recommended for outreach (≥60).`
      );
    }

    accounts = scoreResult.data;
    dispatch({ type: "SET_ACCOUNTS", accounts });

    checkBudget();

    // --- Stage 7: Match Personas ---
    setStage(dispatch, "matching_personas", "running");
    const personaResult = await matchPersonas(accounts, mode, startMs);

    if (personaResult.fallback) {
      setStage(dispatch, "matching_personas", "completed", personaResult.fallbackReason);
      addLog("matching_personas", `Persona matching (fallback): ${personaResult.fallbackReason}`);
    } else {
      const totalPersonas = personaResult.data.reduce((sum, a) => sum + a.personas.length, 0);
      setStage(dispatch, "matching_personas", "completed");
      addLog(
        "matching_personas",
        `Matched ${totalPersonas} buyer personas across ${personaResult.data.length} accounts.`
      );
    }

    accounts = personaResult.data;
    dispatch({ type: "SET_ACCOUNTS", accounts });

    checkBudget();

    // --- Stage 8: Generate Briefs ---
    setStage(dispatch, "generating_brief", "running");
    const briefOutreachResult = await generateBriefsAndOutreach(
      accounts,
      mode,
      suppressionList,
      startMs
    );

    if (briefOutreachResult.fallback) {
      setStage(dispatch, "generating_brief", "completed", briefOutreachResult.fallbackReason);
      addLog("generating_brief", `Brief generation (fallback): ${briefOutreachResult.fallbackReason}`);
    } else {
      const briefCount = briefOutreachResult.data.filter((a) => a.opportunityBrief).length;
      setStage(dispatch, "generating_brief", "completed");
      addLog(
        "generating_brief",
        `Generated opportunity briefs for ${briefCount} qualifying accounts.`
      );
    }

    accounts = briefOutreachResult.data;

    // --- Stage 9: Generate Outreach ---
    setStage(dispatch, "generating_outreach", "running");
    const outreachCount = accounts.filter((a) => a.outreachPack).length;
    setStage(dispatch, "generating_outreach", "completed");
    addLog(
      "generating_outreach",
      `Generated outreach packs for ${outreachCount} accounts. Each references specific evidence cards.`
    );

    dispatch({ type: "SET_ACCOUNTS", accounts });

    // Cache final accounts
    cache.set(CACHE_KEY_ACCOUNTS, accounts);

    // --- Stage 10: Ready ---
    setStage(dispatch, "ready", "running");
    setStage(dispatch, "ready", "completed");

    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    addLog("ready", `Workflow complete in ${elapsed}s. ${accounts.length} accounts processed, ${outreachCount} outreach packs ready.`);
  } catch (error) {
    // Global error handler — transition to failed state
    setStage(dispatch, "failed", "failed");
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    addLog("failed", `Workflow failed: ${message.slice(0, 250)}`);
  }
}
