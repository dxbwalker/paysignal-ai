import { useEffect, useCallback } from "react";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { AgentDecisionStream } from "@/components/layout/AgentDecisionStream";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { SearchPlanEditor } from "@/components/left-panel/SearchPlanEditor";
import { ModeToggle } from "@/components/left-panel/ModeToggle";
import { ComplianceNotice } from "@/components/shared/ComplianceNotice";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";
import { useWorkflow } from "@/context/WorkflowContext";

export default function Home() {
  const { state, dispatch } = useWorkflow();

  // Keyboard shortcuts (disabled when input/textarea focused)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      }

      if (e.key === "Escape" && state.presentationMode) {
        dispatch({ type: "TOGGLE_PRESENTATION_MODE" });
      }

      // Navigate accounts with arrow keys
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

  return (
    <div className={state.presentationMode ? "text-base" : ""}>
      {/* Presentation Mode indicator */}
      {state.presentationMode && (
        <div className="fixed top-2 right-2 z-50 badge-cyan text-[10px] px-2 py-1">
          Presentation Mode · Press Esc to exit
        </div>
      )}

      <ThreePanelLayout
        leftPanel={
          state.presentationMode ? null : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <ICPInput />
                <SearchPlanEditor />
                <ModeToggle />
              </div>
              <div className="p-3 border-t border-gray-800">
                <ComplianceNotice />
              </div>
            </div>
          )
        }
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
