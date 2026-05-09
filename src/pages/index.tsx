import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BottomPanel } from "@/components/layout/BottomPanel";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { SearchPlanEditor } from "@/components/left-panel/SearchPlanEditor";
import { ModeToggle } from "@/components/left-panel/ModeToggle";
import { ComplianceNotice } from "@/components/shared/ComplianceNotice";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";

export default function Home() {
  return (
    <ThreePanelLayout
      leftPanel={
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
      }
      centerPanel={
        <>
          <WorkflowProgress />
          <AccountList />
        </>
      }
      rightPanel={<AccountDetail />}
      bottomPanel={<BottomPanel />}
    />
  );
}
