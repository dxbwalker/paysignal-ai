# PaySignal AI — Demo Script

## Prerequisites
- Open the app in browser (localhost:3000 or deployed Vercel URL)
- App starts in Demo Mode with "Demo Mode" badge visible
- No API keys needed — everything works with synthetic seed data
- No internet connection required for Demo Mode

## Demo Flow (90 seconds total)

### 1. Introduction (10s)
> "PaySignal AI is an evidence-backed payment complexity intelligence engine. It doesn't just find leads — it finds payment complexity, proves it with evidence, scores commercial opportunity across five explainable dimensions, and generates traceable outreach."

### 2. Enter ICP (10s)
**Sample ICP to use:**
```
Marketplaces and SaaS platforms expanding internationally with complex payouts, refunds, reconciliation, and finance operations. Series A+ companies with 50-500 employees processing multi-party payments across multiple countries.
```

- Click the **"Marketplaces & Platforms"** preset button (auto-populates the ICP above)
- Click **"🔍 Find Accounts"**

### 3. Watch Workflow Progress (15s)
- Workflow progress strip animates through stages:
  - ICP ✓ → Search Plan ✓ → Discover ✓ → Evidence ✓ → Enrich ✓ → Score ✓ → Personas ✓ → Brief ✓ → Outreach ✓
- Activity log populates with decision rationale at each step
- 5 accounts appear in center panel, sorted by score:
  1. **MarketFlow** — 88 (Marketplace, outreach ready)
  2. **GigConnect** — 76 (Gig Economy, outreach ready)
  3. **CloudScale** — 65 (SaaS, outreach ready)
  4. **FreightPay** — 48 (Logistics, research further)
  5. **TinyBooks** — 32 (Other, deprioritized)

### 4. Select MarketFlow (Score 88) — Primary Showcase (20s)
MarketFlow is auto-selected as the highest-scoring account. Walk through each tab:

- **Score tab**: Show 5-dimension breakdown with visual bars
  - Payment Complexity: 95 (weight 30%)
  - Operational Urgency: 88 (weight 20%)
  - Automation Fit: 85 (weight 20%)
  - Buyer Accessibility: 85 (weight 15%)
  - Confidence: 82 (weight 15%)
  - Top factors: multi-country split payments, team tripled, multi-PSP reconciliation

- **Evidence tab**: Show 5 evidence cards
  - Each card shows: signal type, observed/inferred badge, source label, confidence level, suggested outreach angle
  - Highlight that all evidence is "observed" (directly sourced)

- **Personas tab**: Show buyer personas
  - Sarah Chen (VP Payment Operations) — rank 1
  - David Park (CFO) — rank 2
  - Each has relevance explanation linking to payment complexity signals

- **Brief tab**: Show Account Opportunity Brief
  - Company summary, payment complexity hypothesis
  - Supporting evidence with observed/inferred labels and source attribution
  - 4 likely pain points, suggested outreach angle, 3 discovery questions

- **Outreach tab**: Show multi-channel outreach pack
  - Email (subject: "Scaling payouts without scaling headcount")
  - LinkedIn message (under 50 words)
  - Call opener with 3 talking points
  - Follow-up message
  - Evidence traceability: every claim links to an evidence card ID

### 5. Show Deprioritized Account — TinyBooks (Score 32) (10s)
- Click **TinyBooks** in the account list
- Show the red **"Deprioritized"** badge
- Show the "why not" reason: *"TinyBooks is a payment tool provider, not a company with payment operations complexity. They build invoicing software for freelancers — their customers have the pain, not TinyBooks itself."*
- Show weak score breakdown (all dimensions low, missing factors listed)

### 6. Reject TinyBooks — Feedback Loop (15s)
- Click **Actions** tab
- Click **Reject**
- Select reason: **"Not payment-heavy"**
- Activity log shows: *"Rejected TinyBooks: not payment-heavy. Future searches should deprioritize similar accounts."*

> "The agent learns from feedback. Next time, it will deprioritize small bookkeeping tools automatically and refine search keywords."

### 7. Closing Statement (10s)
> "Every claim in the outreach is traceable to an evidence card. No hallucination. No unsupported statistics. Just observable payment complexity, explained and scored across five dimensions, with human approval before any outreach is sent."

---

## Expected Accounts Summary

| # | Company | Model | Score | Action | Key Signal |
|---|---------|-------|-------|--------|------------|
| 1 | MarketFlow | Marketplace | 88 | Generate Outreach | 12K sellers, 4 countries, multi-PSP |
| 2 | GigConnect | Gig Economy | 76 | Generate Outreach | 45K workers, 3 countries, legacy migration |
| 3 | CloudScale | SaaS | 65 | Generate Outreach | 2,400 enterprise, usage-based billing |
| 4 | FreightPay | Logistics | 48 | Research Further | Conflicting evidence, weak signals |
| 5 | TinyBooks | Other | 32 | Deprioritize | Tool provider, not user of payment ops |

---

## Account to Select: MarketFlow
- Highest score (88), most complete evidence
- All 5 evidence cards are "observed" (high confidence)
- Named decision-maker with payment automation background
- Full outreach pack with evidence traceability

## Account to Reject: TinyBooks
- Lowest score (32), clearly wrong ICP
- Demonstrates the "why not" explanation capability
- Rejection feeds back into campaign learning

## Final Message to Judges
> "PaySignal AI doesn't just find companies — it finds payment complexity, proves it with traceable evidence, scores it across five explainable dimensions, and generates outreach that references only what we can prove. Every decision is visible. Every claim is sourced. And the agent learns from your feedback to get better with every campaign."

---

## Key Differentiators for Judges

1. **Evidence-backed, not AI-generated fluff** — every outreach claim links to a specific evidence card with source attribution
2. **Explainable scoring** — 5 weighted dimensions (30/20/20/15/15), not a black box
3. **Anti-hallucination guardrails** — no unsupported claims, no fabricated metrics, traceability validation built-in
4. **Agentic workflow** — decision rationale visible at every step in the activity log
5. **Demo Mode as first-class** — works fully without any API keys or internet connection
6. **Copy-only compliance** — no autonomous sending, human approval required before any outreach
7. **Campaign learning** — rejection reasons and outcomes feed back into future recommendations

---

## If Asked About Live Mode
> "Live Mode connects to Apify for LinkedIn discovery and web search APIs for evidence enrichment. The scoring engine, persona matching, brief generation, and outreach generation work identically — the only difference is where the evidence comes from. Live Mode gracefully falls back to Demo Mode if any API is unavailable."

## If Asked About Synthetic Data
> "Demo Mode uses synthetic companies with realistic evidence to demonstrate the full workflow in under 90 seconds. In Live Mode, evidence comes from real LinkedIn profiles and public web sources. The intelligence layer — scoring, persona matching, brief generation, and outreach — works identically on both real and synthetic data."

## If Asked About Scoring
> "The score is a weighted composite of five dimensions: payment complexity (30%), operational urgency (20%), automation fit (20%), buyer accessibility (15%), and confidence (15%). Observed evidence counts twice as much as inferred evidence. If more than half the evidence is inferred, the confidence score is halved. Every dimension shows which evidence cards contributed to it."

## Timing Budget
| Section | Duration | Cumulative |
|---------|----------|------------|
| Introduction | 10s | 10s |
| Enter ICP | 10s | 20s |
| Workflow Progress | 15s | 35s |
| MarketFlow Deep Dive | 20s | 55s |
| TinyBooks (Deprioritized) | 10s | 65s |
| Reject + Feedback | 15s | 80s |
| Closing | 10s | 90s |
