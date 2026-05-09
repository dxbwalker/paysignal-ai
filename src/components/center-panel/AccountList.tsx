import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import type { Account, RecommendedAction } from "@/types";

type Filter = "all" | "outreach" | "research" | "deprioritized" | "high_confidence" | "weak_evidence";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outreach", label: "Outreach" },
  { id: "research", label: "Research" },
  { id: "deprioritized", label: "Deprioritized" },
  { id: "high_confidence", label: "High Conf." },
  { id: "weak_evidence", label: "Weak" },
];

function filterAccounts(accounts: Account[], filter: Filter): Account[] {
  switch (filter) {
    case "outreach":
      return accounts.filter((a) => a.opportunityScore?.recommendedAction === "generate_outreach");
    case "research":
      return accounts.filter((a) => a.opportunityScore?.recommendedAction === "research_further");
    case "deprioritized":
      return accounts.filter((a) => a.opportunityScore?.recommendedAction === "deprioritize");
    case "high_confidence":
      return accounts.filter((a) => {
        const conf = a.opportunityScore?.dimensions.find((d) => d.name === "confidence");
        return conf && conf.subScore >= 70;
      });
    case "weak_evidence":
      return accounts.filter((a) => a.lowEvidenceWarning || a.evidenceCards.length < 2);
    default:
      return accounts;
  }
}

function getFilterCount(accounts: Account[], filter: Filter): number {
  return filterAccounts(accounts, filter).length;
}

// --- Hero Card for top opportunity ---
function TopOpportunityCard({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const score = account.opportunityScore;
  if (!score) return null;

  const persona = account.personas[0];
  const whyNow = account.outreachPack?.whyThisAccountWhyNow || score.topFactors[0] || "";

  return (
    <div
      onClick={onClick}
      className={`mx-3 mt-3 p-4 rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? "border-brand-500/40 bg-brand-500/5 shadow-glow"
          : "border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent hover:border-emerald-500/30"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Top Opportunity</span>
      </div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">{account.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </p>
          {whyNow && (
            <p className="text-xs text-gray-300 mt-2 line-clamp-2">
              <span className="text-emerald-400">Why now:</span> {whyNow.slice(0, 120)}
            </p>
          )}
          {persona && (
            <p className="text-[11px] text-gray-500 mt-1">
              Next: Start with {persona.title}
            </p>
          )}
        </div>
        <div className="text-right ml-3">
          <span className="text-3xl font-bold font-mono text-emerald-400">{score.total}</span>
          <p className="text-[10px] text-gray-500">/ 100</p>
        </div>
      </div>
    </div>
  );
}

// --- Regular account card ---
function AccountCard({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const score = account.opportunityScore;
  const persona = account.personas[0];
  const whyNow = score?.topFactors[0] || "";

  const scoreColor = score
    ? score.total >= 80 ? "text-emerald-400" : score.total >= 60 ? "text-amber-400" : "text-gray-500"
    : "text-gray-600";

  const confidenceDot = (() => {
    const conf = score?.dimensions.find((d) => d.name === "confidence");
    if (!conf) return "bg-gray-600";
    if (conf.subScore >= 70) return "bg-emerald-400";
    if (conf.subScore >= 40) return "bg-amber-400";
    return "bg-gray-500";
  })();

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer transition-all border-l-[3px] ${
        isSelected
          ? "border-l-brand-500 bg-brand-500/5"
          : "border-l-transparent hover:bg-white/[0.02] hover:border-l-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">{account.name}</h3>
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceDot}`} title="Confidence" />
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </p>
          {whyNow && (
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              {whyNow.slice(0, 80)}
            </p>
          )}
          {persona && score && score.recommendedAction === "generate_outreach" && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              Next: {persona.title}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {score && (
            <span className={`text-lg font-bold font-mono ${scoreColor}`}>
              {score.total}
            </span>
          )}
          {score && (
            <ActionBadge action={score.recommendedAction} />
          )}
        </div>
      </div>

      {/* Deprioritize reason */}
      {account.deprioritizeReason && (
        <p className="text-[10px] text-rose-400/70 mt-1.5 truncate">
          ✕ {account.deprioritizeReason.slice(0, 80)}
        </p>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: RecommendedAction }) {
  if (action === "generate_outreach") return <span className="badge-green text-[9px]">Outreach</span>;
  if (action === "research_further") return <span className="badge-yellow text-[9px]">Research</span>;
  return <span className="badge-red text-[9px]">Skip</span>;
}

// --- Main component ---
export function AccountList() {
  const { state, dispatch } = useWorkflow();
  const [filter, setFilter] = useState<Filter>("all");

  const sortedAccounts = [...state.accounts].sort(
    (a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0)
  );

  const filteredAccounts = filterAccounts(sortedAccounts, filter);
  const topAccount = sortedAccounts[0];

  if (state.accounts.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
          <span className="text-xl">🔍</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">No accounts yet</p>
        <p className="text-gray-600 text-xs mt-1">Submit an ICP to discover payment opportunities</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="px-3 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const count = getFilterCount(state.accounts, f.id);
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[10px] px-2 py-1 rounded-md whitespace-nowrap transition-all ${
                  filter === f.id
                    ? "bg-brand-500/10 text-brand-400 font-medium"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {f.label} {count > 0 && <span className="text-gray-600 ml-0.5">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Opportunity Hero */}
      {filter === "all" && topAccount && topAccount.opportunityScore && topAccount.opportunityScore.total >= 70 && (
        <TopOpportunityCard
          account={topAccount}
          isSelected={state.selectedAccountId === topAccount.id}
          onClick={() => dispatch({ type: "SELECT_ACCOUNT", id: topAccount.id })}
        />
      )}

      {/* Account list */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
        {filteredAccounts
          .filter((a) => !(filter === "all" && a.id === topAccount?.id && topAccount.opportunityScore && topAccount.opportunityScore.total >= 70))
          .map((account) => (
            <AccountCard
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
