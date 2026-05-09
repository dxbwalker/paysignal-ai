import { useWorkflow } from "@/context/WorkflowContext";
import { AccountCard } from "@/components/center-panel/AccountCard";

/**
 * AccountList — renders accounts sorted by score descending.
 * Uses ScoreBadge component (via AccountCard). Shows recommended action label.
 * Clicking an AccountCard dispatches SELECT_ACCOUNT action to WorkflowContext.
 * The SET_ACCOUNTS reducer already auto-selects the highest-scoring account
 * with recommended action `generate_outreach`.
 */
export function AccountList() {
  const { state, dispatch } = useWorkflow();

  // Sort accounts by score descending, using confidence as tiebreaker
  const sortedAccounts = [...state.accounts].sort((a, b) => {
    const scoreA = a.opportunityScore?.total ?? 0;
    const scoreB = b.opportunityScore?.total ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tiebreaker: confidence dimension sub-score
    const confA =
      a.opportunityScore?.dimensions.find((d) => d.name === "confidence")
        ?.subScore ?? 0;
    const confB =
      b.opportunityScore?.dimensions.find((d) => d.name === "confidence")
        ?.subScore ?? 0;
    return confB - confA;
  });

  if (state.accounts.length === 0) {
    return (
      <div className="p-4">
        <h2 className="panel-header px-0 border-0 mb-4">Discovered Accounts</h2>
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">No accounts yet.</p>
          <p className="text-gray-700 text-xs mt-1">
            Submit an ICP to discover accounts.
          </p>
        </div>
      </div>
    );
  }

  // Count by action category
  const outreachCount = sortedAccounts.filter(
    (a) => a.opportunityScore?.recommendedAction === "generate_outreach"
  ).length;
  const researchCount = sortedAccounts.filter(
    (a) => a.opportunityScore?.recommendedAction === "research_further"
  ).length;
  const deprioritizedCount = sortedAccounts.filter(
    (a) => a.opportunityScore?.recommendedAction === "deprioritize"
  ).length;

  return (
    <div>
      <div className="panel-header flex items-center justify-between">
        <span>Accounts ({state.accounts.length})</span>
        <span className="text-[10px] text-gray-600 font-normal">
          Sorted by score
        </span>
      </div>

      {/* Summary badges */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-800/50">
        {outreachCount > 0 && (
          <span className="badge-green text-[9px]">
            {outreachCount} outreach
          </span>
        )}
        {researchCount > 0 && (
          <span className="badge-yellow text-[9px]">
            {researchCount} research
          </span>
        )}
        {deprioritizedCount > 0 && (
          <span className="badge-gray text-[9px]">
            {deprioritizedCount} deprioritized
          </span>
        )}
      </div>

      {/* Account cards */}
      <div>
        {sortedAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            isSelected={state.selectedAccountId === account.id}
            onClick={() =>
              dispatch({ type: "SELECT_ACCOUNT", id: account.id })
            }
          />
        ))}
      </div>
    </div>
  );
}
