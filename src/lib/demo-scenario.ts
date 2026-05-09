/**
 * Demo scenario configuration — defines the default demo flow
 * for hackathon presentations.
 */

export const DEMO_SCENARIO = {
  /** Default ICP text to populate the input */
  defaultIcp:
    "Marketplaces and SaaS platforms expanding internationally with complex payouts, refunds, reconciliation, and finance operations. Series A+ companies with 50-500 employees hiring payment operations roles.",

  /** Preset ICP examples the presenter can click */
  presetIcps: [
    {
      label: "Marketplaces & Platforms",
      text: "Marketplaces and SaaS platforms expanding internationally with complex payouts, refunds, reconciliation, and finance operations. Series A+ companies with 50-500 employees hiring payment operations roles.",
    },
    {
      label: "Gig Economy & Creator Platforms",
      text: "Gig economy and creator economy platforms processing high-volume payouts to workers or creators across multiple countries. Companies struggling with instant vs. batch settlement and cross-border compliance.",
    },
    {
      label: "Enterprise SaaS Billing",
      text: "Enterprise SaaS companies with usage-based or hybrid billing models, managing subscription invoicing, dunning, and revenue recognition across international markets.",
    },
  ],

  /** Account to auto-select after scoring (highest score) */
  preferredAccountId: "account-marketflow",

  /** Account to demonstrate rejection/deprioritization */
  rejectAccountId: "account-tinybooks",

  /** Expected rejection reason for demo */
  rejectReason: "not_payment_heavy" as const,

  /** Demo narrative labels for activity log */
  narrativeLabels: {
    icpAnalysis: "Parsed ICP: targeting marketplaces and SaaS platforms with international payment complexity. Extracted 4 keywords, 2 company types, 1 geographic filter.",
    discovery: "Found 24 people across 18 companies. Deduplicated to 15 accounts. Classified 7 as marketplaces, 4 as platforms, 2 as gig economy, 2 as other.",
    evidenceCollection: "Collected 18 evidence cards across 5 accounts. 12 observed, 6 inferred. Strongest signals: payment ops hiring (4 accounts), multi-country presence (3 accounts).",
    enrichment: "Web enrichment added 7 new evidence cards. Confirmed payment complexity for MarketFlow (careers page) and GigConnect (about page). FreightPay evidence remains weak.",
    scoring: "Scored 5 accounts. 3 recommended for outreach (≥60), 1 for further research (48), 1 deprioritized (32). Top signal: multi-party payout complexity.",
    personaMatching: "Matched 5 buyer personas across 4 accounts. 3 VP+ level decision makers identified. TinyBooks has no relevant contacts.",
    briefGeneration: "Generated Account Opportunity Briefs for 3 qualifying accounts. MarketFlow brief highlights multi-PSP reconciliation burden.",
    outreachGeneration: "Generated outreach packs for 3 accounts. Each references specific evidence cards. No unsupported claims.",
  },
} as const;
