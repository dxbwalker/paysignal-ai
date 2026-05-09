import { useWorkflow } from "@/context/WorkflowContext";
import type { Account } from "@/types";

function AccountRow({ account, isSelected, onClick }: { account: Account; isSelected: boolean; onClick: () => void }) {
  const score = account.opportunityScore;
  const total = score?.total ?? 0;
  const scoreColor = total >= 80 ? "#34d399" : total >= 60 ? "#fbbf24" : "#475569";

  return (
    <div
      onClick={onClick}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", borderLeft: isSelected ? "2px solid #4f9cf7" : "2px solid transparent" }}
      className={`px-4 py-3.5 cursor-pointer transition-colors ${isSelected ? "bg-[rgba(79,156,247,0.03)]" : "hover:bg-[rgba(255,255,255,0.01)]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-medium text-white block truncate">{account.name}</span>
          <span className="text-[10px] text-[#475569] block mt-0.5">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </span>
        </div>
        <span className="text-lg font-bold font-mono ml-3" style={{ color: scoreColor }}>{total}</span>
      </div>
    </div>
  );
}

export function AccountList() {
  const { state, dispatch } = useWorkflow();

  const sorted = [...state.accounts].sort((a, b) => (b.opportunityScore?.total ?? 0) - (a.opportunityScore?.total ?? 0));

  if (state.accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-[12px] text-[#475569]">Submit an ICP to find opportunities</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">
          {sorted.length} Opportunities
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((account) => (
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
