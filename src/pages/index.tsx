import { useEffect, useCallback, useState } from "react";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { AgentDecisionStream } from "@/components/layout/AgentDecisionStream";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { CompactSearchSummary } from "@/components/left-panel/CompactSearchSummary";
import { ModeToggle } from "@/components/left-panel/ModeToggle";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";
import { useWorkflow } from "@/context/WorkflowContext";

export default function Home() {
  const { state, dispatch } = useWorkflow();
  const [leftExpanded, setLeftExpanded] = useState(true);

  const workflowStarted = state.accounts.length > 0;

  // Auto-collapse left panel when accounts load
  useEffect(() => {
    if (workflowStarted && leftExpanded) {
      setLeftExpanded(false);
    }
  }, [workflowStarted]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape" && state.presentationMode) {
        dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      }

      if (state.accounts.length > 0) {
        const sorted = [...state.accounts].sort(
          (a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0)
        );
        const idx = sorted.findIndex((a) => a.id === state.selectedAccountId);
        if (e.key === "ArrowDown") { e.preventDefault(); dispatch({ type: "SELECT_ACCOUNT", id: sorted[Math.min(idx + 1, sorted.length - 1)]?.id }); }
        if (e.key === "ArrowUp") { e.preventDefault(); dispatch({ type: "SELECT_ACCOUNT", id: sorted[Math.max(idx - 1, 0)]?.id }); }
      }
    },
    [dispatch, state.accounts, state.selectedAccountId, state.presentationMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Left panel: compact after workflow starts
  const leftContent = state.presentationMode ? null : (
    workflowStarted && !leftExpanded
      ? (
        <div className="flex flex-col h-full">
          <div className="flex-1"><CompactSearchSummary onExpand={() => setLeftExpanded(true)} /></div>
          <ModeToggle />
        </div>
      )
      : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto"><ICPInput /></div>
          <ModeToggle />
        </div>
      )
  );

  return (
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
  );
}
