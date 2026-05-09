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
