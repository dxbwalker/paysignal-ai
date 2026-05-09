import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { runWorkflowFromDiscovery } from "@/lib/workflow-runner";
import type { BusinessModel, SearchPlan } from "@/types";

const BUSINESS_MODEL_LABELS: Record<BusinessModel, string> = {
  marketplace: "Marketplace",
  platform: "Platform",
  gig_economy: "Gig Economy",
  saas: "SaaS",
  logistics: "Logistics",
  creator_economy: "Creator Economy",
  healthcare_payments: "Healthcare Payments",
  other: "Other",
};

const ALL_BUSINESS_MODELS: BusinessModel[] = [
  "marketplace",
  "platform",
  "gig_economy",
  "saas",
  "logistics",
  "creator_economy",
  "healthcare_payments",
  "other",
];

/**
 * SearchPlanEditor — displays the generated SearchPlan with editable fields.
 * Keywords as removable/addable tags, company types as toggleable checkboxes,
 * geo filters and exclusions as editable lists.
 * Has "Approve" and "Edit" action buttons.
 */
export function SearchPlanEditor() {
  const { state, dispatch, addLog } = useWorkflow();
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newGeo, setNewGeo] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  // Only show when we have a search plan (hide during idle with no plan)
  if (!state.searchPlan) return null;

  const plan = state.searchPlan;
  const isAwaitingApproval = state.currentStage === "awaiting_plan_approval";

  const updatePlan = (updates: Partial<SearchPlan>) => {
    dispatch({
      type: "SET_SEARCH_PLAN",
      plan: { ...plan, ...updates },
    });
  };

  const handleRemoveKeyword = (keyword: string) => {
    updatePlan({ keywords: plan.keywords.filter((k) => k !== keyword) });
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !plan.keywords.includes(trimmed)) {
      updatePlan({ keywords: [...plan.keywords, trimmed] });
      setNewKeyword("");
    }
  };

  const handleToggleCompanyType = (model: BusinessModel) => {
    const current = plan.companyTypes;
    if (current.includes(model)) {
      updatePlan({ companyTypes: current.filter((m) => m !== model) });
    } else {
      updatePlan({ companyTypes: [...current, model] });
    }
  };

  const handleRemoveGeo = (geo: string) => {
    updatePlan({ geographicFilters: plan.geographicFilters.filter((g) => g !== geo) });
  };

  const handleAddGeo = () => {
    const trimmed = newGeo.trim();
    if (trimmed && !plan.geographicFilters.includes(trimmed)) {
      updatePlan({ geographicFilters: [...plan.geographicFilters, trimmed] });
      setNewGeo("");
    }
  };

  const handleRemoveExclusion = (exc: string) => {
    updatePlan({ exclusionCriteria: plan.exclusionCriteria.filter((e) => e !== exc) });
  };

  const handleAddExclusion = () => {
    const trimmed = newExclusion.trim();
    if (trimmed && !plan.exclusionCriteria.includes(trimmed)) {
      updatePlan({ exclusionCriteria: [...plan.exclusionCriteria, trimmed] });
      setNewExclusion("");
    }
  };

  const handleApprove = async () => {
    setIsEditing(false);
    dispatch({ type: "SET_STAGE", stage: "awaiting_plan_approval", status: "completed" });
    addLog("awaiting_plan_approval", "Search plan approved by user. Initiating account discovery.");

    // Run the remaining workflow stages (discover → evidence → enrich → score → personas → briefs → outreach)
    await runWorkflowFromDiscovery({
      icpDescription: state.icpDescription,
      mode: state.mode,
      dispatch,
      addLog,
      suppressionList: state.suppressionList,
    });
  };

  return (
    <div className="p-4 border-t border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Search Plan
        </h3>
        {isAwaitingApproval && (
          <span className="text-[10px] text-yellow-400 animate-pulse">Awaiting approval</span>
        )}
      </div>

      {/* Suggested Narrowing Warning */}
      {plan.suggestedNarrowing && plan.suggestedNarrowing.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
          <p className="text-[10px] text-yellow-400 font-medium mb-1">
            ⚠ Consider narrowing your ICP:
          </p>
          <ul className="text-[10px] text-yellow-300/80 space-y-0.5">
            {plan.suggestedNarrowing.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Keywords */}
      <div>
        <span className="text-[10px] text-gray-500 font-medium">Keywords</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {plan.keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-brand-500/10 border border-brand-500/20 rounded text-brand-300"
            >
              {kw}
              {isEditing && (
                <button
                  onClick={() => handleRemoveKeyword(kw)}
                  className="text-brand-400 hover:text-red-400 ml-0.5"
                  aria-label={`Remove keyword ${kw}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {isEditing && (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                placeholder="Add keyword..."
                className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 w-24 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleAddKeyword}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Company Types */}
      <div>
        <span className="text-[10px] text-gray-500 font-medium">Company Types</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {isEditing ? (
            ALL_BUSINESS_MODELS.map((model) => (
              <button
                key={model}
                onClick={() => handleToggleCompanyType(model)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  plan.companyTypes.includes(model)
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                }`}
              >
                {BUSINESS_MODEL_LABELS[model]}
              </button>
            ))
          ) : (
            plan.companyTypes.map((model) => (
              <span
                key={model}
                className="text-[10px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-400"
              >
                {BUSINESS_MODEL_LABELS[model]}
              </span>
            ))
          )}
          {!isEditing && plan.companyTypes.length === 0 && (
            <span className="text-[10px] text-gray-600 italic">None specified</span>
          )}
        </div>
      </div>

      {/* Geographic Filters */}
      <div>
        <span className="text-[10px] text-gray-500 font-medium">Geography</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {plan.geographicFilters.map((geo) => (
            <span
              key={geo}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300"
            >
              {geo}
              {isEditing && (
                <button
                  onClick={() => handleRemoveGeo(geo)}
                  className="text-gray-400 hover:text-red-400 ml-0.5"
                  aria-label={`Remove geography ${geo}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {plan.geographicFilters.length === 0 && !isEditing && (
            <span className="text-[10px] text-gray-600 italic">Global (no filter)</span>
          )}
          {isEditing && (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={newGeo}
                onChange={(e) => setNewGeo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGeo()}
                placeholder="Add region..."
                className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 w-24 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleAddGeo}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exclusions */}
      <div>
        <span className="text-[10px] text-gray-500 font-medium">Exclusions</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {plan.exclusionCriteria.map((exc) => (
            <span
              key={exc}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400"
            >
              {exc}
              {isEditing && (
                <button
                  onClick={() => handleRemoveExclusion(exc)}
                  className="text-red-400 hover:text-red-300 ml-0.5"
                  aria-label={`Remove exclusion ${exc}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {isEditing && (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddExclusion()}
                placeholder="Add exclusion..."
                className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 w-24 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleAddExclusion}
                className="text-[10px] text-brand-400 hover:text-brand-300"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Persona Targets (read-only display) */}
      {plan.personaTargets.length > 0 && (
        <div>
          <span className="text-[10px] text-gray-500 font-medium">Target Personas</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {plan.personaTargets.map((p) => (
              <span
                key={p}
                className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isAwaitingApproval && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          <button
            onClick={handleApprove}
            className="btn-primary text-[11px] px-3 py-1.5"
          >
            ✓ Approve Plan
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary text-[11px] px-3 py-1.5"
          >
            {isEditing ? "Done Editing" : "✎ Edit"}
          </button>
        </div>
      )}

      {/* Approved indicator */}
      {!isAwaitingApproval && state.currentStage !== "idle" && state.currentStage !== "analyzing_icp" && (
        <div className="pt-2 border-t border-gray-800">
          <span className="text-[10px] text-green-400">✓ Search plan approved</span>
        </div>
      )}
    </div>
  );
}
