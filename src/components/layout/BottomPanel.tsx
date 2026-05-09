import { useWorkflow } from "@/context/WorkflowContext";

export function BottomPanel() {
  const { state } = useWorkflow();

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Agent Activity Log
        </span>
        <span className="text-xs text-gray-600">
          ({state.activityLog.length} entries)
        </span>
      </div>

      {state.activityLog.length === 0 ? (
        <p className="text-xs text-gray-600 italic">
          Waiting for workflow to start...
        </p>
      ) : (
        <div className="space-y-1">
          {state.activityLog.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <span className="text-gray-600 font-mono whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="badge-blue text-[10px] px-1.5 py-0">
                {entry.stage}
              </span>
              <span className="text-gray-300">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
