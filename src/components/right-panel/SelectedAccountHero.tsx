import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";

interface Props {
  account: Account;
  strategy: OutreachStrategy | null;
}

export function SelectedAccountHero({ account, strategy }: Props) {
  const score = account.opportunityScore;
  const total = score?.total ?? 0;
  const scoreColor = total >= 80 ? "#34d399" : total >= 60 ? "#fbbf24" : "#64748b";

  const nextAction = strategy?.nextBestAction || "Review account details";

  return (
    <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Name + Score */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-semibold text-white">{account.name}</h1>
          <p className="text-[11px] text-[#475569] mt-1">
            {account.businessModel.replace(/_/g, " ")} · {account.location}
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{total}</span>
        </div>
      </div>

      {/* Next action */}
      {strategy && (
        <div className="flex items-center gap-3 mt-4 p-3 rounded-lg" style={{ background: "rgba(79,156,247,0.04)", border: "1px solid rgba(79,156,247,0.1)" }}>
          <span className="text-[11px] text-[#64748b]">Next →</span>
          <span className="text-[13px] text-white flex-1">{nextAction}</span>
          <button className="btn-primary text-[11px] px-3 py-1.5">Go</button>
        </div>
      )}
    </div>
  );
}
