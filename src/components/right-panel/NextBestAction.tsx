import type { OutreachStrategy } from "@/lib/outreach-strategy";

interface Props {
  strategy: OutreachStrategy;
}

export function NextBestAction({ strategy }: Props) {
  // Find the first non-completed step
  const nextStep = strategy.sequence.find((s) => s.status === "draft" || s.status === "approved");

  if (!nextStep) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
        <p className="text-xs text-emerald-400 font-medium">✓ All sequence steps completed</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-white/5 rounded-lg p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-brand-400 text-sm">→</span>
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Next Action</p>
        <p className="text-sm text-white font-medium">{strategy.nextBestAction}</p>
      </div>
      <button className="btn-primary text-[10px] px-3 py-1.5">
        Copy
      </button>
    </div>
  );
}
