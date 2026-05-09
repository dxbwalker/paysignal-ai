import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BottomPanel } from "@/components/layout/BottomPanel";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { SearchPlanEditor } from "@/components/left-panel/SearchPlanEditor";
import { ModeToggle } from "@/components/left-panel/ModeToggle";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";

export default function Home() {
  return (
    <ThreePanelLayout
      leftPanel={
        <>
          <ICPInput />
          <SearchPlanEditor />
          <ModeToggle />
        </>
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
