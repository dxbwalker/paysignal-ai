import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { Account } from "@/types";

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}

function ActionLabel({ action }: { action: string }) {
  if (action === "generate_outreach") {
    return <span className="badge-green text-[10px]">Outreach</span>;
  }
  if (action === "research_further") {
    return <span className="badge-yellow text-[10px]">Research further</span>;
  }
  return <span className="badge-red text-[10px]">Deprioritized</span>;
}

function WhyNotBadge({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red-400/80 bg-red-500/5 border border-red-500/10 rounded px-1.5 py-0.5">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      {reason.length > 60 ? reason.slice(0, 57) + "..." : reason}
    </span>
  );
}

/**
 * AccountCard — compact card showing company name, business model tag,
 * score badge, recommended action. For accounts <40, shows deprioritize reason.
 * For accounts 40-59, shows "Research further" label.
 */
export function AccountCard({ account, isSelected, onClick }: AccountCardProps) {
  const score = account.opportunityScore?.total ?? 0;
  const recommendedAction = account.opportunityScore?.recommendedAction;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`p-3 border-b border-gray-800 cursor-pointer transition-colors ${
        isSelected
          ? "bg-brand-600/10 border-l-2 border-l-brand-500"
          : "hover:bg-gray-800/50"
      }`}
    >
      {/* Top row: name + score */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">
              {account.name}
            </h3>
            {account.opportunityScore && (
              <ScoreBadge score={account.opportunityScore.total} size="sm" />
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <span className="capitalize">
              {account.businessModel.replace(/_/g, " ")}
            </span>
            {account.location && ` · ${account.location}`}
          </p>
        </div>
        {recommendedAction && <ActionLabel action={recommendedAction} />}
      </div>

      {/* Top factor preview for high-scoring accounts */}
      {score >= 60 && account.opportunityScore?.topFactors[0] && (
        <p className="text-[10px] text-gray-500 mt-1 truncate">
          ↑ {account.opportunityScore.topFactors[0]}
        </p>
      )}

      {/* "Research further" visual badge for accounts 40-59 */}
      {score >= 40 && score < 60 && account.opportunityScore?.missingFactors[0] && (
        <p className="text-[10px] text-yellow-400/70 mt-1.5 truncate">
          ⚠ Missing: {account.opportunityScore.missingFactors[0]}
        </p>
      )}

      {/* Deprioritize reason with "why not" badge for accounts <40 */}
      {score < 40 && score > 0 && (
        <div className="mt-1.5">
          {(account.opportunityScore?.deprioritizeReason || account.deprioritizeReason) && (
            <WhyNotBadge
              reason={
                account.opportunityScore?.deprioritizeReason ||
                account.deprioritizeReason ||
                "Low opportunity score"
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
