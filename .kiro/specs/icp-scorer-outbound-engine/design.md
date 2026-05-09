# Technical Design — PaySignal AI

## Architecture Overview

PaySignal AI is a Next.js application deployed to Vercel with server-side API routes handling all external API calls. The frontend is a single-page three-panel dashboard. All state is managed client-side with browser local storage for caching. No database is required for the hackathon MVP.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                                 │
│                                                                          │
│  ┌──────────┐   ┌──────────────────┐   ┌─────────────────────────────┐  │
│  │ Left     │   │ Center           │   │ Right                       │  │
│  │ Panel    │   │ Panel            │   │ Panel                       │  │
│  │          │   │                  │   │                             │  │
│  │ ICP Input│   │ Ranked Accounts  │   │ Account Detail:             │  │
│  │ Search   │   │ Score Breakdown  │   │  - Score Breakdown          │  │
│  │ Plan     │   │ Status Badges    │   │  - Evidence Cards           │  │
│  │ Mode     │   │                  │   │  - Buyer Personas           │  │
│  │ Toggle   │   │                  │   │  - Opportunity Brief        │  │
│  │          │   │                  │   │  - Outreach Pack            │  │
│  └──────────┘   └──────────────────┘   └─────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Bottom Panel: Agent Activity Log                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Local Storage: cached accounts, evidence, scores, outreach packs        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ fetch()
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS (API Routes)                         │
│                                                                          │
│  /api/analyze-icp        → ICP_Analyzer (rule-based or LLM)             │
│  /api/discover-accounts  → Account_Discoverer (Apify or Demo_Mode)      │
│  /api/collect-evidence   → Evidence_Collector (from LinkedIn data)       │
│  /api/enrich-web         → Signal_Enrichment_Agent (web search or Demo) │
│  /api/score-accounts     → Opportunity_Scorer (rule-based or LLM)       │
│  /api/match-personas     → Persona_Matcher                              │
│  /api/generate-outreach  → Outreach_Pack_Generator (template or LLM)    │
│  /api/generate-brief     → Account_Opportunity_Brief generator          │
│                                                                          │
│  All API keys accessed server-side only via process.env                   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────────┐
              │ Apify    │  │ Web      │  │ LLM Provider │
              │ LinkedIn │  │ Search   │  │ (optional)   │
              │ Scraper  │  │ API      │  │              │
              └──────────┘  └──────────┘  └──────────────┘
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (Pages Router) | Vercel-native, serverless API routes, fast build |
| UI | React 18 + Tailwind CSS | Rapid styling, dark theme, responsive panels |
| State | React Context + useReducer | Lightweight, no external deps, workflow state machine |
| Caching | Browser localStorage | Demo reliability, no DB needed |
| API Layer | Next.js API Routes (serverless) | Keys stay server-side, Vercel auto-scales |
| Data Source | Apify REST API | LinkedIn lead scraping, pay-per-use |
| Web Search | Web search API (optional) | Evidence enrichment beyond LinkedIn |
| LLM | Any provider via LLM_API_KEY (optional) | Scoring + outreach personalization |
| Deployment | Vercel | Zero-config Next.js deploy, env vars in dashboard |

## Data Models

### Account

```typescript
interface Account {
  id: string;                          // generated UUID
  name: string;                        // company name
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
  confidencePenalty: boolean;          // flagged by Signal_Enrichment_Agent
  possibleDuplicate?: string;          // ID of potential duplicate account
  campaignOutcome?: CampaignOutcome;
  suppressedAt?: string;               // ISO date if suppressed
}

type BusinessModel =
  | "marketplace"
  | "platform"
  | "gig_economy"
  | "saas"
  | "logistics"
  | "creator_economy"
  | "healthcare_payments"
  | "other";

type AccountStatus =
  | "discovered"
  | "evidence_collected"
  | "enriched"
  | "scored"
  | "outreach_ready"
  | "deprioritized";
```

### EvidenceCard

```typescript
interface EvidenceCard {
  id: string;
  signalType: SignalType;
  evidenceType: "observed" | "inferred";
  rawEvidence: string;                  // max 500 chars
  source: string;                       // URL or "LinkedIn profile"
  sourceReliability: "high" | "medium" | "low";
  inferenceExplanation?: string;
  confidenceLevel: "high" | "medium" | "low";
  whyItMatters: string;
  suggestedOutreachAngle: string;
  dimension: ScoringDimension;          // which scoring dimension this feeds
}

type SignalType =
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

type ScoringDimension =
  | "payment_complexity"
  | "operational_urgency"
  | "automation_fit"
  | "buyer_accessibility"
  | "confidence";
```

### OpportunityScore

```typescript
interface OpportunityScore {
  total: number;                        // 0-100
  dimensions: DimensionScore[];
  topFactors: string[];                 // top 3 that increased score
  missingFactors: string[];             // up to 3 that reduced confidence
  recommendedAction: "generate_outreach" | "research_further" | "deprioritize";
  deprioritizeReason?: string;          // why not this account
}

interface DimensionScore {
  name: ScoringDimension;
  weight: number;                       // 0.30, 0.20, 0.20, 0.15, 0.15
  subScore: number;                     // 0-100
  contributingSignals: string[];        // evidence card IDs
}
```

### BuyerPersona

```typescript
interface BuyerPersona {
  id: string;
  name: string;
  title: string;
  relevanceExplanation: string;         // 1-3 sentences
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  relevanceRank: number;                // 1 = most relevant
}
```

### OutreachPack

```typescript
interface OutreachPack {
  accountId: string;
  whyThisAccountWhyNow: string;        // max 100 words
  email: {
    subject: string;                    // max 60 chars
    body: string;                       // max 150 words
  };
  linkedinMessage: string;              // max 50 words
  callOpener: {
    talkingPoints: string[];            // 2-3 items
  };
  followUp: string;                     // max 100 words
  discoveryQuestions: string[];          // 3 items
  generatedAt: string;                  // ISO date
  generationMethod: "llm" | "template";
}
```

### AccountOpportunityBrief

```typescript
interface AccountOpportunityBrief {
  accountId: string;
  companySummary: string;               // max 150 words
  paymentComplexityHypothesis: string;
  supportingEvidence: BriefEvidence[];
  likelyPainPoints: string[];           // 2-5 items
  recommendedPersonas: string[];        // persona IDs
  suggestedOutreachAngle: string;
  discoveryQuestions: string[];          // 3 items
  lowEvidenceWarning?: string;
}

interface BriefEvidence {
  claim: string;
  evidenceType: "observed" | "inferred" | "hypothesis";
  source: string;
  confidenceLevel: "high" | "medium" | "low";
}
```

### SearchPlan

```typescript
interface SearchPlan {
  keywords: string[];
  companyTypes: BusinessModel[];
  geographicFilters: string[];
  personaTargets: string[];
  exclusionCriteria: string[];
  suggestedNarrowing?: string[];        // if ICP lacks dimensions
}
```

### CampaignOutcome

```typescript
interface CampaignOutcome {
  accountId: string;
  outcome: OutcomeType;
  channel?: "email" | "linkedin" | "call" | "other";
  rejectionReason?: RejectionReason;
  markedAt: string;                     // ISO date
}

type OutcomeType =
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

type RejectionReason =
  | "wrong_icp"
  | "weak_evidence"
  | "wrong_geography"
  | "too_small"
  | "wrong_persona"
  | "not_payment_heavy"
  | "already_contacted";
```

### WorkflowState

```typescript
interface WorkflowState {
  mode: "live" | "demo";
  stages: WorkflowStage[];
  activityLog: ActivityLogEntry[];
  accounts: Account[];
  searchPlan?: SearchPlan;
  icpDescription: string;
  suppressionList: string[];            // account/persona IDs
  campaignFeedback?: CampaignFeedback;
  timeBudgetStartMs?: number;           // for 90s demo enforcement
}

interface WorkflowStage {
  name: string;
  status: "pending" | "running" | "completed" | "warning" | "failed";
  startedAt?: string;
  completedAt?: string;
  fallbackActive?: boolean;
  fallbackReason?: string;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  stage: string;
  message: string;                      // max 280 chars
}
```

## API Route Design

### POST /api/analyze-icp

**Input:** `{ icpDescription: string }`
**Output:** `{ searchPlan: SearchPlan, rationale: string }`
**Fallback:** Rule-based keyword extraction (no LLM needed)

### POST /api/discover-accounts

**Input:** `{ searchPlan: SearchPlan }`
**Output:** `{ accounts: Account[], logEntry: string }`
**Fallback:** Returns demo seed accounts with "Demo dataset" flag

### POST /api/collect-evidence

**Input:** `{ accounts: Account[] }`
**Output:** `{ accounts: Account[] }` (with evidenceCards populated)
**Fallback:** Always works (rule-based signal detection from metadata)

### POST /api/enrich-web

**Input:** `{ accounts: Account[], limit: number }`
**Output:** `{ accounts: Account[] }` (with additional evidenceCards)
**Fallback:** Returns demo enrichment data

### POST /api/score-accounts

**Input:** `{ accounts: Account[], icpDescription: string }`
**Output:** `{ accounts: Account[] }` (with opportunityScore populated)
**Fallback:** Rule-based scoring with predefined weights

### POST /api/match-personas

**Input:** `{ accounts: Account[] }`
**Output:** `{ accounts: Account[] }` (with personas ranked)
**Fallback:** Always works (title-based matching)

### POST /api/generate-outreach

**Input:** `{ account: Account }`
**Output:** `{ outreachPack: OutreachPack }`
**Fallback:** Template-based generation

### POST /api/generate-brief

**Input:** `{ account: Account }`
**Output:** `{ brief: AccountOpportunityBrief }`
**Fallback:** Template-based generation

## Component Architecture (Frontend)

```
src/
├── pages/
│   ├── index.tsx                    # Main dashboard (single page)
│   ├── _app.tsx                     # App wrapper with providers
│   └── api/
│       ├── analyze-icp.ts
│       ├── discover-accounts.ts
│       ├── collect-evidence.ts
│       ├── enrich-web.ts
│       ├── score-accounts.ts
│       ├── match-personas.ts
│       ├── generate-outreach.ts
│       └── generate-brief.ts
├── components/
│   ├── layout/
│   │   ├── ThreePanelLayout.tsx     # Main grid layout
│   │   └── BottomPanel.tsx          # Agent activity log
│   ├── left-panel/
│   │   ├── ICPInput.tsx             # ICP textarea + submit
│   │   ├── SearchPlanEditor.tsx     # Editable search plan
│   │   └── ModeToggle.tsx           # Live/Demo switch
│   ├── center-panel/
│   │   ├── AccountList.tsx          # Ranked account cards
│   │   ├── AccountCard.tsx          # Single account with score
│   │   └── WorkflowProgress.tsx     # Stage status indicators
│   ├── right-panel/
│   │   ├── AccountDetail.tsx        # Full account intelligence
│   │   ├── ScoreBreakdown.tsx       # 5-dimension visual
│   │   ├── EvidenceCardList.tsx     # Evidence cards display
│   │   ├── PersonaList.tsx          # Buyer personas
│   │   ├── OpportunityBrief.tsx     # One-page brief
│   │   ├── OutreachPackView.tsx     # Multi-channel outreach
│   │   └── CampaignActions.tsx      # Outcome marking, reject
│   └── shared/
│       ├── ScoreBadge.tsx           # Color-coded score
│       ├── ConfidenceIndicator.tsx
│       ├── DemoModeBadge.tsx
│       └── ComplianceNotice.tsx
├── context/
│   └── WorkflowContext.tsx          # useReducer state machine
├── lib/
│   ├── scoring.ts                   # Rule-based scoring engine
│   ├── evidence-collector.ts        # Signal detection logic
│   ├── persona-matcher.ts           # Title-based matching
│   ├── outreach-templates.ts        # Template-based generation
│   ├── brief-templates.ts           # Brief generation templates
│   ├── icp-parser.ts               # Rule-based ICP extraction
│   ├── cache.ts                     # localStorage wrapper
│   └── demo-data.ts                # 5 seed accounts with full data
├── types/
│   └── index.ts                     # All TypeScript interfaces
└── styles/
    └── globals.css                  # Tailwind + dark theme
```

## Workflow State Machine

```
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
                         │ submit ICP
                         ▼
                ┌────────────────┐
                │ ANALYZING_ICP  │
                └───────┬────────┘
                        │ search plan ready
                        ▼
              ┌──────────────────────┐
              │ AWAITING_PLAN_APPROVAL│
              └──────────┬───────────┘
                         │ user approves/edits
                         ▼
              ┌──────────────────────┐
              │ DISCOVERING_ACCOUNTS │──── timeout/error → DEMO_MODE
              └──────────┬───────────┘
                         │ accounts found
                         ▼
             ┌───────────────────────┐
             │ COLLECTING_EVIDENCE   │
             └──────────┬────────────┘
                        │ evidence attached
                        ▼
             ┌───────────────────────┐
             │ ENRICHING_WEB        │──── timeout/error → skip/demo
             └──────────┬────────────┘
                        │ enrichment done
                        ▼
             ┌───────────────────────┐
             │ SCORING_ACCOUNTS     │
             └──────────┬────────────┘
                        │ scores assigned
                        ▼
             ┌───────────────────────┐
             │ MATCHING_PERSONAS    │
             └──────────┬────────────┘
                        │ personas matched
                        ▼
                ┌────────────────┐
                │   COMPLETE     │
                └────────────────┘
                        │ user selects account
                        ▼
             ┌───────────────────────┐
             │ GENERATING_OUTREACH  │ (on-demand per account)
             └───────────────────────┘
```

## Scoring Algorithm (Rule-Based)

```typescript
function calculateOpportunityScore(account: Account): OpportunityScore {
  const dimensions: DimensionScore[] = [
    scoreDimension("payment_complexity", 0.30, account),
    scoreDimension("operational_urgency", 0.20, account),
    scoreDimension("automation_fit", 0.20, account),
    scoreDimension("buyer_accessibility", 0.15, account),
    scoreDimension("confidence", 0.15, account),
  ];

  // Apply confidence penalty if flagged by enrichment
  if (account.confidencePenalty) {
    const confDim = dimensions.find(d => d.name === "confidence");
    if (confDim) confDim.subScore = Math.max(0, confDim.subScore - 20);
  }

  // Apply inferred evidence penalty
  const inferredRatio = account.evidenceCards.filter(
    e => e.evidenceType === "inferred"
  ).length / Math.max(1, account.evidenceCards.length);

  if (inferredRatio > 0.5) {
    const confDim = dimensions.find(d => d.name === "confidence");
    if (confDim) confDim.subScore = Math.floor(confDim.subScore / 2);
  }

  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.subScore * d.weight, 0)
  );

  return {
    total,
    dimensions,
    topFactors: getTopFactors(dimensions, 3),
    missingFactors: getMissingFactors(dimensions, 3),
    recommendedAction: total >= 60 ? "generate_outreach"
                     : total >= 40 ? "research_further"
                     : "deprioritize",
    deprioritizeReason: total < 40 ? getDeprioritizeReason(dimensions) : undefined,
  };
}
```

## Demo Mode Seed Data Strategy

5 accounts representing different verticals and score ranges:

| # | Company | Model | Score | Purpose |
|---|---------|-------|-------|---------|
| 1 | MarketFlow | Marketplace | 88 | High-score showcase, full evidence |
| 2 | GigConnect | Gig Economy | 76 | Medium-high, cross-border complexity |
| 3 | CloudScale | SaaS | 65 | Borderline, shows "generate outreach" threshold |
| 4 | FreightPay | Logistics | 48 | "Research further" example |
| 5 | TinyBooks | Other | 32 | Deprioritized, shows "why not" explanation |

Each seed account has:
- 3-5 Evidence_Cards with distinct signal types
- Full 5-dimension score breakdown
- 1-2 Buyer_Personas with relevance explanations
- Complete Account_Opportunity_Brief
- Generated Outreach_Pack (for scores ≥ 60)

## Deployment Configuration

### Vercel Environment Variables

```
APIFY_API_KEY=apify_api_...          # Required for Live_Mode discovery
LLM_API_KEY=sk-...                   # Optional, enables AI scoring/generation
LLM_PROVIDER=openai|anthropic        # Optional, defaults to openai
WEB_SEARCH_API_KEY=...               # Optional, enables web enrichment
```

### Build & Deploy

```bash
# Local development
npm run dev

# Production build (must pass with zero errors)
npm run build

# Deploy to Vercel
vercel --prod
```

### Vercel Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "functions": {
    "src/pages/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

## Security Considerations

- All API keys accessed only in `/api/` routes (server-side)
- No secrets in client bundle (verified by Next.js — only `NEXT_PUBLIC_*` vars are exposed)
- Web-scraped content treated as untrusted input
- No autonomous outreach sending — copy-only default
- localStorage cleared on user request
- No PII logged in activity log entries

## Performance Targets

| Metric | Target |
|--------|--------|
| Demo workflow (5 accounts) | < 90 seconds |
| Single API route response | < 30 seconds |
| Evidence collection per account | < 10 seconds |
| Outreach pack generation | < 30 seconds |
| Initial page load | < 3 seconds |
| Build time | < 60 seconds |
