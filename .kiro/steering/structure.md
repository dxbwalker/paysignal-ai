# Project Structure

```
src/
├── components/          # React UI components
│   ├── center-panel/    # Account list, cards, workflow progress
│   ├── layout/          # Three-panel layout, bottom panel, agent stream
│   ├── left-panel/      # ICP input, search plan editor, mode toggle
│   ├── right-panel/     # Account detail, scores, outreach, briefs
│   └── shared/          # Reusable: badges, loading states, empty states
├── context/             # React Context (WorkflowContext with useReducer)
├── lib/                 # Core business logic (server + shared)
│   └── providers/       # External service adapters (apify, llm, web-search, demo)
├── pages/               # Next.js Pages Router
│   ├── api/             # API routes (serverless functions)
│   └── index.tsx        # Single-page app entry
├── styles/              # Global CSS (Tailwind base)
└── types/               # Shared TypeScript type definitions (index.ts)

scripts/                 # Validation scripts (run via npx tsx)
docs/                    # Documentation (demo script)
```

## Architecture Patterns

### API Routes (`src/pages/api/`)
- Each route is a single serverless function handling one workflow step
- Always validate method (POST only for mutations)
- Use `assertServerSide()` guard to prevent client-side import
- Return structured responses matching Zod schemas
- Graceful fallback to demo data on provider failure

### Provider Pattern (`src/lib/providers/`)
- Factory function `createProviders()` returns a unified `ProviderSet` interface
- Each provider (apify, llm, web-search) has a `*WithStatus` method returning `{ data, error }` for graceful error handling
- Demo provider always available as fallback
- Provider selection based on env config capability matrix

### State Management (`src/context/`)
- Single `WorkflowContext` with `useReducer` for all app state
- Actions are typed discriminated unions (`WorkflowAction`)
- Workflow stages tracked as a state machine
- Suppression list persisted to localStorage via cache utility

### Component Organization
- Components grouped by panel position in the three-panel layout
- Shared components are generic/reusable (badges, loading, empty states)
- Components import types from `@/types` and use `@/` path alias

### Validation & Schemas (`src/lib/schemas.ts`)
- All entities defined as Zod schemas
- API request/response schemas derived from entity schemas
- Runtime validation before state updates
- Word count constraints enforced via Zod refinements

### Scoring (`src/lib/scoring.ts`)
- Rule-based scoring as default, LLM-assisted as enhancement
- Fixed weight model (30/20/20/15/15) always applied for final calculation
- Confidence penalties for flagged accounts and high inferred ratios
- Batch scoring with ranking (total score desc, confidence as tiebreaker)

## Key Conventions

- Server-only code must use `assertServerSide()` guard
- All API responses validated against Zod schemas before client consumption
- Evidence cards tagged as "observed" or "inferred" — this distinction drives scoring and confidence
- Fallback behavior is a first-class concern: every live provider must degrade gracefully
- Log messages are redacted via `log-redaction.ts` before display
- Activity log entries capped at 280 characters
