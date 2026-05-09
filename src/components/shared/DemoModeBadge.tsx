import { useWorkflow } from "@/context/WorkflowContext";

/**
 * Persistent badge shown when Demo Mode is active.
 * Renders in the top-right corner of the viewport.
 */
export function DemoModeBadge() {
  const { state } = useWorkflow();

  if (state.mode !== "demo") return null;

  return (
    <div className="fixed top-3 right-3 z-50">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-medium shadow-lg backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Demo Mode
      </span>
    </div>
  );
}
