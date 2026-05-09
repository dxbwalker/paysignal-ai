import type { Account } from "@/types";
import type { OutreachStrategy } from "@/lib/outreach-strategy";

interface Props {
  strategy: OutreachStrategy;
  account: Account;
}

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: "💬",
  email: "📧",
  call: "📞",
  follow_up: "🔄",
};

export function AgentRecommendation({ strategy, account }: Props) {
  const confidenceColor =
    strategy.confidence === "high" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    strategy.confidence === "medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-gray-400 bg-gray-500/10 border-gray-500/20";

  return (
    <div className="bg-gradient-to-r from-brand-500/5 to-transparent border border-brand-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">Agent Recommendation</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${confidenceColor}`}>
          {strategy.confidence} confidence
        </span>
      </div>

      <p className="text-sm text-white leading-relaxed">
        Start with <span className="font-semibold text-brand-300">{strategy.recommendedPersonaTitle}</span>
        {" "}through <span className="font-semibold text-brand-300">
          {CHANNEL_ICONS[strategy.recommendedChannel]} {strategy.recommendedChannel.replace("_", " ")}
        </span>.
        Use the <span className="text-gray-200">{strategy.recommendedAngle.toLowerCase().slice(0, 60)}</span> angle.
      </p>

      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
        {strategy.rationale}
      </p>

      {/* Success hypothesis */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[10px] text-gray-500">
          <span className="text-emerald-400">Success hypothesis:</span> {strategy.successHypothesis}
        </p>
      </div>
    </div>
  );
}
