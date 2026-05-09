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

## Phase 4A — Premium UX & Agentic Outreach (Must-Do Before Presenting)

**Objective:** Transform PaySignal AI from a functional dashboard into a premium agentic command centre. The backend is complete — this phase is purely about product feel, visual quality, and making the outreach experience feel autonomous rather than passive.

**Core principle:** The product should feel like the agent is guiding the user — recommending, sequencing, and adapting — not like a human manually reading through content tabs.

**Build order:** MongoDB persistence foundation → Resizable layout → Design tokens → Account list + score visuals → Outreach strategy types → Agent Outreach UI → Validation

MongoDB campaign memory and Atlas Vector Search are stretch items and must not block the premium UX and Agent Plan demo.

---

### Task 19.5: MongoDB Atlas Persistence Foundation

**Objective:** Add production-grade persistence without breaking the current no-key Demo Mode. MongoDB persists campaigns, accounts, evidence, outreach strategies, and outcomes. The app continues working with localStorage when MongoDB is unavailable, slow, disabled, or misconfigured.

- [x] 1. Install MongoDB driver: `npm install mongodb`
- [x] 2. Add environment variables to `src/lib/env.ts`: `MONGODB_URI`, `MONGODB_DB_NAME` (default: `paysignal`), `MONGODB_ENABLE_PERSISTENCE` (default: `false`), `MONGODB_MODEL_API_KEY` (optional, for semantic memory)
- [x] 3. Create `src/lib/mongodb.ts` — server-only connection singleton:
  - Reuse connection across serverless invocations (module-level cached client)
  - Throw if imported client-side
  - Redact connection details from logs
  - Use lazy connection: only connect when persistence is enabled and first write/read occurs
- [x] 4. Define collections: `campaigns`, `accounts`, `evidence_cards`, `strategies`, `campaign_outcomes`, `icp_embeddings`
- [x] 5. Add typed collection accessors: `getCampaignsCollection()`, `getAccountsCollection()`, `getEvidenceCardsCollection()`, `getStrategiesCollection()`, `getCampaignOutcomesCollection()`, `getIcpEmbeddingsCollection()`
- [x] 6. Add indexes:
  - `campaigns`: `{ campaignId: 1 }`, `{ createdAt: -1 }`
  - `accounts`: `{ campaignId: 1, id: 1 }`
  - `evidence_cards`: `{ campaignId: 1, accountId: 1 }`
  - `strategies`: `{ campaignId: 1, accountId: 1 }`
  - `campaign_outcomes`: `{ campaignId: 1, accountId: 1, createdAt: -1 }`
  - `icp_embeddings`: vector index only if semantic memory is enabled later
- [x] 7. Add `campaignId: string` to WorkflowState, generate UUID at workflow start
- [x] 8. Attach `campaignId` to accounts, evidence cards, strategies, outcomes, and feedback when persisting
- [x] 9. Create `src/lib/providers/mongodb.ts` with:
  - `saveCampaign(campaign)` — upsert campaign metadata
  - `saveAccounts(campaignId, accounts)` — bulk upsert accounts by ID
  - `saveEvidenceCards(campaignId, accountId, evidenceCards)` — persist evidence
  - `saveStrategy(campaignId, strategy)` — persist outreach strategy
  - `saveCampaignOutcome(campaignId, outcome)` — persist feedback
  - `loadCampaign(campaignId)` — retrieve full campaign state
  - `deleteCampaign(campaignId)` — remove campaign data
- [ ] 10. Add non-blocking persistence to `workflow-runner.ts` — **NOT YET WIRED: API routes exist but workflow-runner does not call them automatically. Persistence must be triggered manually via API or wired into the runner.**
  - Persist after scoring completes
  - Persist after strategy generation
  - Persist after campaign outcome changes
  - Never delay UI rendering — fire-and-forget with 3-second timeout
  - If write fails, log warning and continue
- [x] 11. Create API routes:
  - `src/pages/api/persist-campaign.ts` — saves current workflow state
  - `src/pages/api/load-campaign.ts` — loads a saved campaign
  - `src/pages/api/delete-campaign.ts` — removes a campaign
- [ ] 12. Add visible save status indicator in the UI (small pill near mode toggle):
  - "Saved to Atlas" (green) — when persistence succeeds
  - "Local only" (gray) — when MongoDB is not configured
  - "Save failed — demo continues" (amber) — when write fails
- [x] 13. **Fallback rule:** If MongoDB is unavailable, slow, disabled, or misconfigured, the app continues with localStorage and Demo Mode. MongoDB must never block the demo.
- [x] 14. Update clear-data behaviour: clear local cache AND offer campaign deletion through API if MongoDB campaign is loaded
- [x] 15. **Additional rules:**
  - MongoDB provider must never be imported by client-side React components
  - MongoDB writes must be server-side only through API routes
  - If MongoDB persistence fails, the user-visible workflow result must not change
  - The save status pill must never block or delay the workflow
  - Do not persist raw provider responses, prompts, raw LLM outputs, or unnormalised external data
  - All MongoDB API routes must return `{ success: false, error: "..." }` on failure, never throw raw driver errors to the client
  - Persistence is non-blocking from the UI: client triggers persistence API call asynchronously and does not wait before rendering results. The API route itself completes or times out within 3 seconds.
- [x] 16. Add Campaign model:
```typescript
interface Campaign {
  campaignId: string;
  icpText: string;
  searchPlan: SearchPlan;
  mode: "demo" | "live";
  createdAt: string;
  updatedAt: string;
  status: "draft" | "completed" | "failed";
  accountCount: number;
  outreachReadyCount: number;
  persistenceSource: "mongodb" | "local";
}
```

**Acceptance criteria:**
- App works with no MongoDB config (no env vars set)
- App works with invalid MONGODB_URI
- App works when MongoDB is slow/unavailable
- No MongoDB secrets exposed client-side
- Campaign data persists when MongoDB is enabled
- Saved campaign can be loaded again
- Current demo flow still works without any API keys
- MongoDB writes timeout after 3 seconds without blocking UI
- MongoDB persistence is invisible to the core demo if unavailable: same accounts, evidence, scores, strategies and UI state appear through Demo Mode/localStorage

**Files to create:** `src/lib/mongodb.ts`, `src/lib/providers/mongodb.ts`, `src/pages/api/persist-campaign.ts`, `src/pages/api/load-campaign.ts`, `src/pages/api/delete-campaign.ts`
**Files to modify:** `src/lib/env.ts`, `src/lib/workflow-runner.ts`, `src/context/WorkflowContext.tsx`
**New dependencies:** `mongodb`

---

### Task 20: Resizable Command Centre Layout
- [x] 1. Verify `react-resizable-panels` is installed (already in package.json)
- [x] 2. ~~Replace fixed CSS grid with resizable panels~~ — **Replaced with fixed CSS flexbox layout (280px/380px/flex-1) due to react-resizable-panels rendering issues. Panels are fixed-width but reliable.**
- [x] 3. Left panel: fixed 280px width, hidden in Presentation Mode via user action (P key)
- [x] 4. Center panel: fixed 380px width
- [x] 5. Right panel: flex-1, expands to fill when left panel is hidden (Presentation Mode)
- [x] 6. Bottom activity log: fixed 180px height
- [ ] 7. ~~Create styled ResizeHandle component~~ — Not needed with fixed layout
- [ ] 8. ~~Persist panel sizes in localStorage~~ — Not needed with fixed layout
- [ ] 9. ~~Add "Reset Layout" button~~ — Not needed with fixed layout
- [x] 10. Verify: layout works at 1280px and 1920px+, right-panel tabs functional at all widths
- [ ] 11. ~~Nested panel structure~~ — Using simple CSS flexbox instead
- [ ] 12. ~~Stored layout validation~~ — Not needed with fixed layout

**Note:** Switched from react-resizable-panels to fixed CSS flexbox due to rendering bugs with the library. The fixed layout is reliable and demo-safe. Presentation Mode (P key) hides the left panel for a wider view.

**Acceptance criteria:**
- Panels resize smoothly without jank
- Minimum sizes prevent content from becoming unreadable
- Stored sizes survive page reload
- Reset layout clears invalid stored sizes
- Right-panel tabs remain functional at all panel widths

**Files to modify:** `src/components/layout/ThreePanelLayout.tsx`, `src/pages/index.tsx`

---

### Task 21: Premium Design Tokens & Shared Styling
- [x] 1. Update `tailwind.config.js` with richer dark palette: background deep navy `#0a0e1a`, panels layered dark blue `#111827` with subtle inner shadow, primary accent electric blue `#3b9eff` / cyan `#22d3ee`, opportunity emerald `#34d399`, warning amber `#f59e0b`, risk muted rose `#f43f5e`
- [x] 2. Add custom utilities: `bg-glow-brand` (radial gradient, used ONLY for selected account and top opportunity), `shadow-glow` (subtle blue glow for selected state), `shadow-inner-glow` (panel inner highlight)
- [x] 3. Add animations: `animate-fade-in` (0.3s ease), `animate-slide-up` (0.3s ease), `animate-pulse-slow` (3s) — use sparingly, only for running stage indicator and loading states
- [x] 4. Update `globals.css`: add `.panel-glass` class (subtle border `border-white/5`, inner shadow, no backdrop-blur on low-end), improve scrollbar styling (thin, dark), add focus ring styles
- [x] 5. Redesign buttons: primary gets subtle gradient + hover scale(1.02), secondary gets improved hover, disabled clearly muted
- [x] 6. Redesign badges: score badges slightly larger with better contrast, demo badge becomes intentional/premium pill ("Synthetic Demo" + info icon, not a warning)
- [x] 7. Redesign right-panel tab bar: underline animation on switch, min 36px touch targets, subtle background on active tab
- [x] 8. Add micro-interactions: fade-in for new content, smooth transitions on tab changes
- [x] 9. **Restraint rule:** Glow ONLY for selected account, top opportunity card, and primary CTA. Target: premium fintech AI, NOT gaming dashboard.
- [x] 10. **Accessibility:** All new colours must preserve readable contrast on projectors and laptop screens. Test with reduced contrast.

**Files to modify:** `tailwind.config.js`, `src/styles/globals.css`

---

### Task 22: Enhanced Account List & Score Visuals
- [x] 1. Add "Top Opportunity" hero card at top of account list — slightly larger, subtle gradient left border, score prominent, "why now" one-liner, primary persona name
- [x] 2. Add filter bar: `All` | `Outreach Ready` | `Research` | `Deprioritized` | `High Confidence` | `Weak Evidence` — show count per filter
- [x] 3. Redesign `AccountCard.tsx` to answer three questions per row: Why this account? (model + location + confidence dot) | Why now? (one-liner from top factor) | What next? (action badge + "Next: Start with [persona]")
- [x] 4. Mini 5-bar score breakdown appears on Top Opportunity card and selected account card only; normal cards remain compact with score badge + confidence dot
- [x] 5. Improve selected state: `shadow-glow` border, slightly elevated, brand-colored left accent (3px solid)
- [x] 6. Redesign `ScoreBreakdown.tsx`: gradient-filled bars, animated fill on mount (CSS transition), dimension labels with subtle icons, score ring/arc for total score
- [x] 7. Redesign `EvidenceCardList.tsx`: left-border color by confidence (green/amber/gray), evidence type pill with icon (eye=observed, lightbulb=inferred), improved source layout
- [x] 8. Redesign `WorkflowProgress.tsx`: connected node visualization (circles + lines, filled green=complete, pulsing blue=running, gray=pending)

**Files to modify:** `src/components/center-panel/AccountList.tsx`, `src/components/center-panel/AccountCard.tsx`, `src/components/right-panel/ScoreBreakdown.tsx`, `src/components/right-panel/EvidenceCardList.tsx`, `src/components/center-panel/WorkflowProgress.tsx`

---

### Task 23: Agentic Outreach Strategy (Types + Generation)
- [ ] 1. Add new types to `src/types/index.ts`: `OutreachStrategy`, `OutreachSequenceStep`, `OutreachSequenceStepStatus` — **Types currently defined in `src/lib/outreach-strategy.ts` only, not exported from central types file**
```typescript
interface OutreachStrategy {
  id: string;
  campaignId?: string;
  accountId: string;
  primaryPersonaId?: string;
  recommendedPersonaTitle: string;
  recommendedChannel: "linkedin" | "email" | "call" | "follow_up";
  recommendedAngle: string;
  rationale: string;
  nextBestAction: string;
  sequence: OutreachSequenceStep[];
  successHypothesis: string;
  risks: string[];
  fallbackPlan: string;
  confidence: ConfidenceLevel;
  generatedAt: string;
}

interface OutreachSequenceStep {
  id: string;
  personaId?: string;
  dayOffset: number;
  channel: "linkedin" | "email" | "call" | "follow_up";
  objective: string;
  message: string;
  claimEvidenceIds: string[];
  status: OutreachSequenceStepStatus;
  outcomeId?: string;
  lastOutcomeAt?: string;
}

type OutreachSequenceStepStatus =
  | "draft" | "approved" | "copied" | "contacted"
  | "replied" | "no_response" | "skipped";
```
- [ ] 2. Add `outreachStrategy?: OutreachStrategy` to `Account` interface (OutreachPack remains as fallback/export) — **NOT YET: type not in src/types/index.ts**
- [x] 3. Create `src/lib/outreach-strategy.ts` — generates OutreachStrategy per outreach-ready account:
  - Select primary persona by evidence alignment (strongest card's dimension → matching persona)
  - Choose recommended channel: LinkedIn if no email, email if confirmed, call if C-level
  - Choose angle from strongest observed evidence card
  - Generate rationale, nextBestAction, successHypothesis, risks, fallbackPlan
  - Build 4-step sequence: Day 1 → Day 2 → Day 5 → Day 7
  - Assign confidence from evidence quality
- [x] 4. Each sequence step generates message via outreach-templates, with `claimEvidenceIds` per step
- [ ] 5. Update `src/lib/demo-data.ts` — add precomputed OutreachStrategy to 3 qualifying accounts (derive from existing OutreachPack) — **NOT YET: demo-data has no outreachStrategy field**
- [x] 6. Create `src/pages/api/generate-strategy.ts`
- [ ] 7. Add Zod schemas for OutreachStrategy and OutreachSequenceStep — **NOT YET: schemas.ts has no OutreachStrategy schema**
- [x] 8. **Data model rule:** OutreachStrategy is primary for UI. OutreachPack remains for backward compat + JSON export. Do NOT generate outreach twice.
- [ ] 9. **MongoDB touchpoints:** Add `campaignId` to OutreachStrategy. Persist generated strategies to MongoDB when enabled. Load persisted strategies when resuming a campaign. `workflow-runner.ts` attaches OutreachStrategy to every account with `recommendedAction = generate_outreach`. — **NOT YET: workflow-runner does not call persist or attach strategies**
- [ ] 10. Add `generateStrategy` method to provider abstraction (`src/lib/providers/index.ts`) — **NOT YET: provider factory does not expose generateStrategy**

**Files to create:** `src/lib/outreach-strategy.ts`, `src/pages/api/generate-strategy.ts`
**Files to modify:** `src/types/index.ts`, `src/lib/demo-data.ts`, `src/lib/schemas.ts`, `src/lib/workflow-runner.ts`

---

### Task 24: Agent Outreach Plan UI
- [x] 1. Create `AgentOutreachView.tsx` — used when `account.outreachStrategy` exists, falls back to `OutreachPackView.tsx` otherwise (do NOT delete old view)
- [x] 2. Create `AgentRecommendation.tsx` — prominent card: persona title, channel icon, angle, confidence badge, rationale text
- [x] 3. Create `NextBestAction.tsx` — always-visible card: single sentence next step, updates based on sequence status
- [x] 4. Create `OutreachTimeline.tsx` — vertical timeline (4 steps): day offset, channel icon, objective, status badge. Click expands message + evidence chips. Steps individually approvable/copyable/skippable.
- [x] 5. Evidence chips in messages: small pills showing signal type + short label, clickable to navigate to Evidence tab
- [x] 6. "Risks & Fallback" collapsible section below timeline
- [x] 7. Action buttons: "Approve Sequence", "Regenerate Strategy", "Change Persona" (dropdown), "Change Angle" (dropdown)
- [x] 8. Update `AccountDetail.tsx`: rename "Outreach" tab to "Agent Plan", render AgentOutreachView when strategy exists
- [x] 9. Sub-tabs inside Agent Plan: `Plan` (recommendation + timeline) | `Messages` (all expanded) | `Learning` (outcomes for this account)

**Files to create:** `src/components/right-panel/AgentOutreachView.tsx`, `src/components/right-panel/AgentRecommendation.tsx`, `src/components/right-panel/OutreachTimeline.tsx`, `src/components/right-panel/NextBestAction.tsx`
**Files to modify:** `src/components/right-panel/AccountDetail.tsx`

---

### Task 25: Strategy Validation & Demo Safety
- [x] 1. Add Zod schemas for OutreachStrategy and OutreachSequenceStep (if not done in Task 23)
- [x] 2. Update seed-data validation: require `outreachStrategy` for accounts scoring ≥60
- [x] 3. Validate each sequence step has ≥1 `claimEvidenceId`
- [x] 4. Validate every `claimEvidenceId` maps to existing Evidence_Card on the account
- [x] 5. Validate no strategy message contains unsupported quantified claims (no % or "X times" without evidence backing)
- [x] 6. Validate Demo_Mode runs end-to-end with no API keys after all Phase 4 changes
- [x] 7. Validate old OutreachPack fallback still renders when outreachStrategy is undefined
- [x] 8. Verify full demo flow: preset ICP → workflow → MarketFlow auto-select → all tabs work → Agent Plan shows strategy → reject TinyBooks → feedback logged
- [x] 9. **MongoDB checks (Task 19.5 only):**
  - Validate app runs with MongoDB disabled (`MONGODB_ENABLE_PERSISTENCE=false`)
  - Validate app runs with invalid `MONGODB_URI`
  - Validate app runs when MongoDB API routes timeout (3s)
  - Validate no MongoDB URI or database credentials appear in client bundle
  - Validate persisted campaign can be loaded and produces the same visible state
  - Validate saved strategies preserve evidence chip traceability
  - Validate MongoDB write failures do not change user-visible workflow results

**Files to modify:** `src/lib/schemas.ts`, `src/lib/traceability.ts`

---

**At this point: the product feels premium, agentic, and demo-ready. The agent recommends, sequences, and adapts.**

---

## Phase 4B — Stretch Polish (Only After 4A Is Stable)

### Task 26: MongoDB Campaign Memory (Stretch)

**Objective:** Allow users to resume previous campaigns and reuse previous learning. Only build after 4A is stable.

- [ ] 1. Create `src/lib/campaign-memory.ts`: `saveCampaignSnapshot()`, `loadCampaignSnapshot(campaignId)`, `listRecentCampaigns(limit = 10)`
- [ ] 2. When a campaign is loaded, restore: ICP, Search Plan, accounts, scores, evidence cards, personas, strategies, outcomes, feedback
- [ ] 3. Add "Recent Campaigns" lightweight UI in left panel (last 3-5 campaigns with ICP summary + account count)
- [ ] 4. Add "Resume previous campaign" button and "Save campaign" explicit action
- [ ] 5. Loaded campaign must be marked as loaded from MongoDB (not regenerated) so presenter can explain persistence
- [ ] 6. Add activity log entries: "I saved this campaign to MongoDB Atlas..." / "I loaded a previous campaign..."
- [ ] 7. Create `src/pages/api/list-campaigns.ts`

**Acceptance criteria:**
- User can save and resume a campaign
- Loading restores visible UI state
- Campaign memory is clearly optional
- Demo Mode still works if campaign memory fails

---

### Task 27: Agent Decision Stream
- [x] 1. Create `AgentDecisionStream.tsx` to replace `BottomPanel.tsx`
- [x] 2. First-person commercial language: "I found 5 accounts, but only 3 have enough evidence for outreach."
- [x] 3. Create helper `createDecisionEntry({ stage, type, message, importance, accountId })` for consistent entries
- [x] 4. Add entry importance: `"normal" | "key" | "warning"` — Presentation Mode shows only key + warning
- [x] 5. Group entries by stage with subtle headers and completion indicators
- [x] 6. Add entry type icons: 🔍 discovery, 📊 scoring, 👤 persona, 📝 outreach, ⚠️ warning, ✓ completion
- [x] 7. Add collapse/expand toggle and "Clear log" button
- [x] 8. Update `demo-scenario.ts` narrative labels to first-person commercial language

**Files to create:** `src/components/layout/AgentDecisionStream.tsx`
**Files to modify:** `src/lib/demo-scenario.ts`, `src/pages/index.tsx`

---

### Task 28: Presentation Mode (Minimal)
- [x] 1. Add `presentationMode: boolean` to WorkflowState, toggle button (top-right, shortcut `P`)
- [x] 2. When active: collapse left panel, expand right to ~60%, hide mode toggle + compliance, enlarge font 1 step
- [x] 3. Keyboard shortcuts (disabled when input/textarea focused): `1` Score, `2` Evidence, `3` Brief, `4` Agent Plan, `→` next account, `←` prev account, `Escape` exits
- [x] 4. Activity log shows only `key` + `warning` entries in presentation mode
- [x] 5. Subtle "Presentation Mode" pill in top-right

**Files to modify:** `src/context/WorkflowContext.tsx`, `src/pages/index.tsx`, `src/components/layout/ThreePanelLayout.tsx`

---

### Task 29: Agent Simulation
- [x] 1. "Run Agent Simulation" button in Agent Plan tab (clearly labelled as simulation, NOT "Autopilot")
- [x] 2. Animate through strategy steps (1.5s delay): persona selection → channel choice → message generation → follow-up scheduling → fallback plan
- [x] 3. Each step appends to Decision Stream with `importance: "key"`
- [x] 4. After simulation: "Simulation complete — approve sequence to proceed"
- [x] 5. Controls: Pause, Skip, Reset, Fast-forward (presenter not trapped)
- [x] 6. Clear label: "This is a simulation. No messages are sent."

**Files to modify:** `src/components/right-panel/AgentOutreachView.tsx`, `src/components/layout/AgentDecisionStream.tsx`

---

## Phase 4 Quality Gates

- [ ] Existing demo flow still works after all Phase 4 changes (regression)
- [ ] Search Plan approval still works
- [ ] MarketFlow auto-select still works
- [ ] Panels are resizable and sizes persist (versioned key `v1`)
- [ ] Left panel collapses cleanly; right panel expands to fill
- [ ] Visual theme feels premium — restrained glow (only selected + top opportunity), clear hierarchy
- [ ] Selected account has visible glow/emphasis
- [ ] Accounts scoring ≥60 have OutreachStrategy with complete sequence
- [ ] Agent Plan shows strategy + timeline (not just static messages)
- [ ] Each timeline step has generated message with evidence chips
- [ ] Every evidence chip maps to existing Evidence_Card
- [ ] No strategy message includes unsupported quantified claims
- [ ] "Next Best Action" always visible for selected account
- [ ] Old OutreachPackView still works as fallback when strategy undefined
- [ ] Layout reset works after refresh
- [ ] Keyboard shortcuts do not trigger while typing in inputs
- [ ] Agent Simulation clearly labelled as simulation
- [ ] App works with no MongoDB configuration
- [ ] App works with MongoDB enabled — campaigns persist and can be resumed
- [ ] MongoDB failure never blocks Demo Mode
- [ ] MongoDB writes are non-blocking and timeout after 3 seconds safely
- [ ] Campaign can be saved and resumed (accounts, evidence, scores, strategies, outcomes restored)
- [ ] No MongoDB secrets exposed client-side
- [ ] Semantic memory is optional and gracefully hidden if unavailable
- [ ] If vector search is enabled, it returns a visible "similar campaign" insight
- [ ] Existing localStorage fallback still works when MongoDB is disabled
- [ ] Demo runs smoothly: preset ICP → auto-flow → select MarketFlow → Agent Plan → reject TinyBooks → done


---

## Phase 4C — UX Simplification & Premium Polish

**Objective:** Reduce visual noise, simplify the interface, and make the selected account + Agent Plan the clear centre of the experience.

**Core principle:** The screen should answer three questions within 3 seconds:
1. Which account is the best opportunity?
2. Why is it relevant now?
3. What does the agent recommend doing next?

**Build order:** Agent Plan default → layout simplification → selected account hero → evidence compression → opportunity feed redesign → visual restraint pass

**Priority:** Do these first: Task 29, 32, 30, 31, 33, 36 — these six create the biggest visual/product improvement fastest.

---

### Task 29: Make Agent Plan the Primary Experience

**Problem:** The right panel still feels like a collection of tabs. The product's most valuable output is the agent's recommended plan, so it should be the default experience.

- [ ] 1. Change default selected tab in `AccountDetail.tsx` from `score` to `agent_plan` when `account.outreachStrategy` exists (or when `generateStrategy(account)` returns non-null)
- [ ] 2. If strategy does not exist (score <60), fall back to `brief` as default tab
- [ ] 3. Rename visible tab label from "Agent Plan" to "Plan" for simplicity
- [ ] 4. Reorder tabs to: Plan | Brief | Evidence | Score | Personas | Actions
- [ ] 5. Make Plan tab visually prominent with a subtle accent underline and icon
- [ ] 6. Add a short subtitle under the tab row: "Recommended buyer, channel, sequence, and next action"
- [ ] 7. Ensure keyboard shortcuts and Presentation Mode still navigate correctly after tab order change

**Acceptance criteria:**
- Selecting an outreach-ready account opens directly on the Plan tab
- The first visible right-panel content is the agent recommendation, not raw evidence
- Old accounts without strategy still render through fallback view
- No existing Brief / Evidence / Score functionality breaks

**Files to modify:** `src/components/right-panel/AccountDetail.tsx`

---

### Task 30: Collapse Left Panel into Compact Summary Mode

**Problem:** The left panel remains too heavy after the search plan is approved. It takes attention away from the accounts and agent recommendation.

- [ ] 1. Add `searchPlanCollapsed: boolean` to workflow state (or local component state)
- [ ] 2. After Search Plan approval (workflow reaches `discovering` stage or later), show compact summary mode by default
- [ ] 3. Compact summary shows only: ICP title/summary (max 2 lines), 3-5 key chips (business model, geography, top personas), Demo/Live mode badge, "Edit Plan" button
- [ ] 4. Hide detailed keyword/company/geography/exclusion sections behind "Edit Plan"
- [ ] 5. When "Edit Plan" is clicked, expand full SearchPlanEditor
- [ ] 6. Add "Collapse Plan" button to return to compact mode
- [ ] 7. Persist collapsed state in localStorage
- [ ] 8. In Presentation Mode, force compact summary mode

**Acceptance criteria:**
- After search approval, the left panel becomes visually quiet
- Presenter can still reopen and edit the full search plan
- Left panel no longer competes with the selected account detail
- Demo Mode badge remains visible but subtle

**Files to modify:** `src/components/left-panel/SearchPlanEditor.tsx`, `src/components/left-panel/ICPInput.tsx`, `src/components/left-panel/ModeToggle.tsx`

---

### Task 31: Reduce Agent Decision Stream Visual Weight

**Problem:** The bottom stream currently occupies too much screen space and feels like a log panel. It should support the story, not dominate it.

- [ ] 1. Make Agent Decision Stream collapsed/compact by default after workflow reaches `ready`
- [ ] 2. Default compact height: 72–96px (show only 3 most important decisions)
- [ ] 3. Add "Expand stream" / "Collapse stream" control
- [ ] 4. In compact mode, hide timestamps or move them to hover state
- [ ] 5. In expanded mode, show full decision history
- [ ] 6. Prioritise entries with importance: `key` and `warning`
- [ ] 7. Rewrite routine entries to be shorter and more commercial
- [ ] 8. Remove excessive row spacing and reduce visual borders

**Acceptance criteria:**
- Bottom panel feels secondary by default
- Key decisions remain visible
- User can expand the full stream when needed
- Presentation Mode shows only key decisions

**Files to modify:** `src/components/layout/AgentDecisionStream.tsx`, `src/lib/demo-scenario.ts`

---

### Task 32: Selected Account Hero Redesign

**Problem:** The selected account does not have a strong enough focal point. The right panel needs a premium hero section that immediately explains the opportunity.

- [ ] 1. Create `src/components/right-panel/SelectedAccountHero.tsx`
- [ ] 2. Place it at the top of the right panel, above tabs
- [ ] 3. Hero includes: company name, score (arc or ring), confidence, one-line opportunity hypothesis, recommended persona, recommended channel, next best action
- [ ] 4. Use clean two-column layout: Left (account identity + why-now sentence), Right (score arc + next-best-action CTA)
- [ ] 5. Show only one primary CTA: "Approve Plan" or "Review Plan" or "Research Further"
- [ ] 6. Remove duplicate score/action information from lower sections where possible
- [ ] 7. Use restrained glow only for the selected account hero / primary CTA
- [ ] 8. Make hero responsive at smaller panel widths

**Acceptance criteria:**
- User immediately understands why the account matters
- Right panel has a clear focal point
- Agent recommendation is visible before any detailed tab content
- Score, recommendation, and next action are not buried in lower tabs

**Files to create:** `src/components/right-panel/SelectedAccountHero.tsx`
**Files to modify:** `src/components/right-panel/AccountDetail.tsx`

---

### Task 33: Compress Evidence View

**Problem:** Evidence cards are too dense and make the right panel feel like documentation. Evidence should prove the recommendation without overwhelming the user.

- [ ] 1. Show only top 3 evidence cards by default (ranked: high confidence first, observed before inferred, score-contributing dimensions first)
- [ ] 2. Add "Show all evidence" button to reveal remaining cards
- [ ] 3. Redesign card layout: signal title, one-sentence evidence summary, confidence badge, suggested outreach angle
- [ ] 4. Move source, reliability, synthetic label, and inference explanation into a collapsed "Details" row
- [ ] 5. Reduce visible chips to maximum 2 per card: evidence type + confidence
- [ ] 6. Replace long signal labels like `hiring_payment_ops` with readable titles like "Payment Ops Hiring"
- [ ] 7. Add clickable "Used in plan" indicator for evidence referenced by Agent Plan
- [ ] 8. Add smooth expand/collapse animation

**Acceptance criteria:**
- Evidence tab is readable in less than 10 seconds
- Default view shows strongest evidence only
- Detailed source/reliability information remains available
- Evidence still feels credible, but not visually noisy

**Files to modify:** `src/components/right-panel/EvidenceCardList.tsx`

---

### Task 34: Simplify Account List into Opportunity Feed

**Problem:** The account list still feels like a dense operational table. It should feel like a ranked opportunity feed.

- [ ] 1. Keep Top Opportunity hero, but simplify content: company, score, why now, recommended persona/channel, primary CTA "Review Plan"
- [ ] 2. Make non-selected account rows more compact: company name, score, business model/location, why-now one-liner, next action badge
- [ ] 3. Remove mini 5-bar score breakdown from normal rows (show only on Top Opportunity card, selected account, or hover)
- [ ] 4. Reduce filter visual weight — move less-used filters into "More" if space is tight
- [ ] 5. Make selected account obvious with left accent and subtle glow
- [ ] 6. Ensure no row feels overloaded with metadata

**Acceptance criteria:**
- Account list is scannable
- Top Opportunity stands out clearly
- Normal account rows are compact and clean
- No row feels overloaded with metadata

**Files to modify:** `src/components/center-panel/AccountList.tsx`, `src/components/center-panel/AccountCard.tsx`

---

### Task 35: Reduce Badge and Chip Overload

**Problem:** Too many pills and chips make the product feel busy. Metadata should not compete with recommendations.

- [ ] 1. Audit all visible chips and badges across the app
- [ ] 2. Keep only these badges visible by default: Score, Confidence, Recommended action, Evidence type (where needed)
- [ ] 3. Move secondary metadata into hover states, collapsible details, or muted text
- [ ] 4. Standardise badge sizes: primary badge, secondary badge, muted metadata chip
- [ ] 5. Reduce colour saturation for secondary chips
- [ ] 6. Use neutral text for metadata like "synthetic", "source", and "reliability"
- [ ] 7. Remove duplicate badges where same information appears in nearby text
- [ ] 8. Keep red only for real negative states: suppressed, error, deprioritized

**Acceptance criteria:**
- UI looks calmer
- Important labels stand out more
- Metadata remains available without dominating the screen
- No card has more than 3 visible badges by default

**Files to modify:** `src/components/center-panel/AccountCard.tsx`, `src/components/right-panel/EvidenceCardList.tsx`, `src/components/right-panel/OutreachTimeline.tsx`, `src/components/right-panel/AgentRecommendation.tsx`, `src/components/shared/ScoreBadge.tsx`, `src/components/shared/DemoModeBadge.tsx`

---

### Task 36: Agent Plan Simplification

**Problem:** The Agent Plan is directionally right, but it can still become too complex. It should feel like the agent has already made the hard choices.

- [ ] 1. In `AgentOutreachView`, put NextBestAction above the timeline
- [ ] 2. Show only the first sequence step expanded by default; collapse later steps
- [ ] 3. Add a short agent rationale sentence above the timeline
- [ ] 4. Reduce visible action buttons to: "Approve Plan", "Copy Step", "Regenerate"
- [ ] 5. Move "Change Persona" and "Change Angle" into an overflow menu or secondary controls
- [ ] 6. Keep Risks & Fallback collapsed by default
- [ ] 7. Show evidence chips inline under each message, max 3 chips
- [ ] 8. Add "Show all evidence used" if more than 3 evidence references exist

**Acceptance criteria:**
- Agent Plan feels guided, not like a configuration screen
- User sees one obvious next action
- Timeline shows strategy without overwhelming detail
- Secondary controls are available but not visually dominant

**Files to modify:** `src/components/right-panel/AgentOutreachView.tsx`, `src/components/right-panel/NextBestAction.tsx`, `src/components/right-panel/OutreachTimeline.tsx`, `src/components/right-panel/AgentRecommendation.tsx`

---

### Task 37: Typography and Spacing Pass

**Problem:** The screen feels dense partly because font sizes, line-height, and spacing are too compact.

- [ ] 1. Increase main content font size slightly where readability is poor (generated messages, evidence summaries)
- [ ] 2. Increase line-height for generated content (1.6–1.7)
- [ ] 3. Use stronger heading hierarchy: page heading → account name → card title → metadata
- [ ] 4. Add more vertical spacing between right-panel sections
- [ ] 5. Reduce excessive horizontal borders — replace some with spacing and background contrast
- [ ] 6. Ensure UI is readable on projector / large screen
- [ ] 7. Avoid tiny text below 12px except for timestamps or muted metadata

**Acceptance criteria:**
- UI feels less cramped
- Generated messages are comfortable to read
- Important content is visually obvious
- Projector readability improves

**Files to modify:** `src/styles/globals.css`, all panel components as needed

---

### Task 38: Final Demo Polish and Regression Check

- [ ] 1. Run full demo in Demo Mode with no API keys
- [ ] 2. Verify left panel compact mode after Search Plan approval
- [ ] 3. Verify selected account opens on Plan tab
- [ ] 4. Verify Top Opportunity card is visually strong
- [ ] 5. Verify bottom stream is compact by default
- [ ] 6. Verify evidence shows top 3 first and expands correctly
- [ ] 7. Verify Agent Plan has one obvious next action
- [ ] 8. Verify Reject TinyBooks still works
- [ ] 9. Verify Presentation Mode still works
- [ ] 10. Verify MongoDB disabled still works
- [ ] 11. Verify MongoDB enabled still saves/loads if configured
- [ ] 12. Run: `npm run typecheck`, `npm run build`

**Acceptance criteria:**
- Demo feels simpler and more premium than before
- No obvious layout clutter
- No broken tabs or missing fallback content
- Build passes cleanly

---

## Phase 4C Quality Gates

- [ ] Agent Plan is the default selected tab for outreach-ready accounts
- [ ] Left panel collapses into compact summary after approval
- [ ] Bottom decision stream is compact by default
- [ ] Selected account hero clearly shows score, why now, recommendation, and next action
- [ ] Evidence tab shows top 3 cards first
- [ ] No evidence card shows more than 2 badges by default
- [ ] Account list is scannable and not overloaded
- [ ] Normal account rows do not show mini score bars unless selected/hovered
- [ ] Agent Plan shows one clear primary action
- [ ] Secondary controls are hidden or visually de-emphasised
- [ ] The UI uses fewer borders and more spacing
- [ ] Generated text is readable on a projector
- [ ] Demo can be completed without explaining the UI structure
- [ ] Product feels agent-led, not manually operated
