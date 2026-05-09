# PaySignal AI — Demo Script

## Setup
- Open the app in browser (localhost:3000 or Vercel URL)
- App starts in Demo Mode with "Demo Mode" badge visible
- No API keys needed — everything works with synthetic seed data

## Demo Flow (90 seconds)

### 1. Introduction (10s)
> "PaySignal AI is an evidence-backed payment complexity intelligence engine. It doesn't just find leads — it finds payment complexity, proves it with evidence, scores commercial opportunity, and generates traceable outreach."

### 2. Enter ICP (10s)
- Click the **"Marketplaces & Platforms"** preset button
- ICP auto-populates: "Marketplaces and SaaS platforms expanding internationally with complex payouts, refunds, reconciliation, and finance operations..."
- Click **"🔍 Find Accounts"**

### 3. Watch Workflow Progress (15s)
- Workflow progress strip animates through stages: ICP ✓ → Discover ✓ → Evidence ✓ → Enrich ✓ → Score ✓ → Personas ✓ → Brief ✓ → Outreach ✓
- Activity log populates with decision rationale at each step
- 5 accounts appear in center panel, sorted by score

### 4. Show MarketFlow (Score 88) — Auto-selected (20s)
- **Score tab**: Show 5-dimension breakdown with bars (payment complexity 95, urgency 88, automation fit 85, buyer access 85, confidence 82)
- **Evidence tab**: Show 5 evidence cards with observed/inferred badges, source labels, confidence levels, and suggested outreach angles
- **Personas tab**: Show Sarah Chen (VP Payment Ops) and David Park (CFO) with relevance explanations
- **Brief tab**: Show the one-page Account Opportunity Brief with hypothesis, supporting evidence (observed/inferred labels), pain points, and discovery questions
- **Outreach tab**: Show email, LinkedIn message, call opener, follow-up — each referencing specific evidence. Show evidence traceability at bottom.

### 5. Show Deprioritized Account — TinyBooks (Score 32) (10s)
- Click TinyBooks in the account list
- Show the red "Deprioritized" badge
- Show the "why not" reason: "TinyBooks is a payment tool provider, not a company with payment operations complexity..."
- Show weak score breakdown (all dimensions low)

### 6. Reject TinyBooks (15s)
- Click **Actions** tab
- Click **Reject**
- Select reason: **"Not payment-heavy"**
- Activity log shows: "Rejected TinyBooks: not payment-heavy. Future searches should deprioritize similar accounts."

> "The agent learns from feedback. Next time, it will deprioritize small bookkeeping tools automatically."

### 7. Closing (10s)
> "Every claim in the outreach is traceable to an evidence card. No hallucination. No unsupported statistics. Just observable payment complexity, explained and scored."

## Key Points for Judges

1. **Evidence-backed, not AI-generated fluff** — every outreach claim links to a specific evidence card
2. **Explainable scoring** — 5 weighted dimensions, not a black box
3. **Anti-hallucination guardrails** — no unsupported claims, no fabricated metrics
4. **Agentic workflow** — decision rationale visible at every step
5. **Demo Mode as first-class** — works fully without any API keys
6. **Copy-only compliance** — no autonomous sending, human approval required

## If Asked About Live Mode
> "Live Mode connects to Apify for LinkedIn discovery and web search for evidence enrichment. The scoring and outreach generation work the same way — the only difference is where the evidence comes from."

## If Asked About Synthetic Data
> "Demo Mode uses synthetic companies and evidence to demonstrate the workflow. In Live Mode, evidence comes from real LinkedIn profiles and public web sources. The intelligence layer — scoring, persona matching, brief generation, and outreach — works identically on both."
