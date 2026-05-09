import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from "react";
import type {
  WorkflowState,
  WorkflowStageName,
  WorkflowStatus,
  Mode,
  Account,
  SearchPlan,
  ActivityLogEntry,
  CampaignOutcome,
  CampaignFeedback,
} from "@/types";
import { cache } from "@/lib/cache";
import { redactLog } from "@/lib/log-redaction";

// --- Constants ---

const SUPPRESSION_LIST_KEY = "suppression-list";
const TIME_BUDGET_MS = 90_000; // 90 seconds

export const WORKFLOW_STAGES: WorkflowStageName[] = [
  "idle",
  "analyzing_icp",
  "awaiting_plan_approval",
  "discovering",
  "collecting_evidence",
  "enriching",
  "scoring",
  "matching_personas",
  "generating_brief",
  "generating_outreach",
  "ready",
  "feedback",
  "failed",
];

// --- Initial State ---

function loadSuppressionList(): string[] {
  return cache.get<string[]>(SUPPRESSION_LIST_KEY) ?? [];
}

function createInitialState(): WorkflowState {
  return {
    mode: "demo",
    stages: WORKFLOW_STAGES.map((name) => ({
      name,
      status: "pending" as WorkflowStatus,
    })),
    currentStage: "idle",
    activityLog: [],
    accounts: [],
    icpDescription: "",
    suppressionList: loadSuppressionList(),
    timeBudgetStartMs: undefined,
    selectedAccountId: undefined,
    campaignId: undefined,
    persistenceStatus: "none",
    presentationMode: false,
  };
}

const initialState: WorkflowState = createInitialState();

// --- Actions ---

export type WorkflowAction =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_ICP"; description: string }
  | { type: "SET_SEARCH_PLAN"; plan: SearchPlan }
  | { type: "SET_ACCOUNTS"; accounts: Account[] }
  | { type: "UPDATE_ACCOUNT"; account: Account }
  | { type: "SELECT_ACCOUNT"; id: string | undefined }
  | { type: "SET_STAGE"; stage: WorkflowStageName; status: WorkflowStatus; fallbackReason?: string }
  | { type: "ADD_LOG"; entry: Omit<ActivityLogEntry, "id" | "timestamp"> }
  | { type: "START_TIMER" }
  | { type: "TIME_BUDGET_EXCEEDED" }
  | { type: "SUPPRESS_ADD"; id: string }
  | { type: "SUPPRESS_REMOVE"; id: string }
  | { type: "SET_CAMPAIGN_OUTCOME"; accountId: string; outcome: CampaignOutcome }
  | { type: "SET_CAMPAIGN_FEEDBACK"; feedback: CampaignFeedback }
  | { type: "SET_CAMPAIGN_ID"; campaignId: string }
  | { type: "SET_PERSISTENCE_STATUS"; status: "none" | "saving" | "saved" | "failed" }
  | { type: "TOGGLE_PRESENTATION_MODE" }
  | { type: "CLEAR_DATA" }
  | { type: "RESET" };

function reducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "SET_ICP":
      return { ...state, icpDescription: action.description };

    case "SET_SEARCH_PLAN":
      return { ...state, searchPlan: action.plan };

    case "SET_ACCOUNTS":
      return {
        ...state,
        accounts: action.accounts,
        selectedAccountId:
          action.accounts.length > 0
            ? [...action.accounts].sort(
                (a, b) =>
                  (b.opportunityScore?.total ?? 0) -
                  (a.opportunityScore?.total ?? 0)
              )[0].id
            : undefined,
      };

    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.account.id ? action.account : a
        ),
      };

    case "SELECT_ACCOUNT":
      return { ...state, selectedAccountId: action.id };

    case "SET_STAGE": {
      const now = new Date().toISOString();
      return {
        ...state,
        currentStage: action.stage,
        stages: state.stages.map((s) =>
          s.name === action.stage
            ? {
                ...s,
                status: action.status,
                startedAt: action.status === "running" ? now : s.startedAt,
                completedAt:
                  action.status === "completed" || action.status === "failed"
                    ? now
                    : s.completedAt,
                fallbackActive: !!action.fallbackReason,
                fallbackReason: action.fallbackReason,
              }
            : s
        ),
      };
    }

    case "ADD_LOG":
      return {
        ...state,
        activityLog: [
          ...state.activityLog,
          {
            ...action.entry,
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };

    case "START_TIMER":
      return { ...state, timeBudgetStartMs: Date.now() };

    case "TIME_BUDGET_EXCEEDED":
      return {
        ...state,
        stages: state.stages.map((s) =>
          s.status === "running"
            ? {
                ...s,
                status: "warning" as WorkflowStatus,
                fallbackActive: true,
                fallbackReason: "Time budget exceeded (90s) — using cached/demo data",
              }
            : s
        ),
      };

    case "SUPPRESS_ADD": {
      if (state.suppressionList.includes(action.id)) return state;
      const newList = [...state.suppressionList, action.id];
      cache.set(SUPPRESSION_LIST_KEY, newList);
      return {
        ...state,
        suppressionList: newList,
        accounts: state.accounts.map((a) =>
          a.id === action.id
            ? { ...a, suppressedAt: new Date().toISOString() }
            : a
        ),
      };
    }

    case "SUPPRESS_REMOVE": {
      const newList = state.suppressionList.filter((id) => id !== action.id);
      cache.set(SUPPRESSION_LIST_KEY, newList);
      return {
        ...state,
        suppressionList: newList,
        accounts: state.accounts.map((a) =>
          a.id === action.id ? { ...a, suppressedAt: undefined } : a
        ),
      };
    }

    case "SET_CAMPAIGN_OUTCOME":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.accountId
            ? { ...a, campaignOutcome: action.outcome }
            : a
        ),
      };

    case "SET_CAMPAIGN_FEEDBACK":
      return { ...state, campaignFeedback: action.feedback };

    case "TOGGLE_PRESENTATION_MODE":
      return { ...state, presentationMode: !state.presentationMode };

    case "CLEAR_DATA":
      cache.remove(SUPPRESSION_LIST_KEY);
      return createInitialState();

    case "SET_CAMPAIGN_ID":
      return { ...state, campaignId: action.campaignId };

    case "SET_PERSISTENCE_STATUS":
      return { ...state, persistenceStatus: action.status };

    case "RESET":
      return {
        ...createInitialState(),
        mode: state.mode, // preserve mode across resets
        suppressionList: state.suppressionList, // preserve suppression list
      };

    default:
      return state;
  }
}

// --- Context ---

interface WorkflowContextValue {
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowAction>;
  // Convenience helpers
  addLog: (stage: WorkflowStageName, message: string) => void;
  isTimeBudgetExceeded: () => boolean;
  getElapsedMs: () => number;
  isSuppressed: (id: string) => boolean;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Sync suppression list to localStorage whenever it changes
  const prevSuppressionRef = useRef(state.suppressionList);
  useEffect(() => {
    if (prevSuppressionRef.current !== state.suppressionList) {
      cache.set(SUPPRESSION_LIST_KEY, state.suppressionList);
      prevSuppressionRef.current = state.suppressionList;
    }
  }, [state.suppressionList]);

  const addLog = useCallback(
    (stage: WorkflowStageName, message: string) => {
      dispatch({
        type: "ADD_LOG",
        entry: { stage, message: redactLog(message).slice(0, 280) },
      });
    },
    [dispatch]
  );

  const isTimeBudgetExceeded = useCallback(() => {
    if (!state.timeBudgetStartMs) return false;
    return Date.now() - state.timeBudgetStartMs > TIME_BUDGET_MS;
  }, [state.timeBudgetStartMs]);

  const getElapsedMs = useCallback(() => {
    if (!state.timeBudgetStartMs) return 0;
    return Date.now() - state.timeBudgetStartMs;
  }, [state.timeBudgetStartMs]);

  const isSuppressed = useCallback(
    (id: string) => state.suppressionList.includes(id),
    [state.suppressionList]
  );

  return (
    <WorkflowContext.Provider
      value={{ state, dispatch, addLog, isTimeBudgetExceeded, getElapsedMs, isSuppressed }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}
