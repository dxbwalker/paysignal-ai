import { useWorkflow } from "@/context/WorkflowContext";

/**
 * ModeToggle — Live/Demo switch with visual indicator.
 * Green dot for Live mode, yellow dot for Demo mode.
 */
export function ModeToggle() {
  const { state, dispatch } = useWorkflow();

  const isLive = state.mode === "live";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Mode
        </span>
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isLive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" : "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]"
          }`}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => dispatch({ type: "SET_MODE", mode: "demo" })}
          className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
            !isLive
              ? "bg-yellow-500/20 text-yellow-400 shadow-sm"
              : "text-gray-500 hover:text-gray-300"
          }`}
          aria-pressed={!isLive}
          aria-label="Switch to Demo mode"
        >
          Demo
        </button>
        <button
          onClick={() => dispatch({ type: "SET_MODE", mode: "live" })}
          className={`text-[11px] px-3 py-1 rounded-md transition-all font-medium ${
            isLive
              ? "bg-green-500/20 text-green-400 shadow-sm"
              : "text-gray-500 hover:text-gray-300"
          }`}
          aria-pressed={isLive}
          aria-label="Switch to Live mode"
        >
          Live
        </button>
      </div>
    </div>
  );
}
