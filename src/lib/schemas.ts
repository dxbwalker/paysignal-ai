/**
 * Zod validation schemas for all core entities and API payloads.
 * Used for runtime validation of API responses before updating workflow state.
 */

import { z } from "zod";

// --- Helpers ---

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// --- Enum Schemas ---

export const ModeSchema = z.enum(["demo", "live"]);

export const EvidenceTypeSchema = z.enum(["observed", "inferred"]);

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const SourceReliabilitySchema = z.enum(["high", "medium", "low"]);

export const SourceOriginSchema = z.enum(["linkedin", "web", "demo", "manual"]);

export const BusinessModelSchema = z.enum([
  "marketplace",
  "platform",
  "gig_economy",
  "saas",
  "logistics",
  "creator_economy",
  "healthcare_payments",
  "other",
]);

export const SignalTypeSchema = z.enum([
  "payment_role",
  "billing_operations",
  "ap_management",
  "multi_country",
  "marketplace_model",
  "hiring_payment_ops",
  "recent_funding",
  "legacy_tools",
  "manual_reconciliation",
  "international_expansion",
  "complex_payouts",
  "finance_ops_growth",
  "decision_maker_present",
  "other",
]);

export const ScoringDimensionSchema = z.enum([
  "payment_complexity",
  "operational_urgency",
  "automation_fit",
  "buyer_accessibility",
  "confidence",
]);

export const WorkflowStageNameSchema = z.enum([
  "idle",
  "analyzing_icp",
  "awaiting_plan_approval",
  "discovering",
  "collecting_evidence",
  "enriching",
  "scoring",
  "matching_personas",
  "generating_brief",
  "generating_outreach",
  "ready",
  "feedback",
  "failed",
]);

export const WorkflowStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "warning",
  "failed",
]);

export const RecommendedActionSchema = z.enum([
  "generate_outreach",
  "research_further",
  "deprioritize",
]);

export const OutcomeTypeSchema = z.enum([
  "copied",
  "approved",
  "rejected",
  "contacted",
  "replied",
  "booked_meeting",
  "not_relevant",
  "bounced",
  "no_response",
  "do_not_contact",
]);

export const RejectionReasonSchema = z.enum([
  "wrong_icp",
  "weak_evidence",
  "wrong_geography",
  "too_small",
  "wrong_persona",
  "not_payment_heavy",
  "already_contacted",
]);

export const AccountStatusSchema = z.enum([
  "discovered",
  "evidence_collected",
  "enriched",
  "scored",
  "outreach_ready",
  "deprioritized",
]);

// --- Core Entity Schemas ---

export const EvidenceCardSchema = z.object({
  id: z.string().min(1),
  signalType: SignalTypeSchema,
  evidenceType: EvidenceTypeSchema,
  rawEvidence: z.string().max(500),
  sourceLabel: z.string().min(1),
  sourceUrl: z.string().optional(),
  sourceOrigin: SourceOriginSchema,
  sourceReliability: SourceReliabilitySchema,
  inferenceExplanation: z.string().optional(),
  confidenceLevel: ConfidenceLevelSchema,
  whyItMatters: z.string().min(1),
  suggestedOutreachAngle: z.string().min(1),
  dimension: ScoringDimensionSchema,
  claimEvidenceIds: z.array(z.string()).optional(),
});

export const DimensionScoreSchema = z.object({
  name: ScoringDimensionSchema,
  weight: z.number().min(0).max(1),
  subScore: z.number().min(0).max(100),
  contributingSignals: z.array(z.string()),
});

export const OpportunityScoreSchema = z.object({
  total: z.number().min(0).max(100),
  dimensions: z.array(DimensionScoreSchema).length(5),
  topFactors: z.array(z.string()).max(3),
  missingFactors: z.array(z.string()).max(3),
  recommendedAction: RecommendedActionSchema,
  deprioritizeReason: z.string().optional(),
});

export const BuyerPersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  relevanceExplanation: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  relevanceRank: z.number().int().min(1),
});

export const OutreachPackSchema = z.object({
  accountId: z.string().min(1),
  whyThisAccountWhyNow: z.string().min(1).refine((v) => wordCount(v) <= 100, "Max 100 words"),
  email: z.object({
    subject: z.string().max(60),
    body: z.string().min(1).refine((v) => wordCount(v) <= 150, "Max 150 words"),
  }),
  linkedinMessage: z.string().min(1).refine((v) => wordCount(v) <= 50, "Max 50 words"),
  callOpener: z.object({
    talkingPoints: z.array(z.string()).min(2).max(3),
  }),
  followUp: z.string().min(1).refine((v) => wordCount(v) <= 100, "Max 100 words"),
  discoveryQuestions: z.array(z.string()).length(3),
  generatedAt: z.string(),
  generationMethod: z.enum(["llm", "template"]),
  claimEvidenceIds: z.array(z.string()),
});

export const BriefEvidenceSchema = z.object({
  claim: z.string().min(1),
  evidenceType: z.enum(["observed", "inferred", "hypothesis"]),
  source: z.string().min(1),
  confidenceLevel: ConfidenceLevelSchema,
  evidenceCardId: z.string().optional(),
});

export const AccountOpportunityBriefSchema = z.object({
  accountId: z.string().min(1),
  companySummary: z.string().min(1).refine((v) => wordCount(v) <= 150, "Max 150 words"),
  paymentComplexityHypothesis: z.string().min(1),
  supportingEvidence: z.array(BriefEvidenceSchema).min(1),
  likelyPainPoints: z.array(z.string()).min(2).max(5),
  recommendedPersonas: z.array(z.string()),
  suggestedOutreachAngle: z.string().min(1),
  discoveryQuestions: z.array(z.string()).length(3),
  lowEvidenceWarning: z.string().optional(),
});

export const SearchPlanSchema = z.object({
  keywords: z.array(z.string()).min(1),
  companyTypes: z.array(BusinessModelSchema),
  geographicFilters: z.array(z.string()),
  personaTargets: z.array(z.string()),
  exclusionCriteria: z.array(z.string()),
  suggestedNarrowing: z.array(z.string()).optional(),
});

export const CampaignOutcomeSchema = z.object({
  accountId: z.string().min(1),
  outcome: OutcomeTypeSchema,
  channel: z.enum(["email", "linkedin", "call", "other"]).optional(),
  rejectionReason: RejectionReasonSchema.optional(),
  markedAt: z.string(),
});

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  website: z.string().optional(),
  location: z.string(),
  linkedinUrl: z.string().optional(),
  businessModel: BusinessModelSchema,
  industry: z.string().optional(),
  employeeCount: z.number().optional(),
  fundingStage: z.string().optional(),
  personas: z.array(BuyerPersonaSchema),
  evidenceCards: z.array(EvidenceCardSchema),
  opportunityScore: OpportunityScoreSchema.optional(),
  opportunityBrief: AccountOpportunityBriefSchema.optional(),
  outreachPack: OutreachPackSchema.optional(),
  status: AccountStatusSchema,
  confidencePenalty: z.boolean(),
  possibleDuplicate: z.string().optional(),
  deprioritizeReason: z.string().optional(),
  lowEvidenceWarning: z.boolean().optional(),
  campaignOutcome: CampaignOutcomeSchema.optional(),
  suppressedAt: z.string().optional(),
});

export const CampaignFeedbackSchema = z.object({
  totalDiscovered: z.number(),
  engagedByChannel: z.record(z.string(), z.number()),
  outcomeBreakdown: z.record(OutcomeTypeSchema, z.number()),
  topSignals: z.array(z.string()),
  bottomSignals: z.array(z.string()),
  icpRefinements: z.array(z.string()),
  recommendedKeywords: z.array(z.string()),
  recommendedExclusions: z.array(z.string()),
  isBaseline: z.boolean(),
  generatedAt: z.string(),
});

// --- Workflow Schemas ---

export const WorkflowStageSchema = z.object({
  name: WorkflowStageNameSchema,
  status: WorkflowStatusSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  fallbackActive: z.boolean().optional(),
  fallbackReason: z.string().optional(),
});

export const ActivityLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  stage: WorkflowStageNameSchema,
  message: z.string().max(280),
});

export const WorkflowStateSchema = z.object({
  mode: ModeSchema,
  stages: z.array(WorkflowStageSchema),
  currentStage: WorkflowStageNameSchema,
  activityLog: z.array(ActivityLogEntrySchema),
  accounts: z.array(AccountSchema),
  searchPlan: SearchPlanSchema.optional(),
  icpDescription: z.string(),
  suppressionList: z.array(z.string()),
  campaignFeedback: CampaignFeedbackSchema.optional(),
  timeBudgetStartMs: z.number().optional(),
  selectedAccountId: z.string().optional(),
});

// --- Provider Capability Schema ---

export const ProviderCapabilitySchema = z.object({
  discovery: z.enum(["live", "demo", "cached", "unavailable"]),
  enrichment: z.enum(["live", "demo", "cached", "unavailable"]),
  scoring: z.enum(["live", "rule_based"]),
  generation: z.enum(["llm", "template"]),
});

// --- API Request/Response Schemas ---

export const AnalyzeIcpRequestSchema = z.object({
  icpDescription: z.string().min(20).max(2000),
});

export const AnalyzeIcpResponseSchema = z.object({
  searchPlan: SearchPlanSchema,
  rationale: z.string().min(1),
});

export const DiscoverAccountsRequestSchema = z.object({
  searchPlan: SearchPlanSchema,
});

export const DiscoverAccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  logEntry: z.string(),
  mode: ModeSchema,
});

export const CollectEvidenceRequestSchema = z.object({
  accounts: z.array(AccountSchema),
});

export const CollectEvidenceResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  logEntry: z.string(),
});

export const EnrichWebRequestSchema = z.object({
  accounts: z.array(AccountSchema),
  limit: z.number().int().min(1),
});

export const EnrichWebResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  logEntry: z.string(),
});

export const ScoreAccountsRequestSchema = z.object({
  accounts: z.array(AccountSchema),
  icpDescription: z.string(),
});

export const ScoreAccountsResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  logEntry: z.string(),
});

export const MatchPersonasRequestSchema = z.object({
  accounts: z.array(AccountSchema),
});

export const MatchPersonasResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  logEntry: z.string(),
});

export const GenerateOutreachRequestSchema = z.object({
  account: AccountSchema,
});

export const GenerateOutreachResponseSchema = z.object({
  outreachPack: OutreachPackSchema,
});

export const GenerateBriefRequestSchema = z.object({
  account: AccountSchema,
});

export const GenerateBriefResponseSchema = z.object({
  brief: AccountOpportunityBriefSchema,
});
