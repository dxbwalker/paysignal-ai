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

type Tab = "plan" | "brief" | "evidence" | "score" | "personas" | "actions";

export function AccountDetail() {
  const { state } = useWorkflow();

  const account = state.accounts.find((a) => a.id === state.selectedAccountId);

  const strategy = useMemo(
    () => (account ? generateStrategy(account) : null),
    [account]
  );

  // Default tab: Plan if strategy exists, Brief if score ≥60, Score otherwise
  const defaultTab: Tab = strategy ? "plan" : (account?.opportunityScore && account.opportunityScore.total >= 60) ? "brief" : "score";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Reset tab when account changes
  useEffect(() => {
    const newDefault: Tab = strategy ? "plan" : (account?.opportunityScore && account.opportunityScore.total >= 60) ? "brief" : "score";
    setActiveTab(newDefault);
  }, [account?.id, strategy]);

  if (!account) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-600 text-sm">Select an account to view details.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "plan", label: "Plan" },
    { id: "brief", label: "Brief" },
    { id: "evidence", label: "Evidence", count: account.evidenceCards.length },
    { id: "score", label: "Score" },
    { id: "personas", label: "Personas", count: account.personas.length },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Hero Section */}
      <SelectedAccountHero account={account} strategy={strategy} />

      {/* Tabs */}
      <div className="border-b border-white/5">
        <div className="flex px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === tab.id
                  ? "text-brand-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-[10px] text-gray-600">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        {activeTab === "plan" && (
          <p className="px-4 pb-2 text-[10px] text-gray-600">
            Recommended buyer, channel, sequence, and next action
          </p>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "plan" && <AgentOutreachView account={account} strategy={strategy || undefined} />}
        {activeTab === "brief" && <OpportunityBrief account={account} />}
        {activeTab === "evidence" && <EvidenceCardList account={account} />}
        {activeTab === "score" && <ScoreBreakdown account={account} />}
        {activeTab === "personas" && <PersonaList account={account} />}
        {activeTab === "actions" && <CampaignActions account={account} />}
      </div>
    </div>
  );
}
