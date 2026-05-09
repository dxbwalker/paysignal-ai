# Requirements Document

## Introduction

PaySignal AI is an agentic payments opportunity radar that identifies companies with visible payment complexity across LinkedIn and the broader public web, explains the evidence behind each opportunity, scores commercial potential, and generates tailored outreach packs for payment automation providers. The system takes a natural language ICP description, decomposes it into a search strategy, discovers target accounts, enriches them with web-sourced payment complexity evidence, scores opportunity size across five explainable dimensions, matches buyer personas, generates evidence-backed outreach packs with Account Opportunity Briefs, and uses user feedback to improve future search, scoring, and messaging recommendations — all orchestrated through an agent-driven workflow that shows concise decision rationales and evidence summaries at every step.

## Glossary

- **PaySignal_Agent**: The agent-orchestrated workflow that manages ICP decomposition, search planning, account discovery, evidence enrichment, scoring, persona matching, outreach generation, and campaign learning — and displays user-facing decision rationales, evidence summaries, confidence levels, and recommended next actions at each step
- **ICP_Analyzer**: The component that interprets a natural language ICP description and extracts structured search parameters including industries, company types, geographies, personas, and payment pain signals
- **Account_Discoverer**: The component responsible for discovering people and companies matching the Search_Plan, normalizing them into account-level records, deduplicating companies, and linking relevant people as potential buyer personas
- **Signal_Enrichment_Agent**: The agentic component that expands research beyond LinkedIn, searches public web sources for payment complexity signals, validates or weakens existing assumptions, assigns source reliability levels, and improves account scoring confidence
- **Evidence_Collector**: The component that gathers or infers payment complexity signals from available data, attaches source attribution, distinguishes direct evidence from inferred assumptions, and assigns confidence levels to each finding
- **Opportunity_Scorer**: The component that evaluates accounts across five weighted scoring dimensions and produces an explainable Opportunity_Score with dimension breakdowns, top contributing factors, and missing confidence factors
- **Persona_Matcher**: The component that identifies named contacts or recommends target roles within each account that are likely to influence or own payment automation decisions
- **Outreach_Pack_Generator**: The component that produces a complete multi-channel outreach pack and Account Opportunity Brief for a selected account, referencing only verified evidence from Evidence_Cards
- **Campaign_Learning_Module**: The component used by PaySignal_Agent to track outcomes, process user feedback (approvals, rejections with reason codes, response outcomes), and update campaign recommendations, keyword suggestions, exclusion rules, and scoring preferences — without retraining the LLM
- **Account**: A company record containing name, website (where available), location, LinkedIn URL, available company metadata, inferred industry, inferred business model classification, linked personas, evidence cards, and confidence level
- **Evidence_Card**: A structured finding containing: signal type, evidence type (observed or inferred), raw evidence, source (URL or data origin), source reliability level, inference explanation, confidence level (high/medium/low), why it matters for payment automation, and suggested outreach message angle
- **Opportunity_Score**: A composite score (0-100) comprising five weighted dimensions: payment complexity (30%), operational urgency (20%), automation fit (20%), buyer accessibility (15%), and confidence (15%)
- **Buyer_Persona**: A named contact or recommended target role within an account that is likely to influence or own payment automation decisions
- **Outreach_Pack**: A collection of personalized messages (email, LinkedIn message, call opener, follow-up, discovery questions) with evidence-backed decision rationale and a "why this account, why now" explanation
- **Account_Opportunity_Brief**: A concise one-page summary of why an account is relevant, what payment pain is likely, supporting evidence with sources, recommended personas, suggested outreach angle, and discovery questions
- **Search_Plan**: A structured decomposition of the ICP into target industries, company types, geographies, buyer personas, keywords, and exclusion criteria — editable by the user before discovery begins
- **Campaign_Feedback**: An automated report containing performance metrics, signal effectiveness analysis, and actionable improvement recommendations — clearly labelled as baseline when no real outcomes exist
- **Demo_Mode**: A clearly labelled operating state using preloaded, evidence-rich sample accounts when live data sources are unavailable or when the presenter chooses a stable demo flow
- **Live_Mode**: An operating state where PaySignal AI uses configured live APIs for discovery, enrichment, scoring, and generation, with graceful fallback to Demo_Mode where needed

## Requirements

### Requirement 1: ICP Understanding and Search Plan Generation

**User Story:** As a sales operator, I want the agent to interpret my natural language ICP and generate a structured search plan, so that I get intelligent targeting without manually crafting search queries.

#### Acceptance Criteria

1. THE ICP_Analyzer SHALL accept a natural language ICP description between 20 and 2000 characters
2. WHEN an ICP description is submitted, THE ICP_Analyzer SHALL extract target industries, company types, geographies, buyer personas, and payment pain signals from the text into structured Search_Plan fields
3. WHEN extraction is complete, THE PaySignal_Agent SHALL generate a Search_Plan containing at least one keyword and any identified target company types, geographic filters, persona targets, and exclusion criteria
4. WHEN Search_Plan generation is complete, THE PaySignal_Agent SHALL display the generated Search_Plan to the user for approval or editing before initiating discovery
5. IF the ICP description contains fewer than two of the following targeting dimensions — industry, geography, company stage, business model, or buyer persona — THEN THE ICP_Analyzer SHALL suggest narrowing by the missing dimensions while still generating a Search_Plan from available information
6. WHEN the user approves or edits the Search_Plan, THE PaySignal_Agent SHALL initiate account discovery
7. WHEN ICP decomposition is complete, THE PaySignal_Agent SHALL log its ICP decomposition decision rationale in the agent activity log
8. IF the submitted ICP description is fewer than 20 characters or contains no identifiable business context, THEN THE ICP_Analyzer SHALL reject the input and display an error message indicating that the description must include at least one business-relevant targeting concept

### Requirement 2: Account Discovery

**User Story:** As a sales operator, I want the system to discover companies matching my ICP, so that I get a fresh list of target accounts without manual research.

#### Acceptance Criteria

1. WHEN account discovery is initiated, THE Account_Discoverer SHALL call the Apify LinkedIn Lead Scraper API with the approved Search_Plan keywords and location filters
2. THE Account_Discoverer SHALL request up to 30 results per search query
3. WHEN the Apify API returns results, THE Account_Discoverer SHALL identify people whose profiles match the Search_Plan keywords and persona targets, extract their associated companies, and normalize company-level data into Account records containing at minimum: company name, LinkedIn URL, location, and inferred business model classification
4. IF a returned profile has no associated company name, THEN THE Account_Discoverer SHALL exclude that profile from Account normalization and retain it only as an unlinked Buyer_Persona candidate in the activity log
5. THE Account_Discoverer SHALL classify each account by business model (marketplace, platform, gig economy, SaaS, logistics, creator economy, healthcare payments, or other) based on available metadata
6. THE Account_Discoverer SHALL deduplicate accounts by company name, LinkedIn URL, and website where available
7. IF deduplication confidence is low (e.g., fuzzy company name match without matching LinkedIn URL or website), THE Account_Discoverer SHALL keep accounts separate and flag them as possible duplicates rather than merging automatically
8. THE Account_Discoverer SHALL preserve the original matched people as potential Buyer_Persona candidates linked to the Account
9. IF the Apify API returns an error, the APIFY_API_KEY is not configured, or the API does not respond within 30 seconds, THEN THE Account_Discoverer SHALL switch to clearly labelled Demo_Mode with preloaded sample accounts and a visible "Demo dataset" indicator
10. THE PaySignal_Agent SHALL log discovery results and decision rationale in the agent activity log (e.g., "Found 24 people across 18 companies. Deduplicated to 15 accounts. Classified 7 as marketplaces, 4 as platforms.")

### Requirement 3: Evidence Collection from LinkedIn Data

**User Story:** As a sales operator, I want the system to extract payment complexity evidence from LinkedIn data, so that initial scoring has a factual basis.

#### Acceptance Criteria

1. WHEN accounts are discovered, THE Evidence_Collector SHALL gather observable payment complexity signals from available LinkedIn profile and company metadata within 10 seconds per account
2. THE Evidence_Collector SHALL detect signals from: job titles (payment/billing/AP/finance ops roles), company descriptions, business model indicators (marketplace, multi-party payouts), geographic presence signals (multi-country), and hiring patterns for payment operations roles
3. WHEN a payment complexity signal is detected, THE Evidence_Collector SHALL produce an Evidence_Card containing: signal type, evidence type, raw evidence, source attribution, source reliability level, inference explanation, confidence level (high/medium/low), why it matters for payment automation, and suggested outreach message angle
4. IF evidence is inferred rather than directly observed, THEN THE Evidence_Collector SHALL set the Evidence_Card evidence type to "inferred", keep the source reliability level as high, medium, or low, and explain the inference in the inference explanation field
5. THE Evidence_Collector SHALL attach all Evidence_Cards to their respective Account records
6. IF no evidence signals are detected for an account, THEN THE Evidence_Collector SHALL assign a low-confidence flag and list which signal categories (job titles, company descriptions, business model indicators, geographic presence, hiring patterns) were checked and found absent
7. THE Evidence_Collector SHALL assign source reliability levels to LinkedIn-sourced evidence as: "high" for data directly stated in company profiles or job postings, "medium" for data inferred from job titles or partial metadata, and "low" for data inferred from indirect indicators such as industry classification alone
8. IF LinkedIn profile or company metadata is incomplete or missing fields for an account, THEN THE Evidence_Collector SHALL proceed with available data, reduce the confidence level of resulting Evidence_Cards to reflect the limited source, and note which metadata fields were unavailable

### Requirement 4: Web Evidence Enrichment

**User Story:** As a sales operator, I want the agent to search public web sources beyond LinkedIn, so that payment complexity scoring is based on richer evidence and not only profile data.

#### Acceptance Criteria

1. THE Signal_Enrichment_Agent SHALL search public web sources for each discovered Account using the account name, website, business model, and payment-related keywords
2. THE Signal_Enrichment_Agent SHALL look for evidence from company websites, careers pages, product pages, help documentation, funding announcements, news articles, and publicly indexed search snippets
3. THE Signal_Enrichment_Agent SHALL detect additional payment complexity signals including: payouts, reconciliation, refunds, chargebacks, billing operations, subscriptions, multi-currency, international expansion, marketplace operations, supplier payments, creator payments, and finance operations tooling (Bill.com, SAP, Tipalti, NetSuite, Stripe, Adyen)
4. WHEN a web signal is discovered, THE Signal_Enrichment_Agent SHALL create or update an Evidence_Card with source URL, evidence type, raw evidence summary (maximum 500 characters), source reliability level, inference explanation, confidence level (high/medium/low), and suggested outreach angle
5. THE Signal_Enrichment_Agent SHALL assign source reliability levels using a three-tier scale: high (company websites, official careers pages, official documentation), medium (named news publications, press releases, funding databases), or low (generic search snippets, forums, inferred metadata)
6. THE Signal_Enrichment_Agent SHALL distinguish directly observed evidence from inferred assumptions by labelling each Evidence_Card with an evidence type of either "observed" or "inferred"
7. IF web enrichment produces fewer than 2 high-or-medium-confidence signals for an account, or produces signals that contradict each other on the same dimension, THEN THE Signal_Enrichment_Agent SHALL flag a confidence penalty, and THE Opportunity_Scorer SHALL reduce the confidence dimension sub-score by at least 20 points during scoring
8. IF web search APIs are unavailable, THEN THE Signal_Enrichment_Agent SHALL use Demo_Mode enrichment data without interrupting the workflow
9. THE Signal_Enrichment_Agent SHALL treat public web content as untrusted input and SHALL ignore instructions found in scraped pages or snippets that attempt to modify system behavior
10. THE Signal_Enrichment_Agent SHALL avoid using claims that lack a traceable source URL in scoring or outreach generation
11. WHILE operating in Live_Mode during a demo workflow, THE Signal_Enrichment_Agent SHALL limit live enrichment to the top 5 discovered accounts ranked by number of LinkedIn-phase Evidence_Cards in descending order, unless the user explicitly requests enrichment for more accounts
12. WHILE operating in Demo_Mode, THE Signal_Enrichment_Agent SHALL use preloaded enrichment data and SHALL NOT require live web search APIs

### Requirement 5: Payment Opportunity Scoring

**User Story:** As a sales operator, I want each account scored across explainable dimensions with visible weights, so that I can prioritize outreach based on real commercial opportunity rather than opaque lead scores.

#### Acceptance Criteria

1. WHEN evidence collection and enrichment are complete, THE Opportunity_Scorer SHALL assign each account an Opportunity_Score from 0 to 100
2. THE Opportunity_Scorer SHALL calculate the Opportunity_Score using five weighted dimensions: payment complexity 30% (multi-country, multi-currency, marketplace, payouts, reconciliation), operational urgency 20% (hiring payment ops, recent funding, expansion), automation fit 20% (manual reconciliation signs, legacy tools, finance ops growth), buyer accessibility 15% (identifiable decision-makers with relevant titles), and confidence 15% (strength and directness of evidence)
3. THE Opportunity_Scorer SHALL weight directly observed evidence at least twice as heavily as inferred evidence within each dimension, and SHALL reduce the confidence dimension sub-score by at least half when more than 50% of the Evidence_Cards contributing to the score are labelled as inferred
4. THE Opportunity_Scorer SHALL display the score breakdown for each account showing each dimension's name, percentage weight, sub-score from 0 to 100, and the evidence signals that contributed to that dimension's sub-score
5. THE Opportunity_Scorer SHALL show the top 3 factors that increased the score and up to 3 missing factors that reduced confidence for each account
6. THE Opportunity_Scorer SHALL rank accounts in descending order by Opportunity_Score, using the confidence dimension sub-score as a tiebreaker when two or more accounts share the same total score
7. THE Opportunity_Scorer SHALL identify a recommended next action for each account: "generate outreach" for scores 60 and above, "research further" for scores 40-59, or "deprioritize" for scores below 40
8. WHILE an LLM API key is configured and available, THE Opportunity_Scorer SHALL use LLM-based scoring that considers the full ICP context and evidence
9. IF the LLM API is unavailable, THEN THE Opportunity_Scorer SHALL use rule-based scoring with the predefined dimension weights without interrupting the workflow
10. IF an account has no Evidence_Cards contributing to a given dimension, THEN THE Opportunity_Scorer SHALL assign a sub-score of 0 for that dimension and list the dimension as a missing factor in the score explanation
11. WHEN LLM-based scoring is used, THE Opportunity_Scorer SHALL use the LLM to classify signals, explain evidence, and propose dimension sub-scores, but SHALL still calculate the final Opportunity_Score using the predefined five-dimension weighting model

### Requirement 6: Buyer Persona Matching

**User Story:** As a sales operator, I want to know exactly who to contact at each account and why they are relevant, so that I reach the right decision-maker with the right message.

#### Acceptance Criteria

1. WHEN accounts are scored, THE Persona_Matcher SHALL identify or recommend up to 5 relevant buyer personas for each account, ranked by relevance to the account's payment complexity signals
2. THE Persona_Matcher SHALL rank personas holding the following titles above all other personas in the output: CFO, COO, Head of Payments, Head of Finance Operations, VP Product, Head of Platform, Operations Director, and Payment Operations Manager
3. THE Persona_Matcher SHALL produce a relevance explanation of 1 to 3 sentences for each persona, linking the persona's role to at least one payment complexity signal from the account's Evidence_Cards
4. THE Persona_Matcher SHALL filter out personas whose title does not indicate decision-making authority or operational responsibility for payments, finance operations, or platform/product infrastructure, even when keyword matching succeeds (e.g., a marketing manager at a payments company is not a buyer for payment automation)
5. WHEN persona data includes email or phone, THE Persona_Matcher SHALL attach contact information to the Buyer_Persona record
6. IF named contacts are unavailable, THEN THE Persona_Matcher SHALL recommend 1 to 3 target titles and 1 to 2 search queries tailored to the account's payment complexity for finding the right contacts

### Requirement 7: Outreach Pack Generation

**User Story:** As a sales operator, I want a complete outreach pack generated for each account with evidence-backed messaging, so that I can engage prospects with a payment-specific reason rather than generic cold outreach.

#### Acceptance Criteria

1. WHEN a user selects an account for outreach, THE Outreach_Pack_Generator SHALL generate a personalized Outreach_Pack for that account within 30 seconds
2. THE Outreach_Pack SHALL include: a personalized email (under 150 words), a LinkedIn connection message (under 50 words), a call opener with 2-3 talking points, a follow-up message (under 100 words), and 3 discovery questions tailored to the account's payment complexity signals
3. EACH message in the Outreach_Pack SHALL reference at least one evidence-backed payment pain signal from the account's Evidence_Cards
4. THE Outreach_Pack_Generator SHALL generate a suggested email subject line of no more than 60 characters
5. THE Outreach_Pack_Generator SHALL generate a "why this account, why now" explanation of no more than 100 words for the sales operator's internal reference
6. THE Outreach_Pack_Generator SHALL only reference evidence contained in the account's Evidence_Cards and SHALL NOT invent facts, customer names, metrics, integrations, or internal company challenges
7. THE Outreach_Pack_Generator SHALL keep all messages written in plain language without unexplained jargon and free of unsupported claims
8. WHILE an LLM API key is configured, THE Outreach_Pack_Generator SHALL use LLM-based generation as the primary generation method
9. IF the LLM API is unavailable, THEN THE Outreach_Pack_Generator SHALL use template-based generation with evidence-driven variable substitution
10. IF the selected account has fewer than 1 Evidence_Card, THEN THE Outreach_Pack_Generator SHALL display a message indicating insufficient evidence and SHALL NOT generate an Outreach_Pack

### Requirement 8: Account Opportunity Brief

**User Story:** As a sales operator, I want a concise opportunity brief for each high-scoring account, so that I can understand the full commercial case before outreach and share it with my team.

#### Acceptance Criteria

1. WHEN an account receives an Opportunity_Score of 60 or above, THE PaySignal_Agent SHALL generate an Account_Opportunity_Brief for that account
2. THE Account_Opportunity_Brief SHALL include: company summary (max 150 words), payment complexity hypothesis, supporting evidence (with sources and confidence levels), 2 to 5 likely pain points, recommended buyer personas, suggested outreach angle, and 3 discovery questions
3. THE Account_Opportunity_Brief SHALL label each piece of supporting evidence as either "Observed" (directly sourced from data) or "Inferred" (derived from assumptions) to distinguish evidence types
4. THE Account_Opportunity_Brief SHALL be copyable or exportable as structured text for CRM notes, sales preparation, or internal review
5. THE Account_Opportunity_Brief and Outreach_Pack SHOULD be exportable as structured JSON for CRM or workflow automation integration
6. THE Account_Opportunity_Brief SHALL be viewable from the account detail panel in the dashboard
7. IF an account scores below 60, THEN THE PaySignal_Agent SHALL display the account with a label of "Research further" for scores 40-59 or "Deprioritized" for scores below 40, and SHALL NOT generate an Outreach_Pack unless the user explicitly requests generation
8. IF an account scores 60 or above but has fewer than 2 Evidence_Cards with high or medium confidence, THEN THE Account_Opportunity_Brief SHALL include a visible low-evidence warning indicating which sections rely on limited data
9. THE Account_Opportunity_Brief SHALL only include claims that are traceable to Evidence_Cards or clearly labelled as hypotheses

### Requirement 9: Compliance and Human Approval

**User Story:** As a sales operator, I want compliance guardrails and human approval before any outreach is executed, so that the tool is credible and enterprise-ready.

#### Acceptance Criteria

1. THE PaySignal_Agent SHALL require explicit user confirmation (approve, copy, or export action) before any outreach message is sent, exported, or marked as ready for execution
2. THE PaySignal_Agent SHALL provide copy-only mode as the default execution mechanism
3. THE PaySignal_Agent SHALL NOT autonomously send outreach messages without explicit user action
4. THE PaySignal_Agent SHALL display source attribution linking each evidence-backed claim or account-specific reference in the outreach to its originating Evidence_Card
5. THE PaySignal_Agent SHALL support a suppression list where users can add accounts or personas to exclude from future campaigns, supporting at least 500 entries
6. THE PaySignal_Agent SHALL allow users to mark accounts or personas as opted out and prevent future outreach suggestions for them
7. IF a user enables an optional channel that may require prior consent, such as WhatsApp, SMS, or phone, THEN THE PaySignal_Agent SHALL display a channel-specific compliance warning that the user must acknowledge before copying or exporting that channel's outreach
8. THE PaySignal_Agent SHALL NOT automatically send WhatsApp, SMS, or phone outreach without explicit user action and user acknowledgment of a channel-specific compliance notice
9. THE PaySignal_Agent SHALL display a data handling notice explaining that users are responsible for using compliant data sources and lawful outreach channels
10. THE Outreach_Pack_Generator SHALL only reference evidence contained in the account's Evidence_Cards and SHALL NOT generate misleading claims, fabricated statistics, or statements not traceable to an Evidence_Card
11. THE PaySignal_Agent SHALL store only account records, linked personas, Evidence_Cards, Opportunity_Scores, generated Outreach_Packs, suppression entries, and campaign outcome data — and SHALL NOT persist raw API responses, prompt payloads, intermediate LLM outputs, or data unrelated to the active workflow
12. THE PaySignal_Agent SHALL allow campaign data, suppression entries, and generated outreach content to be cleared from local storage
13. IF a user attempts to generate or view an Outreach_Pack for a suppressed or opted-out account or persona, THEN THE PaySignal_Agent SHALL block generation and display a notice indicating the account or persona is on the suppression list
14. THE PaySignal_Agent SHALL display a notice that users must only connect and use data sources they are authorised to access and must comply with the terms of the underlying data providers

### Requirement 10: Campaign Learning and Feedback

**User Story:** As a sales operator, I want the agent to learn from my feedback and campaign outcomes and tell me how to improve, so that each campaign gets better without manual analysis.

#### Acceptance Criteria

1. THE Campaign_Learning_Module SHALL allow users to manually mark outcomes for each account: copied, approved, rejected, contacted, replied, booked meeting, not relevant, bounced, no response, or do not contact
2. WHEN a user rejects an account, THE Campaign_Learning_Module SHALL prompt for a rejection reason: wrong ICP, weak evidence, wrong geography, too small, wrong persona, not payment-heavy, or already contacted
3. THE Campaign_Learning_Module SHALL maintain campaign state tracking which accounts have been engaged, via which channel (email, LinkedIn, call, or other configured channel), and the outcome from the defined outcome list
4. THE Campaign_Learning_Module SHALL generate Campaign_Feedback summarizing: total accounts discovered, accounts engaged by channel, response outcomes, the top 3 signals most associated with positive outcomes (replied or booked meeting), and the bottom 3 signals most associated with negative outcomes (rejected, not relevant, or bounced)
5. THE Campaign_Learning_Module SHALL recommend ICP refinements based on comparing attributes of approved accounts with Opportunity_Score of 60 or above against attributes of rejected accounts
6. THE Campaign_Learning_Module SHALL recommend keywords, personas, and message angles that are associated with higher positive outcome rates (replied or booked meeting) compared to the campaign average
7. WHEN users reject accounts or mark outcomes, THE Campaign_Learning_Module SHALL update recommended search keywords, excluded company types, preferred evidence signals, and persona priorities for the next campaign
8. IF fewer than 5 accounts have been marked with response outcomes (contacted, replied, booked meeting, bounced, or no response), THEN THE Campaign_Learning_Module SHALL clearly label recommendations as baseline recommendations derived from scoring signal distribution and configured benchmark assumptions
9. WHEN every account with a recommended next action of "generate outreach" has been marked with an outcome from the defined outcome list, THE Campaign_Learning_Module SHALL automatically generate the Campaign_Feedback report

### Requirement 11: Demo-Ready Dashboard and Agent Decision Log

**User Story:** As a hackathon presenter, I want a polished dashboard that shows the full agentic workflow visually with decision rationales at every step, so that judges can see the intelligence behind each decision.

#### Acceptance Criteria

1. THE PaySignal_Agent SHALL display the workflow progression as: ICP → Search Plan → Accounts → Evidence → Scoring → Outreach Pack → Feedback, with the current active stage visually highlighted and completed stages marked as done
2. THE PaySignal_Agent SHALL show an agent activity log where each entry is no longer than 280 characters and displays decision rationales, evidence summaries, confidence changes, and recommended actions (e.g., "Found 24 people across 18 companies. Deduplicated to 15 accounts. Only 7 had strong payment-complexity evidence. Deprioritized 8 due to weak buyer fit or low evidence confidence.")
3. WHEN accounts are displayed, THE PaySignal_Agent SHALL show score breakdowns by each of the five Opportunity_Score dimensions (payment complexity, operational urgency, automation fit, buyer accessibility, confidence) in a visual format alongside the total score
4. THE PaySignal_Agent SHALL display Evidence_Cards for each account showing signal, evidence, source, confidence, and suggested angle
5. WHEN a user selects an account, THE PaySignal_Agent SHALL show a detail panel with: score breakdown, evidence cards, buyer personas, Account_Opportunity_Brief, and the generated Outreach_Pack
6. THE PaySignal_Agent SHALL render the interface using a dark theme with a three-panel layout: left (ICP and search plan), center (ranked accounts), right (selected account intelligence)
7. THE PaySignal_Agent SHALL include a bottom or side panel showing the agent's activity log and decision rationale
8. THE PaySignal_Agent SHALL support Demo_Mode with at least 5 preloaded sample companies and a visible "Demo Mode" badge displayed persistently while Demo_Mode is active
9. THE PaySignal_Agent SHALL color-code Opportunity_Scores: green for 80 and above, yellow for 60-79, gray for below 60
10. THE PaySignal_Agent SHALL provide a one-page Account_Opportunity_Brief view as the primary demo artifact for selected accounts, viewable as a single scrollable section without navigating away from the dashboard
11. THE PaySignal_Agent SHALL allow the presenter to switch manually between Live_Mode and Demo_Mode
12. WHEN a workflow stage completes or produces a decision, THE PaySignal_Agent SHALL append a new entry to the agent activity log within 2 seconds of stage completion
13. THE PaySignal_Agent SHALL allow the user to regenerate an Outreach_Pack or Account_Opportunity_Brief after editing evidence, personas, or the Search_Plan
14. FOR deprioritized accounts (score below 40), THE PaySignal_Agent SHALL show the main reason the account was deprioritized, such as weak evidence, poor buyer fit, low payment complexity, or insufficient confidence

### Requirement 12: Observability and Demo Reliability

**User Story:** As a hackathon presenter, I want the workflow to be reliable, transparent, and recoverable during a live demo, so that I can present confidently even if external APIs are slow or unavailable.

#### Acceptance Criteria

1. THE PaySignal_Agent SHALL show the current workflow status for each stage (ICP analysis, search planning, account discovery, evidence collection, web enrichment, scoring, and outreach generation) using one of the following states: pending, running, completed, warning, or failed
2. IF live discovery, web enrichment, or LLM generation fails or times out, THEN THE PaySignal_Agent SHALL display a fallback notification identifying which service failed, what fallback behavior is active (cached data, Demo_Mode, or rule-based alternative), and that the workflow is continuing
3. THE PaySignal_Agent SHALL cache demo account enrichment results, Evidence_Cards, score breakdowns, and generated Outreach_Packs in browser local storage for demo reliability, and SHALL allow the user to clear cached data through the application interface
4. WHILE operating in Demo_Mode or using cached enrichment data, THE PaySignal_Agent SHALL complete the workflow from ICP submission through scored account display for at least 5 accounts within 90 seconds
5. THE PaySignal_Agent SHALL log errors for debugging, redacting API keys, secrets, authentication tokens, and personal data from all log entries
6. IF a workflow stage fails in Live_Mode, THEN THE PaySignal_Agent SHALL display a prompt offering the user the option to continue with cached data or switch to Demo_Mode rather than blocking the entire workflow
7. IF an external API call (Apify, web search, or LLM) does not respond within 30 seconds, THEN THE PaySignal_Agent SHALL treat the call as failed and trigger the fallback behavior for that stage
8. THE PaySignal_Agent SHALL enforce a total demo workflow time budget and run external enrichment calls in parallel where possible, falling back to cached or Demo_Mode data if the workflow risks exceeding the 90-second demo target

### Requirement 13: Deployment and Configuration

**User Story:** As a developer, I want the application deployable to Vercel with minimal configuration and reliable demo data, so that I can ship and present confidently within the hackathon timeframe.

#### Acceptance Criteria

1. THE PaySignal_Agent SHALL be deployable to Vercel using the standard Next.js build process without a custom server entry point and without server-only Node.js APIs unsupported by Vercel's serverless runtime
2. THE PaySignal_Agent SHALL read all API keys and secrets exclusively from environment variables: APIFY_API_KEY, LLM_API_KEY, LLM_PROVIDER, WEB_SEARCH_API_KEY
3. THE PaySignal_Agent SHALL call Apify, LLM, and web search APIs only through server-side API routes or server actions and SHALL NOT expose API keys, tokens, or provider secrets to client-side code
4. IF none of the environment variables (APIFY_API_KEY, LLM_API_KEY, LLM_PROVIDER, WEB_SEARCH_API_KEY) are configured, THEN THE PaySignal_Agent SHALL start successfully in Demo_Mode without errors or user-visible warnings beyond the Demo_Mode badge
5. IF any individual API key (APIFY_API_KEY, LLM_API_KEY, or WEB_SEARCH_API_KEY) is not configured, THEN THE PaySignal_Agent SHALL degrade the corresponding capability to its fallback: Demo_Mode discovery for missing Apify access, Demo_Mode or cached enrichment for missing web search access, and rule-based scoring or template-based outreach for missing LLM access — while all other configured capabilities continue to use live APIs
6. THE PaySignal_Agent SHALL complete a production build (`next build`) with zero TypeScript errors and zero build failures
7. THE PaySignal_Agent SHALL support Demo_Mode as a fully functional operating state that exercises the complete workflow (ICP analysis, discovery, evidence collection, scoring, persona matching, and outreach generation) using preloaded seed data when live APIs are unavailable
8. THE PaySignal_Agent SHALL include seed data for at least 5 demo accounts, where each account contains at least 3 Evidence_Cards with distinct signal types, a complete Opportunity_Score breakdown across all 5 dimensions, at least one Buyer_Persona with title and relevance explanation, a generated Account_Opportunity_Brief, and a generated Outreach_Pack
