import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { DEMO_SCENARIO } from "@/lib/demo-scenario";
import { getDemoAccounts } from "@/lib/demo-data";

export function ICPInput() {
  const { state, dispatch, addLog } = useWorkflow();
  const [icp, setIcp] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (icp.length < 20) {
      setError("ICP description must be at least 20 characters with business-relevant context.");
      return;
    }
    setError("");
    dispatch({ type: "SET_ICP", description: icp });
    dispatch({ type: "START_TIMER" });

    // In demo mode, load seed data directly
    if (state.mode === "demo") {
      dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "running" });
      addLog("analyzing_icp", DEMO_SCENARIO.narrativeLabels.icpAnalysis);

      setTimeout(() => {
        dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "completed" });
        dispatch({ type: "SET_STAGE", stage: "discovering", status: "running" });
        addLog("discovering", DEMO_SCENARIO.narrativeLabels.discovery);

        setTimeout(() => {
          dispatch({ type: "SET_STAGE", stage: "discovering", status: "completed" });
          dispatch({ type: "SET_STAGE", stage: "collecting_evidence", status: "completed" });
          addLog("collecting_evidence", DEMO_SCENARIO.narrativeLabels.evidenceCollection);
          dispatch({ type: "SET_STAGE", stage: "enriching", status: "completed" });
          addLog("enriching", DEMO_SCENARIO.narrativeLabels.enrichment);
          dispatch({ type: "SET_STAGE", stage: "scoring", status: "completed" });
          addLog("scoring", DEMO_SCENARIO.narrativeLabels.scoring);
          dispatch({ type: "SET_STAGE", stage: "matching_personas", status: "completed" });
          addLog("matching_personas", DEMO_SCENARIO.narrativeLabels.personaMatching);
          dispatch({ type: "SET_STAGE", stage: "generating_brief", status: "completed" });
          addLog("generating_brief", DEMO_SCENARIO.narrativeLabels.briefGeneration);
          dispatch({ type: "SET_STAGE", stage: "generating_outreach", status: "completed" });
          addLog("generating_outreach", DEMO_SCENARIO.narrativeLabels.outreachGeneration);
          dispatch({ type: "SET_STAGE", stage: "ready", status: "completed" });

          const accounts = getDemoAccounts();
          dispatch({ type: "SET_ACCOUNTS", accounts });
        }, 1200);
      }, 800);
    }
  };

  const handlePreset = (text: string) => {
    setIcp(text);
    setError("");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Define Your ICP</h2>
        {state.mode === "demo" && (
          <span className="badge-yellow text-[10px]">Demo Mode</span>
        )}
      </div>

      {/* Presets */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Quick presets</span>
        <div className="flex flex-wrap gap-1">
          {DEMO_SCENARIO.presetIcps.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.text)}
              className="text-[11px] px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <textarea
        className="input-field text-xs"
        rows={5}
        placeholder="Describe your ideal customer... (min 20 characters)"
        value={icp}
        onChange={(e) => { setIcp(e.target.value); setError(""); }}
        maxLength={2000}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-600">{icp.length}/2000</span>
        <button
          onClick={handleSubmit}
          disabled={state.currentStage !== "idle" && state.currentStage !== "ready" && state.currentStage !== "feedback"}
          className="btn-primary text-xs"
        >
          🔍 Find Accounts
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">Mode</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: "SET_MODE", mode: "demo" })}
              className={`text-[10px] px-2 py-0.5 rounded ${state.mode === "demo" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              Demo
            </button>
            <button
              onClick={() => dispatch({ type: "SET_MODE", mode: "live" })}
              className={`text-[10px] px-2 py-0.5 rounded ${state.mode === "live" ? "bg-green-500/20 text-green-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
