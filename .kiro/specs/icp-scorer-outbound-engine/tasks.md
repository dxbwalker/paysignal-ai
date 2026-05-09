# Implementation Tasks — PaySignal AI

## Phase 1 — Demo Foundation

### Task 1: Project Foundation & Types
- [x] 1. Define all TypeScript interfaces in `src/types/index.ts`: Account, EvidenceCard, OpportunityScore, BuyerPersona, OutreachPack, AccountOpportunityBrief, SearchPlan, CampaignOutcome, WorkflowState, ActivityLogEntry, CampaignFeedback. Ensure Account includes: `possibleDuplicate?: string`, `deprioritizeReason?: string`, `lowEvidenceWarning?: boolean`. Ensure EvidenceCard includes: `id: string`, `dimension: ScoringDimension`, `sourceLabel: string`, `sourceUrl?: string`, `sourceOrigin: 'linkedin' | 'web' | 'demo' | 'manual'`, `claimEvidenceIds?: string[]` (for outreach traceability)
- [x] 2. Define all enums/unions: Mode (`demo` | `live`), EvidenceType (`observed` | `inferred`), ConfidenceLevel, SourceReliability, BusinessModel, SignalType, ScoringDimension, WorkflowStageName, WorkflowStatus, RecommendedAction, OutcomeType, RejectionReason, SourceOrigin
- [x] 3. Set up Tailwind dark theme configuration in `tailwind.config.js` and `globals.css`
- [x] 4. Create `src/lib/cache.ts` — SSR-safe localStorage wrapper (only accesses `window.localStorage` in browser, no-ops on server)
- [x] 5. Create `src/lib/env.ts` — safe server-side environment loader with Demo_Mode defaults when keys are missing
- [x] 6. Update `package.json` dependencies (add `zod`) and verify `next build` passes with zero errors
- [x] 7. Configure API routes to fail fast within 30 seconds and fall back rather than relying on long timeouts

**Requirements:** 13.1, 13.3, 13.5, 13.6

---

### Task 2: Schemas, Providers & Runtime Guards
- [x] 1. Create `src/lib/schemas.ts` — Zod validation schemas for all core entities (Account, EvidenceCard, SearchPlan, OutreachPack, AccountOpportunityBrief) and API request/response payloads
- [x] 2. Create `src/lib/providers/demo.ts` — demo provider returning seed data for discovery, enrichment, scoring, and outreach
- [x] 3. Create `src/lib/providers/apify.ts` — Apify adapter that normalizes API responses into internal Account/BuyerPersona types
- [x] 4. Create `src/lib/providers/web-search.ts` — web search adapter returning normalized EvidenceCards
- [x] 5. Create `src/lib/providers/llm.ts` — LLM adapter for scoring and generation, returns internal types only
- [x] 6. Create `src/lib/providers/index.ts` — provider factory that selects demo/live provider based on env config and mode; returns a capability matrix indicating which capabilities are live, demo, cached, or unavailable
- [x] 7. Add server-side guard: verify no `NEXT_PUBLIC_*` variable is used for secrets; all provider calls only from `/api/` routes
- [x] 8. Add seed-data validation script: verify all demo accounts include evidence cards (with IDs), scores, personas, briefs (for ≥60), and outreach packs (for ≥60)

**Requirements:** 13.3, 13.4, 13.5, 12.5

---

### Task 3: Demo Seed Data
- [x] 1. Create `src/lib/demo-data.ts` with 5 seed accounts: MarketFlow (marketplace, score 88), GigConnect (gig economy, score 76), CloudScale (SaaS, score 65), FreightPay (logistics, score 48), TinyBooks (other, score 32)
- [x] 2. Each account: 3-5 Evidence_Cards with distinct signal types, mix of observed/inferred evidence types, dimension mapping
- [x] 3. Each account: complete OpportunityScore with all 5 dimension sub-scores, top factors, missing factors
- [x] 4. Each account: 1-2 BuyerPersonas with title, relevance explanation (1-3 sentences), and contact info where applicable
- [x] 5. Accounts scoring ≥60 (MarketFlow, GigConnect, CloudScale): AccountOpportunityBrief with observed/inferred labels on supporting evidence
- [x] 6. Accounts scoring ≥60: generated OutreachPack with all message types (email, LinkedIn, call, follow-up, questions) and `claimEvidenceIds` linking each claim to Evidence_Card IDs
- [x] 7. Accounts scoring <60 (FreightPay, TinyBooks): clear research/deprioritization explanation with `deprioritizeReason` instead of brief/outreach
- [x] 8. Include one account (FreightPay) with conflicting/weak evidence to demonstrate confidence penalty
- [x] 9. Include preloaded web enrichment data for all 5 accounts (no live API needed in Demo_Mode)
- [x] 10. Create `src/lib/demo-scenario.ts` — default ICP text, preferred account to auto-select after scoring, deprioritized account to reject during demo, expected feedback outcome, demo narrative labels

**Requirements:** 13.7, 13.8, 11.8, 4.12

---

### Task 4: Workflow State Machine & Context
- [x] 1. Create `src/context/WorkflowContext.tsx` with useReducer managing full WorkflowState
- [x] 2. Implement workflow stages: idle → analyzing_icp → awaiting_plan_approval → discovering → collecting_evidence → enriching → scoring → matching_personas → generating_brief → generating_outreach → ready → feedback → failed
- [x] 3. Implement mode toggle (live/demo) that switches provider source
- [x] 4. Implement activity log: append entries (max 280 chars) within 2 seconds of stage completion
- [x] 5. Implement 90-second time budget enforcement — track elapsed time, auto-fallback to cached/demo data if exceeded
- [x] 6. Implement suppression list management (add/remove/check, supports 500+ entries, persisted in localStorage)
- [x] 7. Create `src/lib/workflow-runner.ts` — orchestration function that runs the end-to-end flow: analyze ICP → discover → collect evidence → enrich → score → match personas → generate briefs/outreach for qualifying accounts. In Phase 1, use precomputed demo briefs/outreach packs from seed data; in Phase 2, switch to generated outputs through template/LLM providers

**Requirements:** 11.1, 11.2, 11.11, 12.1, 12.4, 12.7, 9.5, 9.6

---

### Task 5: Three-Panel Dashboard Layout
- [x] 1. Create `src/components/layout/ThreePanelLayout.tsx` — responsive CSS grid: left (ICP/plan), center (accounts), right (detail)
- [x] 2. Create `src/components/layout/BottomPanel.tsx` — agent activity log with scrollable entries, timestamps
- [x] 3. Create `src/components/shared/DemoModeBadge.tsx` — persistent badge when Demo_Mode active
- [x] 4. Create `src/components/shared/ScoreBadge.tsx` — color-coded: green ≥80, yellow 60-79, gray <60
- [x] 5. Create `src/components/shared/ComplianceNotice.tsx` — data handling + data-source compliance notice
- [x] 6. Add polished empty states, loading skeletons, and warning states for each panel
- [x] 7. Wire layout into `src/pages/index.tsx` with WorkflowContext provider

**Requirements:** 11.6, 11.7, 11.8, 11.9, 9.9, 9.14

---

### Task 6: Left Panel — ICP Input & Search Plan
- [x] 1. Create `src/components/left-panel/ICPInput.tsx` — textarea (20-2000 chars), validation, submit button
- [x] 2. Add 2-3 preset ICP examples the presenter can click to populate input (e.g., "Marketplaces and SaaS platforms expanding internationally with complex payouts, refunds, reconciliation, and finance operations")
- [x] 3. Create `src/components/left-panel/SearchPlanEditor.tsx` — editable keywords, company types, geo filters, exclusions with approve/edit actions
- [x] 4. Create `src/components/left-panel/ModeToggle.tsx` — Live/Demo switch with visual indicator
- [x] 5. Create `src/lib/icp-parser.ts` — rule-based extraction of keywords, industries, geographies, personas from natural language
- [x] 6. Create `src/pages/api/analyze-icp.ts` — calls icp-parser (or LLM via provider if configured), returns SearchPlan + rationale
- [x] 7. Implement validation: reject <20 chars or no business context, suggest narrowing if <2 targeting dimensions

**Requirements:** 1.1-1.8

---

### Task 7: Center Panel — Account List & Workflow Progress
- [x] 1. Create `src/components/center-panel/WorkflowProgress.tsx` — stage indicators with status (pending/running/completed/warning/failed), current stage highlighted
- [x] 2. Create `src/components/center-panel/AccountList.tsx` — ranked list with score badges, status labels, recommended action
- [x] 3. Create `src/components/center-panel/AccountCard.tsx` — name, business model, score badge, recommended action, deprioritize reason for <40
- [x] 4. Implement click-to-select: clicking account populates right panel detail view
- [x] 5. After scoring completes, automatically select the highest-scoring account with recommended action `generate_outreach`
- [x] 6. Show "Research further" / "Deprioritized" labels with visual "why not" badges for accounts <60
- [x] 7. Show fallback notifications when stages use cached/demo data

**Requirements:** 11.1, 11.9, 11.14, 8.7, 12.2

---

### Task 8: Right Panel — Account Detail
- [x] 1. Create `src/components/right-panel/AccountDetail.tsx` — container switching between sub-views
- [x] 2. Create `src/components/right-panel/ScoreBreakdown.tsx` — visual 5-dimension breakdown (horizontal bars with labels, weights, sub-scores, contributing signals)
- [x] 3. Create `src/components/right-panel/EvidenceCardList.tsx` — cards showing signal type, evidence, source, confidence, angle, observed/inferred badge
- [x] 4. Create `src/components/right-panel/PersonaList.tsx` — ranked personas with relevance explanation, contact info
- [x] 5. Create `src/components/right-panel/OpportunityBrief.tsx` — one-page scrollable brief with observed/inferred labels, low-evidence warning, copy/export buttons, JSON export, "Copy CRM Note" button
- [x] 6. Create `src/components/right-panel/OutreachPackView.tsx` — tabbed view (email, LinkedIn, call, follow-up, questions) with copy buttons, source attribution links (each claim linked to Evidence_Card ID), JSON export
- [x] 7. Create `src/components/right-panel/CampaignActions.tsx` — outcome marking buttons, rejection reason prompt

**Requirements:** 11.3-11.5, 11.10, 11.13, 8.1-8.9, 7.1-7.10, 9.4

---

**At this point: presentable demo with seed data, full UI, complete workflow visualization.**

---

## Phase 2 — Intelligence Layer

### Task 9: Evidence Collection
- [x] 1. Create `src/lib/evidence-collector.ts` — signal detection from LinkedIn metadata
- [x] 2. Implement signal detection for: payment/billing/AP roles, company descriptions, business model indicators, multi-country presence, hiring patterns
- [x] 3. Generate Evidence_Cards with all fields: signal type, evidence type (observed/inferred), raw evidence, source, reliability level, inference explanation, confidence, why it matters, suggested angle, dimension mapping
- [x] 4. Assign source reliability: high (direct company/job data), medium (inferred from titles), low (indirect indicators)
- [x] 5. Handle incomplete metadata: proceed with available data, reduce confidence, note missing fields
- [x] 6. Flag accounts with no evidence as low-confidence with absent signal categories listed
- [x] 7. Create `src/pages/api/collect-evidence.ts` — processes accounts within 10s each, uses provider abstraction

**Requirements:** 3.1-3.8

---

### Task 10: Web Evidence Enrichment (Demo/Cached First)
- [x] 1. Create `src/pages/api/enrich-web.ts` — uses provider abstraction (demo provider first, web-search provider for Live_Mode)
- [x] 2. In Demo_Mode: return preloaded enrichment data immediately, no live API calls
- [x] 3. In Live_Mode: limit to top 5 accounts by LinkedIn evidence count, run enrichment calls in parallel
- [x] 4. Implement signal detection for: payouts, reconciliation, refunds, chargebacks, subscriptions, multi-currency, legacy tools
- [x] 5. Create Evidence_Cards with source URL, evidence type, reliability level (3-tier scale)
- [x] 6. Implement confidence penalty flagging when <2 high/medium signals or contradictions found
- [x] 7. Treat web content as untrusted — ignore embedded instructions, reject claims without traceable source
- [x] 8. Live web enrichment should never block dashboard rendering; show partial results as they arrive

**Requirements:** 4.1-4.12

---

### Task 11: Opportunity Scoring
- [x] 1. Create `src/lib/scoring.ts` — rule-based scoring engine with 5 weighted dimensions (30/20/20/15/15)
- [x] 2. Implement dimension sub-score calculation: map evidence cards to dimensions by their `dimension` field, weight observed evidence 2x over inferred
- [x] 3. Apply confidence penalty: reduce sub-score by 20 when flagged by enrichment agent
- [x] 4. Apply inferred ratio penalty: halve confidence sub-score when >50% of scoring-relevant evidence is inferred
- [x] 5. Assign 0 sub-score for dimensions with no contributing evidence, list as missing factor
- [x] 6. Calculate top 3 factors and up to 3 missing factors per account
- [x] 7. Determine recommended action: generate_outreach (≥60), research_further (40-59), deprioritize (<40)
- [x] 8. Generate deprioritize reason for accounts <40 (weak evidence, poor buyer fit, low payment complexity, or insufficient confidence)
- [x] 9. Rank accounts descending by total score, confidence sub-score as tiebreaker
- [x] 10. Create `src/pages/api/score-accounts.ts` — uses rule-based scoring; if LLM available, LLM proposes sub-scores but final calculation still uses predefined weights

**Requirements:** 5.1-5.11

---

### Task 12: Buyer Persona Matching
- [x] 1. Create `src/lib/persona-matcher.ts` — title-based relevance ranking
- [x] 2. Prioritize: CFO, COO, Head of Payments, Head of Finance Ops, VP Product, Head of Platform, Operations Director, Payment Ops Manager
- [x] 3. Filter out low-relevance titles (marketing, HR, sales, etc.) even if keyword-matched
- [x] 4. Generate 1-3 sentence relevance explanation linking persona to account's evidence signals
- [x] 5. Limit to top 5 personas per account, ranked by relevance
- [x] 6. When no named contacts: recommend 1-3 target titles + 1-2 search queries
- [x] 7. Create `src/pages/api/match-personas.ts` — uses provider abstraction

**Requirements:** 6.1-6.6

---

### Task 13: Account Opportunity Brief Generation
- [x] 1. Create `src/lib/brief-templates.ts` — template-based brief generation
- [x] 2. Generate: company summary (≤150 words), payment complexity hypothesis, supporting evidence with observed/inferred/hypothesis labels, 2-5 pain points, recommended personas, outreach angle, 3 discovery questions
- [x] 3. Only generate for accounts with score ≥60
- [x] 4. Include low-evidence warning when <2 high/medium confidence Evidence_Cards
- [x] 5. Ensure all claims traceable to Evidence_Cards or labelled as hypotheses
- [x] 6. Create `src/pages/api/generate-brief.ts` — template or LLM via provider
- [x] 7. Support regeneration after evidence/persona edits

**Requirements:** 8.1-8.9, 11.13

---

### Task 14: Outreach Pack Generation
- [x] 1. Create `src/lib/outreach-templates.ts` — template-based generation with evidence variable substitution
- [x] 2. Templates: email (<150 words), LinkedIn message (<50 words), call opener (2-3 points), follow-up (<100 words), 3 discovery questions
- [x] 3. Generate subject line (≤60 chars) and "why this account, why now" (≤100 words)
- [x] 4. Each message references at least one evidence-backed signal from Evidence_Cards
- [x] 5. Block generation if account has <1 Evidence_Card — show insufficient evidence message
- [x] 6. Block generation for suppressed accounts — show suppression notice
- [x] 7. Create `src/pages/api/generate-outreach.ts` — template or LLM via provider
- [x] 8. Support regeneration after evidence/persona edits
- [x] 9. Implement JSON export for outreach pack
- [x] 10. Create `src/lib/traceability.ts` — claim traceability validator that verifies every generated claim in outreach and briefs references an Evidence_Card ID or is explicitly labelled as hypothesis

**Requirements:** 7.1-7.10, 9.13, 11.13

---

**At this point: full intelligence layer working, winning product complete.**

---

## Phase 3 — Feedback, Reliability & Live Integration

### Task 15: Campaign Actions & Feedback
- [x] 1. Implement outcome marking: copied, approved, rejected, contacted, replied, booked_meeting, not_relevant, bounced, no_response, do_not_contact
- [x] 2. Implement rejection reason prompt with predefined reasons
- [x] 3. Track campaign state: account, channel (email/LinkedIn/call/other), outcome, timestamp
- [x] 4. Generate Campaign_Feedback when all "generate_outreach" accounts have outcomes
- [x] 5. Show top 3 signals associated with positive outcomes, bottom 3 with negative — use simple frequency-based association (not statistical correlation)
- [x] 6. Recommend ICP refinements comparing approved vs rejected account attributes
- [x] 7. Label recommendations as "baseline" when <5 response outcomes recorded
- [x] 8. Update recommended keywords/exclusions/personas based on feedback patterns

**Requirements:** 10.1-10.9

---

### Task 16: Compliance & Human Approval
- [x] 1. Implement copy-only default — no send buttons, only copy/export actions
- [x] 2. Display source attribution in outreach: link each claim to originating Evidence_Card
- [x] 3. Show compliance warning for optional channels (WhatsApp, SMS, phone) requiring user acknowledgment — only if those channels are enabled
- [x] 4. Display data handling notice (users responsible for compliant data sources and lawful channels)
- [x] 5. Display data-source compliance notice (authorized access, provider terms)
- [x] 6. Implement clear data button — removes localStorage cache, suppression list, campaign data
- [x] 7. Block outreach generation/viewing for suppressed accounts/personas with notice

**Requirements:** 9.1-9.14

---

### Task 17: Observability & Fallback Handling
- [x] 1. Implement per-stage status tracking with visual indicators in WorkflowProgress
- [x] 2. Implement 30-second timeout per external API call with automatic fallback trigger
- [x] 3. Show fallback notification: which service failed, what fallback is active, workflow continuing
- [x] 4. Offer user choice on failure: continue with cached data or switch to Demo_Mode
- [x] 5. Redact API keys, tokens, and PII from all log entries
- [x] 6. Cache enrichment results, scores, and outreach packs in localStorage for repeated demos
- [x] 7. Enforce 90-second total workflow budget: track elapsed time, run enrichment in parallel, auto-fallback if budget at risk

**Requirements:** 12.1-12.7

---

### Task 18: Live API Integration (Stretch)
- [x] 1. Wire Apify provider to live LinkedIn Lead Scraper API with 30s timeout
- [x] 2. Implement person-to-account normalization from live Apify responses
- [x] 3. Implement business model classification from live metadata
- [x] 4. Implement deduplication with low-confidence flagging for fuzzy matches
- [x] 5. Wire web-search provider to live web search API
- [x] 6. Wire LLM provider to configured LLM API (scoring + generation)
- [x] 7. Test Live_Mode end-to-end with all providers active
- [x] 8. Test fallback: disable each provider individually, verify graceful degradation

**Requirements:** 2.1-2.10, 4.1-4.11, 5.8

---

### Task 19: Final Polish & Deploy
- [x] 1. Verify `next build` passes with zero TypeScript errors
- [x] 2. Run seed-data validation: all 5 accounts have evidence, scores, personas, and recommended actions; all accounts scoring ≥60 have complete briefs and outreach packs; accounts below 60 have clear research/deprioritization reasons
- [x] 3. Test Demo_Mode end-to-end: ICP → Search Plan → Accounts → Evidence → Scoring → Brief → Outreach → Reject → Feedback
- [x] 4. Test with internet disabled and API keys removed — verify Demo_Mode works fully
- [x] 5. Test 90-second demo workflow timing
- [x] 6. Verify no secrets in client bundle (check page source, network tab)
- [x] 7. Deploy to Vercel with environment variables configured
- [x] 8. Verify deployed app: Demo_Mode works, Live_Mode works (if keys set), no client-side key exposure
- [x] 9. Create `docs/demo-script.md` — exact flow: sample ICP, expected accounts, account to select, account to reject, final message to judges
- [x] 10. Add lightweight validation scripts for: scoring weight calculation, inferred-evidence penalty, and outreach claim traceability (using `src/lib/traceability.ts`)

**Requirements:** 13.1-13.8, 12.4

---

## Quality Gates (verify before presenting)

- [x] All 5 seed accounts have ≥3 evidence cards with distinct signal types
- [x] Every Evidence_Card has id, evidenceType, sourceLabel, sourceReliability, confidence, and dimension
- [x] All accounts have complete Opportunity_Score breakdowns across 5 dimensions
- [x] All accounts scoring ≥60 have complete Account_Opportunity_Brief and Outreach_Pack
- [x] Accounts scoring below 60 have clear "Research further" or "Deprioritized" reasons
- [x] No brief or outreach message references a claim not traceable to an Evidence_Card or labelled hypothesis
- [x] No secret appears in client bundle, browser console, or network response
- [x] Demo workflow completes in <90 seconds with no API keys configured
- [x] Activity log shows decision rationale at every stage
- [x] Demo script runs end-to-end without typing anything except optional presenter narration


---

## Phase 4 — Premium UX & Agentic Outreach

**Objective:** Transform PaySignal AI from a functional dashboard into a premium agentic command centre. The backend is complete — this phase is purely about product feel, visual quality, and making the outreach experience feel autonomous rather than passive.

**Priority order:** Resizable layout → Visual redesign → Agentic outreach types + strategy → Agent Outreach UI → Presentation mode

---

### Task 20: Resizable Command Centre Layout
- [ ] 1. Install `react-resizable-panels` (already added to package.json)
- [ ] 2. Replace fixed CSS grid in `ThreePanelLayout.tsx` with `PanelGroup` + `Panel` components from react-resizable-panels
- [ ] 3. Left panel: default 22%, min 15%, max 35%, collapsible (collapses after search plan approved)
- [ ] 4. Center panel: default 33%, min 25%, flexible
- [ ] 5. Right panel: default 45%, min 30% — can expand into "focus mode" when left panel is collapsed
- [ ] 6. Bottom activity log: vertical panel group, default 25%, min 10%, max 40%, collapsible
- [ ] 7. Create styled `ResizeHandle` component — thin line with hover state (brand color glow on hover/drag)
- [ ] 8. Persist panel sizes in localStorage via `onLayout` callback (key: `paysignal:panel-sizes`)
- [ ] 9. Add "Reset Layout" button in the bottom-right corner that restores default panel sizes
- [ ] 10. Verify layout remains usable at 1280px width (laptop) and 1920px+ (large monitor)

**Files to modify:** `src/components/layout/ThreePanelLayout.tsx`, `src/pages/index.tsx`
**New dependencies:** `react-resizable-panels` (already installed)

---

### Task 21: Premium Visual Redesign
- [ ] 1. Update `tailwind.config.js` with richer dark palette: background deep navy (#0a0e1a), panels layered dark blue with subtle gradient, primary accent electric blue/cyan, opportunity green, warning amber, risk muted red
- [ ] 2. Add custom utilities: `bg-glow-brand` (radial gradient behind high-value accounts), `shadow-glow` (subtle blue glow for selected state), `animate-fade-in`, `animate-slide-up`, `animate-pulse-slow`
- [ ] 3. Update `globals.css`: add `.panel-glass` class (backdrop-blur, subtle border, inner shadow), improve scrollbar styling, add focus ring styles
- [ ] 4. Redesign `AccountCard.tsx`: add gradient left border for high-score accounts, subtle glow on selected state, "why now" one-liner below company name, mini confidence indicator, stronger typography hierarchy
- [ ] 5. Redesign `ScoreBreakdown.tsx`: replace plain bars with gradient-filled bars, add score ring/arc for total score, add animated fill on mount, improve dimension labels with icons
- [ ] 6. Redesign `EvidenceCardList.tsx`: add left-border color by confidence (green/amber/gray), improve source attribution layout, add hover expand for long evidence text, add evidence type pill with icon
- [ ] 7. Redesign `BottomPanel.tsx` as "Agent Decision Stream": use first-person commercial language for entries, group by stage with subtle dividers, add stage completion icons, improve timestamp styling
- [ ] 8. Redesign `WorkflowProgress.tsx`: replace text-only strip with connected node visualization (circles connected by lines, filled/animated when complete, pulsing when running)
- [ ] 9. Update all buttons: add hover scale transform, improve disabled states, add subtle gradient to primary buttons
- [ ] 10. Add `DemoModeBadge` redesign: make it look intentional/premium (not a warning) — use a subtle pill with "Synthetic Demo" label and a small info icon
- [ ] 11. Improve right-panel tab bar: add underline animation on tab switch, increase touch targets, add subtle background on active tab
- [ ] 12. Add micro-interactions: fade-in for new accounts appearing, slide-up for evidence cards loading, smooth transitions on panel content changes

**Files to modify:** `tailwind.config.js`, `src/styles/globals.css`, `src/components/center-panel/AccountCard.tsx`, `src/components/center-panel/AccountList.tsx`, `src/components/right-panel/ScoreBreakdown.tsx`, `src/components/right-panel/EvidenceCardList.tsx`, `src/components/layout/BottomPanel.tsx`, `src/components/center-panel/WorkflowProgress.tsx`, `src/components/shared/DemoModeBadge.tsx`, `src/components/right-panel/AccountDetail.tsx`

---

### Task 22: Agentic Outreach Strategy (Types + Generation)
- [ ] 1. Add new types to `src/types/index.ts`: `OutreachStrategy` and `OutreachSequenceStep`
```typescript
interface OutreachStrategy {
  id: string;
  accountId: string;
  primaryPersonaId?: string;
  recommendedPersonaTitle: string;
  recommendedAngle: string;
  rationale: string; // why this persona + angle
  sequence: OutreachSequenceStep[];
  successHypothesis: string;
  risks: string[];
  fallbackPlan: string;
  confidence: ConfidenceLevel;
  generatedAt: string;
}

interface OutreachSequenceStep {
  id: string;
  dayOffset: number;
  channel: "linkedin" | "email" | "call" | "follow_up";
  objective: string;
  message: string;
  claimEvidenceIds: string[];
  status: "draft" | "approved" | "copied" | "contacted" | "replied" | "skipped";
}
```
- [ ] 2. Add `outreachStrategy?: OutreachStrategy` field to the `Account` interface
- [ ] 3. Create `src/lib/outreach-strategy.ts` — generates an OutreachStrategy for each outreach-ready account:
  - Select primary persona based on evidence alignment (not just title rank)
  - Choose recommended angle from strongest evidence card's `suggestedOutreachAngle`
  - Generate rationale explaining why this persona + angle combination
  - Build 4-step sequence: Day 1 LinkedIn → Day 2 Email → Day 5 Follow-up → Day 7 Call
  - Generate success hypothesis ("If they respond, it will likely be because...")
  - Identify 1-2 risks ("Evidence is inferred", "No direct email available")
  - Generate fallback plan ("If no response from Head of Payments, try CFO with finance ops angle")
  - Assign confidence based on evidence quality for the chosen angle
- [ ] 4. Each sequence step generates a message using existing outreach-templates logic, with `claimEvidenceIds` populated
- [ ] 5. Update `src/lib/demo-data.ts` — add precomputed `OutreachStrategy` to the 3 qualifying seed accounts (MarketFlow, GigConnect, CloudScale)
- [ ] 6. Create `src/pages/api/generate-strategy.ts` — generates strategy for a given account, uses template-based logic (LLM optional)
- [ ] 7. Add Zod schema for `OutreachStrategy` and `OutreachSequenceStep` in `src/lib/schemas.ts`

**Files to create:** `src/lib/outreach-strategy.ts`, `src/pages/api/generate-strategy.ts`
**Files to modify:** `src/types/index.ts`, `src/lib/demo-data.ts`, `src/lib/schemas.ts`

---

### Task 23: Agent Outreach UI
- [ ] 1. Replace current `OutreachPackView.tsx` with new `AgentOutreachView.tsx` — restructured from passive tabs to agentic strategy view
- [ ] 2. Create `src/components/right-panel/AgentRecommendation.tsx` — prominent card at top showing: recommended persona, recommended angle, confidence, and rationale. Example: "Start with Head of Payments through LinkedIn. Use the multi-country payout and reconciliation angle. Confidence: High."
- [ ] 3. Create `src/components/right-panel/OutreachTimeline.tsx` — vertical timeline showing the 4-step sequence:
  - Each step shows: day offset, channel icon, objective, status badge
  - Clicking a step expands to show the generated message + evidence references
  - Steps can be individually approved, copied, or skipped
  - Completed steps show outcome (contacted/replied/no response)
- [ ] 4. Create `src/components/right-panel/NextBestAction.tsx` — shows the single most important next action for this account. Examples: "Send LinkedIn connection message", "Wait for response (Day 2)", "Try CFO instead — no response from Head of Payments"
- [ ] 5. Add action buttons below timeline: "Approve Sequence", "Regenerate Strategy", "Change Persona", "Change Angle"
- [ ] 6. "Regenerate Strategy" re-calls the strategy API with different parameters
- [ ] 7. "Change Persona" shows a dropdown of available personas and regenerates with the selected one
- [ ] 8. "Change Angle" shows available evidence angles and regenerates with the selected one
- [ ] 9. Update `AccountDetail.tsx` tabs: rename "Outreach" tab to "Agent Plan", replace content with `AgentOutreachView`
- [ ] 10. Add evidence chips in each message: small clickable pills showing which evidence card is referenced (e.g., "ev-mf-1: seller payouts"), clicking scrolls to that evidence card in the Evidence tab
- [ ] 11. Add "Risks & Fallback" collapsible section below the timeline showing strategy risks and fallback plan

**Files to create:** `src/components/right-panel/AgentOutreachView.tsx`, `src/components/right-panel/AgentRecommendation.tsx`, `src/components/right-panel/OutreachTimeline.tsx`, `src/components/right-panel/NextBestAction.tsx`
**Files to modify:** `src/components/right-panel/AccountDetail.tsx`
**Files to remove:** `src/components/right-panel/OutreachPackView.tsx` (replaced by AgentOutreachView)

---

### Task 24: Enhanced Account List & Filters
- [ ] 1. Add "Top Opportunity" hero card at the top of the account list for the highest-scoring account — larger card with gradient background, score ring, "why now" line, and primary persona name
- [ ] 2. Add filter bar above account list: All | Outreach Ready | Research | Deprioritized | High Confidence
- [ ] 3. Update `AccountCard.tsx` to show: mini 5-bar score breakdown (tiny horizontal bars), confidence indicator (dot: green/amber/gray), "why now" one-liner from `whyThisAccountWhyNow` or top factor
- [ ] 4. Add account count per filter in the filter bar (e.g., "Outreach Ready (3)")
- [ ] 5. Improve selected state: subtle glow border, slightly elevated appearance, brand-colored left accent

**Files to modify:** `src/components/center-panel/AccountList.tsx`, `src/components/center-panel/AccountCard.tsx`

---

### Task 25: Agent Decision Stream (Activity Log Upgrade)
- [ ] 1. Rewrite `BottomPanel.tsx` as `AgentDecisionStream.tsx`
- [ ] 2. Change log entry language from technical to first-person commercial: "I found 5 accounts..." instead of "Found 5 accounts..."
- [ ] 3. Group entries by workflow stage with subtle stage headers and completion indicators
- [ ] 4. Add entry type icons: 🔍 discovery, 📊 scoring, 👤 persona, 📝 outreach, ⚠️ warning, ✓ completion
- [ ] 5. Add "key decision" highlighting for important entries (e.g., deprioritization reasons, persona selection rationale)
- [ ] 6. Add collapse/expand toggle and "Clear log" button
- [ ] 7. Update `demo-scenario.ts` narrative labels to use first-person commercial language

**Files to create:** `src/components/layout/AgentDecisionStream.tsx`
**Files to modify:** `src/lib/demo-scenario.ts`, `src/pages/index.tsx`
**Files to remove:** `src/components/layout/BottomPanel.tsx` (replaced)

---

### Task 26: Presentation Mode
- [ ] 1. Add `presentationMode: boolean` to WorkflowState and a toggle button (top-right corner, keyboard shortcut `P`)
- [ ] 2. When active: collapse left panel, expand right panel to ~65% width, hide mode toggle and compliance notice, enlarge font sizes by 1 step
- [ ] 3. Add keyboard shortcuts: `1` Score, `2` Evidence, `3` Brief, `4` Agent Plan, `5` Reject TinyBooks, `→` next account, `←` previous account
- [ ] 4. Add "Run Demo" button that auto-executes the demo scenario: loads preset ICP, runs workflow, selects MarketFlow, pauses for presenter narration between steps
- [ ] 5. Show a subtle "Presentation Mode" indicator in the top-right
- [ ] 6. In presentation mode, activity log shows only key decision entries (filter out routine stage transitions)

**Files to modify:** `src/context/WorkflowContext.tsx`, `src/pages/index.tsx`, `src/components/layout/ThreePanelLayout.tsx`, `src/components/right-panel/AccountDetail.tsx`

---

### Task 27: Autopilot Simulation
- [ ] 1. Add "Run Outreach Simulation" button in the Agent Plan tab for the selected account
- [ ] 2. When clicked, animate through the strategy steps with 1.5s delay between each:
  - Step 1: "Selected [persona] as primary contact" — highlight persona
  - Step 2: "Chose [channel] first because [rationale]" — highlight channel in timeline
  - Step 3: "Generated evidence-backed opening message" — expand message
  - Step 4: "Scheduled follow-up after [N] days if no reply" — show next step
  - Step 5: "If no response, switch to [fallback persona] with [fallback angle]" — show fallback
- [ ] 3. Each simulation step appends to the Agent Decision Stream
- [ ] 4. After simulation completes, show "Simulation complete — approve sequence to proceed" with approve button
- [ ] 5. Add a "Reset Simulation" button to replay

**Files to modify:** `src/components/right-panel/AgentOutreachView.tsx`, `src/components/layout/AgentDecisionStream.tsx`

---

## Phase 4 Quality Gates

- [ ] Panels are resizable and sizes persist across page reloads
- [ ] Left panel collapses cleanly; right panel expands to fill space
- [ ] Visual theme feels premium — no flat/dull empty space, clear hierarchy
- [ ] Selected account has visible glow/emphasis
- [ ] Agent Outreach Plan shows strategy + timeline (not just static messages)
- [ ] Each timeline step has a generated message with evidence chips
- [ ] "Next Best Action" is always visible for the selected account
- [ ] Presentation mode works with keyboard shortcuts
- [ ] Autopilot simulation animates through strategy steps convincingly
- [ ] Activity log reads like an intelligent agent explaining decisions, not a system log
- [ ] Demo runs smoothly without typing (preset ICP → auto-flow → select → reject → done)
