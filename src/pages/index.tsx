import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { BottomPanel } from "@/components/layout/BottomPanel";
import { ICPInput } from "@/components/left-panel/ICPInput";
import { AccountList } from "@/components/center-panel/AccountList";
import { AccountDetail } from "@/components/right-panel/AccountDetail";

export default function Home() {
  return (
    <ThreePanelLayout
      leftPanel={<ICPInput />}
      centerPanel={<AccountList />}
      rightPanel={<AccountDetail />}
      bottomPanel={<BottomPanel />}
    />
  );
}
