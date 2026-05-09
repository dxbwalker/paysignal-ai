import { useWorkflow } from "@/context/WorkflowContext";
import type { Account } from "@/types";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? "badge-green" : score >= 60 ? "badge-yellow" : "badge-gray";
  return <span className={`${cls} font-mono text-[11px]`}>{score}</span>;
}

function ActionBadge({ action }: { action: string }) {
  if (action === "generate_outreach") return <span className="badge-green text-[10px]">Outreach</span>;
  if (action === "research_further") return <span className="badge-yellow text-[10px]">Research</span>;
  return <span className="badge-red text-[10px]">Deprioritized</span>;
}

function AccountCard({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 border-b border-gray-800 cursor-pointer transition-colors ${
        isSelected ? "bg-brand-600/10 border-l-2 border-l-brand-500" : "hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">{account.name}</h3>
            {account.opportunityScore && <ScoreBadge score={account.opportunityScore.total} />}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {account.businessModel.replace("_", " ")} · {account.location}
          </p>
        </div>
        {account.opportunityScore && (
          <ActionBadge action={account.opportunityScore.recommendedAction} />
        )}
      </div>

      {/* Top factor preview */}
      {account.opportunityScore?.topFactors[0] && (
        <p className="text-[10px] text-gray-500 mt-1 truncate">
          ↑ {account.opportunityScore.topFactors[0]}
        </p>
      )}

      {/* Deprioritize reason */}
      {account.deprioritizeReason && (
        <p className="text-[10px] text-red-400/70 mt-1 truncate">
          ✕ {account.deprioritizeReason.slice(0, 80)}...
        </p>
      )}
    </div>
  );
}

export function AccountList() {
  const { state, dispatch } = useWorkflow();

  const sortedAccounts = [...state.accounts].sort(
    (a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0)
  );

  if (state.accounts.length === 0) {
    return (
      <div className="p-4">
        <h2 className="panel-header px-0 border-0 mb-4">Discovered Accounts</h2>
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">No accounts yet.</p>
          <p className="text-gray-700 text-xs mt-1">Submit an ICP to discover accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="panel-header flex items-center justify-between">
        <span>Accounts ({state.accounts.length})</span>
        <span className="text-[10px] text-gray-600 font-normal">Sorted by score</span>
      </div>
      <div>
        {sortedAccounts.map((account) => (
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
