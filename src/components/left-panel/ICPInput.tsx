import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { DEMO_SCENARIO } from "@/lib/demo-scenario";
import { getDemoAccounts } from "@/lib/demo-data";
import { parseIcp, hasBusinessContext } from "@/lib/icp-parser";

const MIN_CHARS = 20;
const MAX_CHARS = 2000;

/**
 * ICPInput — textarea with character count, validation (20-2000 chars),
 * submit button, and 2-3 preset ICP examples as clickable chips.
 *
 * Validation:
 * - Rejects < 20 characters
 * - Rejects > 2000 characters
 * - Rejects no identifiable business context
 * - Suggests narrowing if < 2 targeting dimensions
 */
export function ICPInput() {
  const { state, dispatch, addLog } = useWorkflow();
  const [icp, setIcp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = icp.length;
  const isValidLength = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const canSubmit =
    isValidLength &&
    !isSubmitting &&
    (state.currentStage === "idle" ||
      state.currentStage === "ready" ||
      state.currentStage === "feedback" ||
      state.currentStage === "failed");

  const validate = (): string | null => {
    const trimmed = icp.trim();
    if (trimmed.length < MIN_CHARS) {
      return `ICP description must be at least ${MIN_CHARS} characters. Please provide more detail about your target customers.`;
    }
    if (trimmed.length > MAX_CHARS) {
      return `ICP description must be ${MAX_CHARS} characters or fewer.`;
    }
    if (!hasBusinessContext(trimmed)) {
      return "No identifiable business context found. Please include at least one business-relevant targeting concept (industry, company type, payment pain, or buyer persona).";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    const trimmed = icp.trim();
    dispatch({ type: "SET_ICP", description: trimmed });
    dispatch({ type: "START_TIMER" });
    dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "running" });

    if (state.mode === "demo") {
      // In demo mode, use local parser and load seed data
      const { searchPlan, rationale } = parseIcp(trimmed);
      addLog("analyzing_icp", rationale);

      // Brief delay for visual effect
      await new Promise((r) => setTimeout(r, 600));

      dispatch({ type: "SET_SEARCH_PLAN", plan: searchPlan });
      dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "completed" });
      dispatch({ type: "SET_STAGE", stage: "awaiting_plan_approval", status: "running" });
      addLog("awaiting_plan_approval", "Search plan generated. Awaiting user approval before discovery.");

      setIsSubmitting(false);
    } else {
      // In live mode, call the API
      try {
        const res = await fetch("/api/analyze-icp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icpDescription: trimmed }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to analyze ICP.");
          dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "failed" });
          setIsSubmitting(false);
          return;
        }

        dispatch({ type: "SET_SEARCH_PLAN", plan: data.searchPlan });
        addLog("analyzing_icp", data.rationale);
        dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "completed" });
        dispatch({ type: "SET_STAGE", stage: "awaiting_plan_approval", status: "running" });
        addLog("awaiting_plan_approval", "Search plan generated. Awaiting user approval before discovery.");
      } catch (err) {
        // Fallback to local parser on network error
        const { searchPlan, rationale } = parseIcp(trimmed);
        dispatch({ type: "SET_SEARCH_PLAN", plan: searchPlan });
        addLog("analyzing_icp", rationale + " (fallback: API unavailable)");
        dispatch({ type: "SET_STAGE", stage: "analyzing_icp", status: "completed" });
        dispatch({ type: "SET_STAGE", stage: "awaiting_plan_approval", status: "running" });
        addLog("awaiting_plan_approval", "Search plan generated via fallback. Awaiting user approval.");
      }
      setIsSubmitting(false);
    }
  };

  const handlePreset = (text: string) => {
    setIcp(text);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey && canSubmit) {
      handleSubmit();
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Define Your ICP</h2>
      </div>

      {/* Preset Examples */}
      <div className="space-y-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          Quick presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_SCENARIO.presetIcps.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.text)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors border border-gray-700/50 hover:border-gray-600"
              title={preset.text}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          className="input-field text-xs resize-none"
          rows={5}
          placeholder="Describe your ideal customer profile... (min 20 characters)&#10;&#10;Example: Marketplaces expanding internationally with complex payouts, reconciliation, and finance operations."
          value={icp}
          onChange={(e) => {
            setIcp(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_CHARS}
          aria-label="ICP description"
          aria-describedby="icp-char-count icp-error"
        />
      </div>

      {/* Error */}
      {error && (
        <p id="icp-error" className="text-[11px] text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Footer: char count + submit */}
      <div className="flex items-center justify-between">
        <span
          id="icp-char-count"
          className={`text-[10px] ${
            charCount < MIN_CHARS
              ? "text-gray-600"
              : charCount > MAX_CHARS * 0.9
              ? "text-yellow-500"
              : "text-gray-500"
          }`}
        >
          {charCount}/{MAX_CHARS}
          {charCount > 0 && charCount < MIN_CHARS && (
            <span className="ml-1 text-gray-600">
              ({MIN_CHARS - charCount} more needed)
            </span>
          )}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary text-xs"
          aria-label="Analyze ICP and find accounts"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "🔍 Find Accounts"
          )}
        </button>
      </div>
    </div>
  );
}
