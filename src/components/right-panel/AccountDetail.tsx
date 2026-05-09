import { useWorkflow } from "@/context/WorkflowContext";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { EvidenceCardList } from "./EvidenceCardList";
import { PersonaList } from "./PersonaList";
import { OpportunityBrief } from "./OpportunityBrief";
import { AgentOutreachView } from "./AgentOutreachView";
import { CampaignActions } from "./CampaignActions";
import { generateStrategy } from "@/lib/outreach-strategy";
import { useState, useMemo } from "react";

type Tab = "score" | "evidence" | "personas" | "brief" | "agent_plan" | "actions";

export function AccountDetail() {
  const { state } = useWorkflow();
  const [activeTab, setActiveTab] = useState<Tab>("score");

  const account = state.accounts.find((a) => a.id === state.selectedAccountId);

  // useMemo must be called before any early returns (React hooks rules)
  const strategy = useMemo(
    () => (account ? generateStrategy(account) : null),
    [account]
  );

  if (!account) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <p className="text-gray-600 text-sm">Select an account to view details.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "score", label: "Score" },
    { id: "evidence", label: "Evidence", count: account.evidenceCards.length },
    { id: "personas", label: "Personas", count: account.personas.length },
    { id: "brief", label: "Brief" },
    { id: "agent_plan", label: "Agent Plan" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">{account.name}</h2>
            <p className="text-[11px] text-gray-500 font-normal mt-0.5">
              {account.businessModel.replace("_", " ")} · {account.location}
              {account.fundingStage && ` · ${account.fundingStage}`}
            </p>
          </div>
          {account.opportunityScore && (
            <div className="text-right">
              <span className={`text-2xl font-bold font-mono ${
                account.opportunityScore.total >= 80 ? "text-score-high" :
                account.opportunityScore.total >= 60 ? "text-score-medium" : "text-gray-400"
              }`}>
                {account.opportunityScore.total}
              </span>
              <p className="text-[10px] text-gray-500">/100</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "score" && <ScoreBreakdown account={account} />}
        {activeTab === "evidence" && <EvidenceCardList account={account} />}
        {activeTab === "personas" && <PersonaList account={account} />}
        {activeTab === "brief" && <OpportunityBrief account={account} />}
        {activeTab === "agent_plan" && <AgentOutreachView account={account} strategy={strategy || undefined} />}
        {activeTab === "actions" && <CampaignActions account={account} />}
      </div>
    </div>
  );
}
