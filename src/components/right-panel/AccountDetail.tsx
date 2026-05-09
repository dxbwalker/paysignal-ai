import { useWorkflow } from "@/context/WorkflowContext";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { EvidenceCardList } from "./EvidenceCardList";
import { PersonaList } from "./PersonaList";
import { OpportunityBrief } from "./OpportunityBrief";
import { AgentOutreachView } from "./AgentOutreachView";
import { CampaignActions } from "./CampaignActions";
import { SelectedAccountHero } from "./SelectedAccountHero";
import { generateStrategy } from "@/lib/outreach-strategy";
import { useState, useMemo, useEffect } from "react";

type Tab = "plan" | "evidence" | "brief" | "actions";

export function AccountDetail() {
  const { state } = useWorkflow();

  const account = state.accounts.find((a) => a.id === state.selectedAccountId);
  const strategy = useMemo(() => (account ? generateStrategy(account) : null), [account]);

  const defaultTab: Tab = strategy ? "plan" : "evidence";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    setActiveTab(strategy ? "plan" : "evidence");
  }, [account?.id, strategy]);

  if (!account) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[13px] text-[#475569]">Select an account</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "plan", label: "Plan" },
    { id: "evidence", label: "Evidence" },
    { id: "brief", label: "Brief" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="flex flex-col h-full">
      <SelectedAccountHero account={account} strategy={strategy} />

      {/* Tabs */}
      <div className="flex px-7 gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2.5 text-[12px] font-medium transition-colors relative ${
              activeTab === tab.id ? "text-[#4f9cf7]" : "text-[#475569] hover:text-[#94a3b8]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: "#4f9cf7" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-7">
        {activeTab === "plan" && <AgentOutreachView account={account} strategy={strategy || undefined} />}
        {activeTab === "evidence" && <EvidenceCardList account={account} />}
        {activeTab === "brief" && <OpportunityBrief account={account} />}
        {activeTab === "actions" && <CampaignActions account={account} />}
      </div>
    </div>
  );
}
