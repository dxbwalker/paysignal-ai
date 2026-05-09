# PaySignal AI

Evidence-backed payment complexity intelligence engine for sales teams.

PaySignal AI identifies companies with visible payment complexity, enriches them with LinkedIn and public web evidence, scores commercial opportunity across explainable dimensions, identifies buyer personas, and generates evidence-backed outreach packs with Account Opportunity Briefs.

## What makes it different

Generic outbound tools find people. PaySignal AI finds **payment complexity** and explains why an account is worth pursuing — with traceable evidence, explainable scores, and anti-hallucination guardrails.

## Core Workflow

```
ICP → Search Plan → Accounts → Evidence → Scoring → Brief → Outreach → Feedback
```

## Demo Mode

Runs fully without API keys using synthetic evidence-rich demo accounts. No live APIs required for a complete demo.

```bash
npm install
npm run dev
```

Demo dataset uses synthetic companies and synthetic evidence to demonstrate workflow behaviour. Live Mode uses configured providers.

## Environment Variables

```
APIFY_API_KEY=your-apify-key          # Optional: enables live LinkedIn discovery
LLM_API_KEY=your-llm-key              # Optional: enables AI scoring + generation
LLM_PROVIDER=openai                   # Optional: openai or anthropic
WEB_SEARCH_API_KEY=your-key           # Optional: enables web evidence enrichment
```

All keys are optional. Without them, the app runs in Demo Mode with full functionality using seed data.

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **UI:** React 18 + Tailwind CSS (dark theme)
- **Validation:** Zod runtime schemas
- **State:** React Context + useReducer
- **Deployment:** Vercel (zero-config)
- **Data:** Apify LinkedIn Scraper (optional)

## Deploy to Vercel

```bash
npm run build
vercel --prod
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript validation
npm run lint         # ESLint
```
