import { useEffect, useRef } from "react";
import { useWorkflow } from "@/context/WorkflowContext";

export function BottomPanel() {
  const { state } = useWorkflow();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.activityLog.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Agent Activity Log
        </span>
        <span className="text-xs text-gray-600">
          ({state.activityLog.length} entries)
        </span>
      </div>

      {/* Scrollable entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
        {state.activityLog.length === 0 ? (
          <p className="text-xs text-gray-600 italic py-2">
            Waiting for workflow to start...
          </p>
        ) : (
          <div className="space-y-1">
            {state.activityLog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 font-mono whitespace-nowrap shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="badge-blue text-[10px] px-1.5 py-0 shrink-0">
                  {entry.stage}
                </span>
                <span className="text-gray-300 break-words">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
