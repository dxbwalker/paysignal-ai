# Tech Stack & Build System

## Core Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 18 + Tailwind CSS (dark theme)
- **Validation**: Zod runtime schemas for all entities and API payloads
- **State Management**: React Context + useReducer (single WorkflowContext)
- **Styling**: Tailwind CSS with PostCSS + Autoprefixer
- **Deployment**: Vercel (zero-config)

## External Providers (all optional)

- **Apify**: LinkedIn Lead Scraper for live account discovery
- **OpenAI / Anthropic**: LLM scoring and outreach generation
- **Web Search API**: Evidence enrichment from public web
- **MongoDB**: Optional persistence layer for campaigns

## Path Aliases

- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Key Libraries

| Package | Purpose |
|---------|---------|
| next ^14.2 | Framework |
| react ^18.3 | UI |
| zod ^3.25 | Runtime validation |
| openai ^4.50 | LLM provider client |
| mongodb ^7.2 | Optional persistence |
| react-resizable-panels ^4.11 | Panel layout |
| dotenv ^16.4 | Environment loading |

## Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking (tsc --noEmit)
npm run validate:seed    # Validate seed/demo data integrity
npm run validate:scoring # Validate scoring logic
npm run validate:bundle  # Check client bundle for server-only imports
npm run validate:demo    # Validate demo workflow end-to-end
npm run validate:all     # Run all validation scripts
```

## Validation Scripts

Located in `scripts/` and run via `npx tsx`. These are not test suites but validation scripts that verify data integrity, scoring correctness, bundle safety, and demo workflow behavior.

## Environment Variables

All optional. Without them the app runs in Demo Mode:

| Variable | Purpose |
|----------|---------|
| APIFY_API_KEY | Enables live LinkedIn discovery |
| LLM_API_KEY | Enables AI scoring + generation |
| LLM_PROVIDER | "openai" or "anthropic" |
| WEB_SEARCH_API_KEY | Enables web evidence enrichment |
| MONGODB_URI | MongoDB connection string |
| MONGODB_DB_NAME | Database name (default: "paysignal") |
| MONGODB_ENABLE_PERSISTENCE | "true" to enable |
| MONGODB_MODEL_API_KEY | MongoDB model API key |

## TypeScript Configuration

- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- Incremental compilation
- JSX: preserve (handled by Next.js)
