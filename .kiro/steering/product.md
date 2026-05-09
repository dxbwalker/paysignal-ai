# Product Overview

PaySignal AI is an evidence-backed payment complexity intelligence engine for sales teams.

## What It Does

Identifies companies with visible payment complexity, enriches them with LinkedIn and public web evidence, scores commercial opportunity across explainable dimensions, identifies buyer personas, and generates evidence-backed outreach packs with Account Opportunity Briefs.

## Core Workflow

```
ICP → Search Plan → Accounts → Evidence → Scoring → Brief → Outreach → Feedback
```

## Key Differentiators

- Finds **payment complexity** rather than just people
- Explains why an account is worth pursuing with traceable evidence
- Explainable scores across 5 weighted dimensions
- Anti-hallucination guardrails (observed vs inferred evidence distinction)
- Confidence penalties for low-quality evidence

## Dual Mode Operation

- **Demo Mode**: Runs fully without API keys using synthetic evidence-rich accounts. Default when no external keys are configured.
- **Live Mode**: Uses Apify (LinkedIn discovery), web search (evidence enrichment), and LLM (scoring + generation). Gracefully falls back to demo/template on any provider failure.

## Scoring Dimensions (weighted)

| Dimension | Weight |
|-----------|--------|
| Payment Complexity | 30% |
| Operational Urgency | 20% |
| Automation Fit | 20% |
| Buyer Accessibility | 15% |
| Confidence | 15% |

## Recommended Actions

- Score ≥ 60 → Generate outreach
- Score 40–59 → Research further
- Score < 40 → Deprioritize
