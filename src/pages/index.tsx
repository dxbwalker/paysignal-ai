import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BottomPanel } from "@/components/layout/BottomPanel";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { SearchPlanPreview } from "@/components/left-panel/SearchPlanPreview";
import { AccountList } from "@/components/center-panel/AccountList";
import { WorkflowProgress } from "@/components/center-panel/WorkflowProgress";
import { AccountDetail } from "@/components/right-panel/AccountDetail";

export default function Home() {
  return (
    <ThreePanelLayout
      leftPanel={
        <>
          <ICPInput />
          <SearchPlanPreview />
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
