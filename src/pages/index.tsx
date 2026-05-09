import { useEffect, useCallback, useState } from "react";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { AgentDecisionStream } from "@/components/layout/AgentDecisionStream";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { SearchPlanEditor } from "@/components/left-panel/SearchPlanEditor";
import { ModeToggle } from "@/components/left-panel/ModeToggle";
import { CompactSearchSummary } from "@/components/left-panel/CompactSearchSummary";
import { ComplianceNotice } from "@/components/shared/ComplianceNotice";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";
import { useWorkflow } from "@/context/WorkflowContext";

export default function Home() {
  const { state, dispatch } = useWorkflow();
  const [leftExpanded, setLeftExpanded] = useState(true);

  // Auto-collapse left panel after accounts are loaded
  const workflowStarted = state.accounts.length > 0;

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      }
      if (e.key === "Escape" && state.presentationMode) {
        dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      }

      if (state.accounts.length > 0) {
        const sorted = [...state.accounts].sort(
          (a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0)
        );
        const currentIdx = sorted.findIndex((a) => a.id === state.selectedAccountId);

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const nextIdx = Math.min(currentIdx + 1, sorted.length - 1);
          dispatch({ type: "SELECT_ACCOUNT", id: sorted[nextIdx].id });
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const prevIdx = Math.max(currentIdx - 1, 0);
          dispatch({ type: "SELECT_ACCOUNT", id: sorted[prevIdx].id });
        }
      }
    },
    [dispatch, state.accounts, state.selectedAccountId, state.presentationMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Left panel content
  const leftContent = (() => {
    if (state.presentationMode) return null;

    // Compact mode after workflow started
    if (workflowStarted && !leftExpanded) {
      return <CompactSearchSummary onExpand={() => setLeftExpanded(true)} />;
    }

    // Full mode
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <ICPInput />
          <SearchPlanEditor />
          <ModeToggle />
        </div>
        <div className="p-3 border-t border-white/5">
          <ComplianceNotice />
          {workflowStarted && (
            <button
              onClick={() => setLeftExpanded(false)}
              className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 w-full text-center"
            >
              Collapse panel ↑
            </button>
          )}
        </div>
      </div>
    );
  })();

  return (
    <div className={state.presentationMode ? "text-[15px]" : ""}>
      {state.presentationMode && (
        <div className="fixed top-2 right-2 z-50 text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Presentation · Esc to exit
        </div>
      )}

      <ThreePanelLayout
        leftPanel={leftContent}
        centerPanel={
          <>
            <WorkflowProgress />
            <AccountList />
          </>
        }
        rightPanel={<AccountDetail />}
        bottomPanel={<AgentDecisionStream />}
      />
    </div>
  );
}
