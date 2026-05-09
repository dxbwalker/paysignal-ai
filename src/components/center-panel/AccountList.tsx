import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import type { Account, RecommendedAction } from "@/types";

type Filter = "all" | "outreach" | "research" | "deprioritized";

function filterAccounts(accounts: Account[], filter: Filter): Account[] {
  if (filter === "outreach") return accounts.filter((a) => a.opportunityScore?.recommendedAction === "generate_outreach");
  if (filter === "research") return accounts.filter((a) => a.opportunityScore?.recommendedAction === "research_further");
  if (filter === "deprioritized") return accounts.filter((a) => a.opportunityScore?.recommendedAction === "deprioritize");
  return accounts;
}

function TopCard({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const score = account.opportunityScore;
  const whyNow = score?.topFactors[0] || "";
  const persona = account.personas[0];

  return (
    <div
      onClick={onClick}
      className={`card card-hero mx-3 mt-3 cursor-pointer ${isSelected ? "card-selected" : ""}`}
    >
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "#34d399" }}>
          Top Opportunity
        </span>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold text-white">{account.name}</h3>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </p>
          {whyNow && <p className="text-[12px] text-[#94a3b8] mt-2 line-clamp-2">{whyNow}</p>}
          {persona && <p className="text-[10px] text-[#475569] mt-1">Next: {persona.title}</p>}
        </div>
        <span className="text-2xl font-bold font-mono score-high ml-3">{score?.total}</span>
      </div>
    </div>
  );
}

function AccountRow({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const score = account.opportunityScore;
  const total = score?.total ?? 0;
  const scoreClass = total >= 80 ? "score-high" : total >= 60 ? "score-medium" : "score-low";
  const whyNow = score?.topFactors[0] || "";

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer transition-all ${
        isSelected
          ? "bg-[rgba(79,156,247,0.04)] border-l-2 border-l-[#4f9cf7]"
          : "border-l-2 border-l-transparent hover:bg-[rgba(255,255,255,0.015)]"
      }`}
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-white truncate">{account.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${total >= 70 ? "bg-[#34d399]" : total >= 50 ? "bg-[#fbbf24]" : "bg-[#475569]"}`} />
          </div>
          <p className="text-[10px] text-[#475569] mt-0.5">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </p>
          {whyNow && <p className="text-[11px] text-[#64748b] mt-1 truncate">{whyNow}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-base font-bold font-mono ${scoreClass}`}>{total}</span>
          {score && <ActionBadge action={score.recommendedAction} />}
        </div>
      </div>
      {account.deprioritizeReason && (
        <p className="text-[10px] text-[#f43f5e] mt-1 truncate opacity-70">✕ {account.deprioritizeReason.slice(0, 70)}</p>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: RecommendedAction }) {
  if (action === "generate_outreach") return <span className="badge badge-green">Outreach</span>;
  if (action === "research_further") return <span className="badge badge-yellow">Research</span>;
  return <span className="badge badge-red">Skip</span>;
}

export function AccountList() {
  const { state, dispatch } = useWorkflow();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = [...state.accounts].sort((a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0));
  const filtered = filterAccounts(sorted, filter);
  const topAccount = sorted[0];

  if (state.accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--surface-card)" }}>
          <span className="text-lg">🔍</span>
        </div>
        <p className="text-[13px] text-[#94a3b8] font-medium">No accounts yet</p>
        <p className="text-[11px] text-[#475569] mt-1">Submit an ICP to discover opportunities</p>
      </div>
    );
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "outreach", label: "Outreach" },
    { id: "research", label: "Research" },
    { id: "deprioritized", label: "Skipped" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                filter === f.id
                  ? "bg-[rgba(79,156,247,0.1)] text-[#4f9cf7] font-medium"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Opportunity */}
      {filter === "all" && topAccount && (topAccount.opportunityScore?.total ?? 0) >= 70 && (
        <TopCard
          account={topAccount}
          isSelected={state.selectedAccountId === topAccount.id}
          onClick={() => dispatch({ type: "SELECT_ACCOUNT", id: topAccount.id })}
        />
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered
          .filter((a) => !(filter === "all" && a.id === topAccount?.id && (topAccount.opportunityScore?.total ?? 0) >= 70))
          .map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isSelected={state.selectedAccountId === account.id}
              onClick={() => dispatch({ type: "SELECT_ACCOUNT", id: account.id })}
            />
          ))}
      </div>
    </div>
  );
}
