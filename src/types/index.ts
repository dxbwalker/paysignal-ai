// ============================================================
// PaySignal AI — Core Type Definitions
// ============================================================

// --- Enums & Unions ---

export type Mode = "demo" | "live";

export type EvidenceType = "observed" | "inferred";

export type ConfidenceLevel = "high" | "medium" | "low";

export type SourceReliability = "high" | "medium" | "low";

export type SourceOrigin = "linkedin" | "web" | "demo" | "manual";

export type BusinessModel =
  | "marketplace"
  | "platform"
  | "gig_economy"
  | "saas"
  | "logistics"
  | "creator_economy"
  | "healthcare_payments"
  | "other";

export type SignalType =
  | "payment_role"
  | "billing_operations"
  | "ap_management"
  | "multi_country"
  | "marketplace_model"
  | "hiring_payment_ops"
  | "recent_funding"
  | "legacy_tools"
  | "manual_reconciliation"
  | "international_expansion"
  | "complex_payouts"
  | "finance_ops_growth"
  | "decision_maker_present"
  | "other";

export type ScoringDimension =
  | "payment_complexity"
  | "operational_urgency"
  | "automation_fit"
  | "buyer_accessibility"
  | "confidence";

export type WorkflowStageName =
  | "idle"
  | "analyzing_icp"
  | "awaiting_plan_approval"
  | "discovering"
  | "collecting_evidence"
  | "enriching"
  | "scoring"
  | "matching_personas"
  | "generating_brief"
  | "generating_outreach"
  | "ready"
  | "feedback"
  | "failed";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "completed"
  | "warning"
  | "failed";

export type RecommendedAction =
  | "generate_outreach"
  | "research_further"
  | "deprioritize";

export type OutcomeType =
  | "copied"
  | "approved"
  | "rejected"
  | "contacted"
  | "replied"
  | "booked_meeting"
  | "not_relevant"
  | "bounced"
  | "no_response"
  | "do_not_contact";

export type RejectionReason =
  | "wrong_icp"
  | "weak_evidence"
  | "wrong_geography"
  | "too_small"
  | "wrong_persona"
  | "not_payment_heavy"
  | "already_contacted";

export type AccountStatus =
  | "discovered"
  | "evidence_collected"
  | "enriched"
  | "scored"
  | "outreach_ready"
  | "deprioritized";

// --- Core Entities ---

export interface EvidenceCard {
  id: string;
  signalType: SignalType;
  evidenceType: EvidenceType;
  rawEvidence: string; // max 500 chars
  sourceLabel: string;
  sourceUrl?: string;
  sourceOrigin: SourceOrigin;
  sourceReliability: SourceReliability;
  inferenceExplanation?: string;
  confidenceLevel: ConfidenceLevel;
  whyItMatters: string;
  suggestedOutreachAngle: string;
  dimension: ScoringDimension;
  claimEvidenceIds?: string[]; // outreach traceability: IDs of claims referencing this evidence
}

export interface DimensionScore {
  name: ScoringDimension;
  weight: number; // 0.30, 0.20, 0.20, 0.15, 0.15
  subScore: number; // 0-100
  contributingSignals: string[]; // evidence card IDs
}

export interface OpportunityScore {
  total: number; // 0-100
  dimensions: DimensionScore[];
  topFactors: string[]; // top 3 that increased score
  missingFactors: string[]; // up to 3 that reduced confidence
  recommendedAction: RecommendedAction;
  deprioritizeReason?: string;
}

export interface BuyerPersona {
  id: string;
  name: string;
  title: string;
  relevanceExplanation: string; // 1-3 sentences
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  relevanceRank: number; // 1 = most relevant
}

export interface OutreachPack {
  accountId: string;
  whyThisAccountWhyNow: string; // max 100 words
  email: {
    subject: string; // max 60 chars
    body: string; // max 150 words
  };
  linkedinMessage: string; // max 50 words
  callOpener: {
    talkingPoints: string[]; // 2-3 items
  };
  followUp: string; // max 100 words
  discoveryQuestions: string[]; // 3 items
  generatedAt: string; // ISO date
  generationMethod: "llm" | "template";
  claimEvidenceIds: string[]; // Evidence_Card IDs referenced
}

export interface BriefEvidence {
  claim: string;
  evidenceType: EvidenceType | "hypothesis";
  source: string;
  confidenceLevel: ConfidenceLevel;
  evidenceCardId?: string;
}

export interface AccountOpportunityBrief {
  accountId: string;
  companySummary: string; // max 150 words
  paymentComplexityHypothesis: string;
  supportingEvidence: BriefEvidence[];
  likelyPainPoints: string[]; // 2-5 items
  recommendedPersonas: string[]; // persona IDs
  suggestedOutreachAngle: string;
  discoveryQuestions: string[]; // 3 items
  lowEvidenceWarning?: string;
}

export interface Account {
  id: string;
  name: string;
  website?: string;
  location: string;
  linkedinUrl?: string;
  businessModel: BusinessModel;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  personas: BuyerPersona[];
  evidenceCards: EvidenceCard[];
  opportunityScore?: OpportunityScore;
  opportunityBrief?: AccountOpportunityBrief;
  outreachPack?: OutreachPack;
  status: AccountStatus;
  confidencePenalty: boolean;
  possibleDuplicate?: string; // ID of potential duplicate
  deprioritizeReason?: string;
  lowEvidenceWarning?: boolean;
  campaignOutcome?: CampaignOutcome;
  suppressedAt?: string; // ISO date if suppressed
}

// --- Search & Campaign ---

export interface SearchPlan {
  keywords: string[];
  companyTypes: BusinessModel[];
  geographicFilters: string[];
  personaTargets: string[];
  exclusionCriteria: string[];
  suggestedNarrowing?: string[];
}

export interface CampaignOutcome {
  accountId: string;
  outcome: OutcomeType;
  channel?: "email" | "linkedin" | "call" | "other";
  rejectionReason?: RejectionReason;
  markedAt: string; // ISO date
}

export interface CampaignFeedback {
  totalDiscovered: number;
  engagedByChannel: Record<"email" | "linkedin" | "call" | "other", number>;
  outcomeBreakdown: Partial<Record<OutcomeType, number>>;
  topSignals: string[]; // top 3 associated with positive outcomes
  bottomSignals: string[]; // bottom 3 associated with negative outcomes
  icpRefinements: string[];
  recommendedKeywords: string[];
  recommendedExclusions: string[];
  isBaseline: boolean; // true when <5 response outcomes
  generatedAt: string;
}

// --- Workflow State ---

export interface WorkflowStage {
  name: WorkflowStageName;
  status: WorkflowStatus;
  startedAt?: string;
  completedAt?: string;
  fallbackActive?: boolean;
  fallbackReason?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  stage: WorkflowStageName;
  message: string; // max 280 chars
}

export interface WorkflowState {
  mode: Mode;
  stages: WorkflowStage[];
  currentStage: WorkflowStageName;
  activityLog: ActivityLogEntry[];
  accounts: Account[];
  searchPlan?: SearchPlan;
  icpDescription: string;
  suppressionList: string[]; // account/persona IDs
  campaignFeedback?: CampaignFeedback;
  timeBudgetStartMs?: number;
  selectedAccountId?: string;
  campaignId?: string;
  persistenceStatus: "none" | "saving" | "saved" | "failed";
  presentationMode: boolean;
}

// --- Provider Capability ---

export interface ProviderCapability {
  discovery: "live" | "demo" | "cached" | "unavailable";
  enrichment: "live" | "demo" | "cached" | "unavailable";
  scoring: "live" | "rule_based";
  generation: "llm" | "template";
}

// --- API Request/Response Types ---

export interface AnalyzeIcpRequest {
  icpDescription: string;
}

export interface AnalyzeIcpResponse {
  searchPlan: SearchPlan;
  rationale: string;
}

export interface DiscoverAccountsRequest {
  searchPlan: SearchPlan;
}

export interface DiscoverAccountsResponse {
  accounts: Account[];
  logEntry: string;
  mode: Mode;
}

export interface CollectEvidenceRequest {
  accounts: Account[];
}

export interface CollectEvidenceResponse {
  accounts: Account[];
  logEntry: string;
}

export interface EnrichWebRequest {
  accounts: Account[];
  limit: number;
}

export interface EnrichWebResponse {
  accounts: Account[];
  logEntry: string;
}

export interface ScoreAccountsRequest {
  accounts: Account[];
  icpDescription: string;
}

export interface ScoreAccountsResponse {
  accounts: Account[];
  logEntry: string;
}

export interface MatchPersonasRequest {
  accounts: Account[];
}

export interface MatchPersonasResponse {
  accounts: Account[];
  logEntry: string;
}

export interface GenerateOutreachRequest {
  account: Account;
}

export interface GenerateOutreachResponse {
  outreachPack: OutreachPack;
}

export interface GenerateBriefRequest {
  account: Account;
}

export interface GenerateBriefResponse {
  brief: AccountOpportunityBrief;
}
