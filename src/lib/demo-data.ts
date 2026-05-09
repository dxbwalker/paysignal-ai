/**
 * Demo seed data — 5 accounts with full evidence, scores, personas, briefs, and outreach.
 * MarketFlow (88), GigConnect (76), CloudScale (65), FreightPay (48), TinyBooks (32)
 *
 * Score math uses dimension weights: payment_complexity 0.30, operational_urgency 0.20,
 * automation_fit 0.20, buyer_accessibility 0.15, confidence 0.15
 */

import type {
  Account,
  EvidenceCard,
  OpportunityScore,
  BuyerPersona,
  OutreachPack,
  AccountOpportunityBrief,
} from "@/types";

// ============================================================
// ACCOUNT 1: MarketFlow — Marketplace, Score 88
// Calculation: 95×0.30 + 88×0.20 + 85×0.20 + 85×0.15 + 82×0.15
//            = 28.5 + 17.6 + 17.0 + 12.75 + 12.3 = 88.15 → 88
// ============================================================

const marketflowEvidence: EvidenceCard[] = [
  {
    id: "ev-mf-1",
    signalType: "complex_payouts",
    evidenceType: "observed",
    rawEvidence:
      "MarketFlow processes split payments between 12,000+ sellers across 4 countries. Job posting mentions 'payout orchestration' and 'multi-party settlement'.",
    sourceLabel: "LinkedIn Job Posting",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Multi-party split payments across countries indicate extreme payment complexity that manual processes cannot scale.",
    suggestedOutreachAngle:
      "Reference their multi-country seller payout challenge and how autonomous agents handle split logic.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-mf-2",
    signalType: "hiring_payment_ops",
    evidenceType: "observed",
    rawEvidence:
      "Currently hiring 3 Payment Operations Analysts and 1 Senior Reconciliation Manager. Team has grown from 2 to 8 in 12 months.",
    sourceLabel: "LinkedIn Jobs",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Rapid payment ops hiring signals that manual processes are breaking under growth pressure.",
    suggestedOutreachAngle:
      "Ask about the cost of scaling the payment ops team vs. deploying autonomous agents.",
    dimension: "operational_urgency",
  },
  {
    id: "ev-mf-3",
    signalType: "manual_reconciliation",
    evidenceType: "observed",
    rawEvidence:
      "Careers page mentions 'daily reconciliation across Stripe, Adyen, and bank transfers' and 'exception handling for failed payouts'.",
    sourceLabel: "marketflow.io/careers",
    sourceUrl: "https://marketflow.io/careers",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Manual daily reconciliation across multiple PSPs is exactly the workflow agentic payments automates.",
    suggestedOutreachAngle:
      "Reference their multi-PSP reconciliation burden and how agents handle exceptions autonomously.",
    dimension: "automation_fit",
  },
  {
    id: "ev-mf-4",
    signalType: "recent_funding",
    evidenceType: "observed",
    rawEvidence:
      "Raised $28M Series B in Q1 2024. Press release mentions 'scaling marketplace operations internationally'.",
    sourceLabel: "TechCrunch",
    sourceUrl: "https://techcrunch.com/marketflow-series-b",
    sourceOrigin: "web",
    sourceReliability: "medium",
    confidenceLevel: "high",
    whyItMatters:
      "Fresh funding + international expansion = budget available and payment complexity increasing.",
    suggestedOutreachAngle:
      "Congratulate on funding, reference international expansion creating payment complexity.",
    dimension: "operational_urgency",
  },
  {
    id: "ev-mf-5",
    signalType: "decision_maker_present",
    evidenceType: "observed",
    rawEvidence:
      "VP of Payment Operations (Sarah Chen) has been in role 8 months. Previously led payment automation at a fintech.",
    sourceLabel: "LinkedIn Profile",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Decision maker with payment automation background is likely evaluating solutions.",
    suggestedOutreachAngle:
      "Reference her background in payment automation and how agents extend that vision.",
    dimension: "buyer_accessibility",
  },
];

const marketflowPersonas: BuyerPersona[] = [
  {
    id: "persona-mf-1",
    name: "Sarah Chen",
    title: "VP of Payment Operations",
    relevanceExplanation:
      "Directly owns payment operations including the reconciliation and payout processes that agentic payments would automate. Has payment automation background from previous fintech role.",
    email: "sarah.chen@marketflow.io",
    linkedinUrl: "https://linkedin.com/in/sarahchen",
    relevanceRank: 1,
  },
  {
    id: "persona-mf-2",
    name: "David Park",
    title: "CFO",
    relevanceExplanation:
      "Controls budget for payment operations headcount. The growing team cost (2→8 in 12 months) makes automation ROI a CFO-level conversation.",
    email: "david.park@marketflow.io",
    relevanceRank: 2,
  },
];

const marketflowScore: OpportunityScore = {
  total: 88,
  dimensions: [
    {
      name: "payment_complexity",
      weight: 0.3,
      subScore: 95,
      contributingSignals: ["ev-mf-1", "ev-mf-3"],
    },
    {
      name: "operational_urgency",
      weight: 0.2,
      subScore: 88,
      contributingSignals: ["ev-mf-2", "ev-mf-4"],
    },
    {
      name: "automation_fit",
      weight: 0.2,
      subScore: 85,
      contributingSignals: ["ev-mf-3"],
    },
    {
      name: "buyer_accessibility",
      weight: 0.15,
      subScore: 85,
      contributingSignals: ["ev-mf-5"],
    },
    {
      name: "confidence",
      weight: 0.15,
      subScore: 82,
      contributingSignals: ["ev-mf-1", "ev-mf-2", "ev-mf-3", "ev-mf-4", "ev-mf-5"],
    },
  ],
  topFactors: [
    "Multi-country split payments across 12K+ sellers",
    "Payment ops team tripled in 12 months",
    "Manual multi-PSP reconciliation confirmed on careers page",
  ],
  missingFactors: [],
  recommendedAction: "generate_outreach",
};

const marketflowBrief: AccountOpportunityBrief = {
  accountId: "account-marketflow",
  companySummary:
    "MarketFlow is a Series B marketplace platform processing split payments for 12,000+ sellers across 4 countries. They use Stripe and Adyen for payment processing and have rapidly scaled their payment operations team from 2 to 8 people in 12 months, indicating manual processes are breaking under growth.",
  paymentComplexityHypothesis:
    "MarketFlow's multi-party payout logic across multiple PSPs and countries creates reconciliation complexity that grows linearly with seller count. Their hiring pattern suggests they are solving this with headcount rather than automation.",
  supportingEvidence: [
    {
      claim: "Processes split payments for 12,000+ sellers across 4 countries",
      evidenceType: "observed",
      source: "LinkedIn Job Posting",
      confidenceLevel: "high",
      evidenceCardId: "ev-mf-1",
    },
    {
      claim: "Payment ops team grew from 2 to 8 in 12 months",
      evidenceType: "observed",
      source: "LinkedIn Jobs",
      confidenceLevel: "high",
      evidenceCardId: "ev-mf-2",
    },
    {
      claim: "Daily reconciliation across Stripe, Adyen, and bank transfers",
      evidenceType: "observed",
      source: "marketflow.io/careers",
      confidenceLevel: "high",
      evidenceCardId: "ev-mf-3",
    },
    {
      claim: "Raised $28M Series B with international expansion plans",
      evidenceType: "observed",
      source: "TechCrunch",
      confidenceLevel: "high",
      evidenceCardId: "ev-mf-4",
    },
  ],
  likelyPainPoints: [
    "Reconciliation across multiple PSPs consuming significant ops headcount",
    "Failed payout exception handling is manual and time-consuming",
    "International expansion multiplying payment complexity faster than team can scale",
    "Split payment logic becoming harder to maintain as seller count grows",
  ],
  recommendedPersonas: ["persona-mf-1", "persona-mf-2"],
  suggestedOutreachAngle:
    "Position agentic payments as the alternative to tripling the ops team again — autonomous agents that handle multi-PSP reconciliation, payout exceptions, and split logic without human intervention.",
  discoveryQuestions: [
    "How much time does your team spend on daily reconciliation across Stripe and Adyen?",
    "What happens when a payout fails for an international seller — how many people touch that exception?",
    "As you expand to new countries, how are you planning to scale payment operations?",
  ],
};

const marketflowOutreach: OutreachPack = {
  accountId: "account-marketflow",
  whyThisAccountWhyNow:
    "MarketFlow tripled their payment ops team in 12 months while processing split payments across 4 countries. They just raised Series B to expand internationally — meaning payment complexity will accelerate faster than they can hire.",
  email: {
    subject: "Scaling payouts without scaling headcount",
    body: "Hi Sarah,\n\nI noticed MarketFlow's payment ops team has grown from 2 to 8 in the past year — and you're still hiring. With split payments across 12K sellers in 4 countries, that growth makes sense.\n\nBut what if reconciliation across Stripe and Adyen didn't need a person at all?\n\nWe've built autonomous payment agents that handle multi-PSP reconciliation, failed payout exceptions, and split logic without human intervention. The goal is to stop payment ops scaling linearly with transaction volume.\n\nWorth a 15-minute look?",
  },
  linkedinMessage:
    "Hi Sarah — saw MarketFlow is scaling payment ops rapidly. We help marketplaces automate multi-PSP reconciliation with autonomous agents. Worth connecting?",
  callOpener: {
    talkingPoints: [
      "Reference their payment ops team growth (2→8) and ask if they expect to keep hiring at that rate",
      "Ask about their daily reconciliation process across Stripe and Adyen — how many hours per day?",
      "Introduce autonomous payment agents as an alternative to linear headcount scaling",
    ],
  },
  followUp:
    "Hi Sarah, following up on my note about payment automation. I saw you're also hiring a Senior Reconciliation Manager — that role is exactly what our agents replace. Happy to show you a 5-minute demo of how it works for multi-PSP marketplaces.",
  discoveryQuestions: [
    "How much time does your team spend on daily reconciliation across Stripe and Adyen?",
    "What happens when a payout fails for an international seller?",
    "As you expand to new countries, how are you planning to scale payment operations?",
  ],
  generatedAt: "2024-12-01T10:00:00Z",
  generationMethod: "template",
  claimEvidenceIds: ["ev-mf-1", "ev-mf-2", "ev-mf-3", "ev-mf-4", "ev-mf-5"],
};


// ============================================================
// ACCOUNT 2: GigConnect — Gig Economy, Score 76
// Calculation: 90×0.30 + 80×0.20 + 70×0.20 + 65×0.15 + 60×0.15
//            = 27.0 + 16.0 + 14.0 + 9.75 + 9.0 = 75.75 → 76
// ============================================================

const gigconnectEvidence: EvidenceCard[] = [
  {
    id: "ev-gc-1",
    signalType: "complex_payouts",
    evidenceType: "observed",
    rawEvidence:
      "GigConnect pays 45,000 gig workers weekly across UK, Germany, and France. Platform handles instant payouts and scheduled batch settlements.",
    sourceLabel: "Company About Page",
    sourceUrl: "https://gigconnect.co/about",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Weekly payouts to 45K workers across 3 countries with mixed instant/batch creates massive operational complexity.",
    suggestedOutreachAngle:
      "Reference the instant vs. batch payout challenge and how agents optimize routing decisions.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-gc-2",
    signalType: "multi_country",
    evidenceType: "observed",
    rawEvidence:
      "Operations in UK, Germany, France with plans to expand to Spain and Italy per recent job postings mentioning 'new market launch'.",
    sourceLabel: "LinkedIn Jobs",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Multi-country expansion multiplies payment compliance and currency complexity.",
    suggestedOutreachAngle:
      "Ask how they plan to handle payment compliance in 2 new markets without doubling the ops team.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-gc-3",
    signalType: "hiring_payment_ops",
    evidenceType: "observed",
    rawEvidence:
      "Hiring 'Payment Operations Lead' and 'Compliance & Payments Analyst' — both roles mention cross-border payout management.",
    sourceLabel: "LinkedIn Jobs",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Hiring for cross-border payment roles signals growing pain in managing international payouts.",
    suggestedOutreachAngle:
      "Position agents as handling the cross-border complexity these roles are meant to manage.",
    dimension: "operational_urgency",
  },
  {
    id: "ev-gc-4",
    signalType: "legacy_tools",
    evidenceType: "inferred",
    rawEvidence:
      "Job description mentions 'migrating from legacy batch processing to real-time settlement infrastructure'.",
    sourceLabel: "LinkedIn Job Posting",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    inferenceExplanation:
      "Migration language suggests current systems are outdated, though specific legacy tools are not named.",
    confidenceLevel: "medium",
    whyItMatters:
      "Legacy migration is the perfect moment to introduce agentic automation rather than rebuilding manual processes.",
    suggestedOutreachAngle:
      "Reference their migration as an opportunity to leapfrog to autonomous payment operations.",
    dimension: "automation_fit",
  },
  {
    id: "ev-gc-5",
    signalType: "finance_ops_growth",
    evidenceType: "observed",
    rawEvidence:
      "GigConnect blog post details their 'payment infrastructure roadmap for 2024' including real-time FX conversion and automated compliance checks.",
    sourceLabel: "GigConnect Engineering Blog",
    sourceUrl: "https://gigconnect.co/blog/payments-roadmap-2024",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Published roadmap confirms investment in payment infrastructure — they are actively looking for solutions.",
    suggestedOutreachAngle:
      "Reference their published roadmap and position agents as accelerating their 2024 payment goals.",
    dimension: "confidence",
  },
];

const gigconnectPersonas: BuyerPersona[] = [
  {
    id: "persona-gc-1",
    name: "Michael Torres",
    title: "Head of Payments",
    relevanceExplanation:
      "Directly responsible for the payout infrastructure serving 45K gig workers. Owns the migration from legacy batch processing to real-time settlement.",
    email: "m.torres@gigconnect.co",
    linkedinUrl: "https://linkedin.com/in/michaeltorres",
    relevanceRank: 1,
  },
  {
    id: "persona-gc-2",
    name: "Anna Kowalski",
    title: "COO",
    relevanceExplanation:
      "Oversees operations including the payment ops team expansion. Budget authority for infrastructure investments that reduce operational headcount.",
    linkedinUrl: "https://linkedin.com/in/annakowalski",
    relevanceRank: 2,
  },
];

const gigconnectScore: OpportunityScore = {
  total: 76,
  dimensions: [
    {
      name: "payment_complexity",
      weight: 0.3,
      subScore: 90,
      contributingSignals: ["ev-gc-1", "ev-gc-2"],
    },
    {
      name: "operational_urgency",
      weight: 0.2,
      subScore: 80,
      contributingSignals: ["ev-gc-3"],
    },
    {
      name: "automation_fit",
      weight: 0.2,
      subScore: 70,
      contributingSignals: ["ev-gc-4"],
    },
    {
      name: "buyer_accessibility",
      weight: 0.15,
      subScore: 65,
      contributingSignals: ["ev-gc-5"],
    },
    {
      name: "confidence",
      weight: 0.15,
      subScore: 60,
      contributingSignals: ["ev-gc-1", "ev-gc-2", "ev-gc-3", "ev-gc-5"],
    },
  ],
  topFactors: [
    "45K weekly payouts across 3 countries with instant/batch mix",
    "Expanding to 2 new markets — payment complexity accelerating",
    "Actively migrating from legacy batch processing",
  ],
  missingFactors: ["Limited direct evidence of current failure rates or cost of manual processes"],
  recommendedAction: "generate_outreach",
};

const gigconnectBrief: AccountOpportunityBrief = {
  accountId: "account-gigconnect",
  companySummary:
    "GigConnect is a gig economy platform paying 45,000 workers weekly across UK, Germany, and France. They handle both instant payouts and scheduled batch settlements, and are expanding to Spain and Italy while migrating from legacy batch processing to real-time infrastructure.",
  paymentComplexityHypothesis:
    "GigConnect's combination of high-volume weekly payouts, multi-country compliance, instant/batch routing decisions, and legacy migration creates a window where autonomous payment agents would deliver immediate value.",
  supportingEvidence: [
    {
      claim: "Pays 45K gig workers weekly across 3 countries",
      evidenceType: "observed",
      source: "Company About Page",
      confidenceLevel: "high",
      evidenceCardId: "ev-gc-1",
    },
    {
      claim: "Expanding to Spain and Italy",
      evidenceType: "observed",
      source: "LinkedIn Jobs",
      confidenceLevel: "high",
      evidenceCardId: "ev-gc-2",
    },
    {
      claim: "Migrating from legacy batch to real-time settlement",
      evidenceType: "inferred",
      source: "LinkedIn Job Posting",
      confidenceLevel: "medium",
      evidenceCardId: "ev-gc-4",
    },
    {
      claim: "Published payment infrastructure roadmap for 2024",
      evidenceType: "observed",
      source: "GigConnect Engineering Blog",
      confidenceLevel: "high",
      evidenceCardId: "ev-gc-5",
    },
  ],
  likelyPainPoints: [
    "Cross-border payout compliance across expanding markets",
    "Instant vs. batch routing decisions at scale",
    "Legacy system migration risk during growth",
    "FX conversion costs and timing across multiple currencies",
  ],
  recommendedPersonas: ["persona-gc-1", "persona-gc-2"],
  suggestedOutreachAngle:
    "Position the legacy migration as an opportunity to skip rebuilding manual processes and go straight to autonomous payment agents.",
  discoveryQuestions: [
    "How are you handling payout compliance as you expand to Spain and Italy?",
    "What percentage of payouts currently fail or require manual intervention?",
    "How is the migration from batch to real-time affecting your ops team workload?",
  ],
};

const gigconnectOutreach: OutreachPack = {
  accountId: "account-gigconnect",
  whyThisAccountWhyNow:
    "GigConnect is migrating from legacy batch processing while simultaneously expanding to 2 new countries. This is the exact moment where autonomous agents prevent them from rebuilding manual processes at larger scale.",
  email: {
    subject: "Real-time payouts without rebuilding ops",
    body: "Hi Michael,\n\nI saw GigConnect is migrating from batch processing to real-time settlement while expanding to Spain and Italy. That's a lot of moving parts.\n\nMost companies rebuild the same manual processes on new infrastructure. What if you skipped that step entirely?\n\nOur autonomous payment agents handle cross-border routing, compliance checks, and exception handling without human intervention — exactly what you need as payout volume grows across 5 countries.\n\nWould a quick demo be useful as you plan the migration?",
  },
  linkedinMessage:
    "Hi Michael — saw GigConnect is migrating to real-time payouts while expanding internationally. We help gig platforms automate cross-border payment ops. Worth a chat?",
  callOpener: {
    talkingPoints: [
      "Reference the batch-to-realtime migration and ask what the biggest operational risk is",
      "Ask how they handle failed payouts across 3 (soon 5) countries today",
      "Introduce autonomous agents as a way to avoid rebuilding manual processes on new infra",
    ],
  },
  followUp:
    "Hi Michael, following up — with the expansion to Spain and Italy, cross-border payout compliance gets significantly more complex. Our agents handle country-specific rules autonomously. Happy to show you how in 10 minutes.",
  discoveryQuestions: [
    "How are you handling payout compliance as you expand to Spain and Italy?",
    "What percentage of payouts currently fail or require manual intervention?",
    "How is the migration from batch to real-time affecting your ops team workload?",
  ],
  generatedAt: "2024-12-01T10:00:00Z",
  generationMethod: "template",
  claimEvidenceIds: ["ev-gc-1", "ev-gc-2", "ev-gc-3", "ev-gc-4", "ev-gc-5"],
};


// ============================================================
// ACCOUNT 3: CloudScale — SaaS, Score 65
// Calculation: 75×0.30 + 65×0.20 + 68×0.20 + 55×0.15 + 52×0.15
//            = 22.5 + 13.0 + 13.6 + 8.25 + 7.8 = 65.15 → 65
// ============================================================

const cloudscaleEvidence: EvidenceCard[] = [
  {
    id: "ev-cs-1",
    signalType: "billing_operations",
    evidenceType: "observed",
    rawEvidence:
      "CloudScale manages subscription billing for 2,400 enterprise customers with usage-based pricing tiers and annual/monthly mix.",
    sourceLabel: "Product Page",
    sourceUrl: "https://cloudscale.io/pricing",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Usage-based billing with enterprise customers creates complex invoicing and revenue recognition challenges.",
    suggestedOutreachAngle:
      "Reference usage-based billing complexity and how agents handle metering-to-invoice automation.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-cs-2",
    signalType: "ap_management",
    evidenceType: "inferred",
    rawEvidence:
      "Hiring 'Billing Operations Specialist' — role mentions 'invoice disputes', 'credit management', and 'dunning process optimization'.",
    sourceLabel: "LinkedIn Jobs",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    inferenceExplanation:
      "Hiring for billing ops with dunning focus suggests current processes are manual and causing revenue leakage.",
    confidenceLevel: "medium",
    whyItMatters:
      "Manual dunning and dispute handling at enterprise scale means revenue leakage that agents can prevent.",
    suggestedOutreachAngle:
      "Ask about their dunning recovery rate and how much revenue falls through manual processes.",
    dimension: "automation_fit",
  },
  {
    id: "ev-cs-3",
    signalType: "international_expansion",
    evidenceType: "observed",
    rawEvidence:
      "Recently opened offices in London and Singapore. Job posts mention 'multi-currency invoicing' and 'tax compliance across jurisdictions'.",
    sourceLabel: "LinkedIn Company Page",
    sourceOrigin: "linkedin",
    sourceReliability: "high",
    confidenceLevel: "medium",
    whyItMatters:
      "International expansion with multi-currency invoicing adds billing complexity that scales poorly with manual processes.",
    suggestedOutreachAngle:
      "Reference multi-currency invoicing challenge as they scale internationally.",
    dimension: "operational_urgency",
  },
  {
    id: "ev-cs-4",
    signalType: "finance_ops_growth",
    evidenceType: "observed",
    rawEvidence:
      "CloudScale's help docs reference integrations with Stripe Billing and NetSuite for revenue recognition, suggesting complex billing stack.",
    sourceLabel: "CloudScale Help Center",
    sourceUrl: "https://cloudscale.io/docs/integrations",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "medium",
    whyItMatters:
      "Multi-tool billing stack (Stripe + NetSuite) creates reconciliation overhead between systems.",
    suggestedOutreachAngle:
      "Reference the Stripe-to-NetSuite reconciliation challenge and how agents bridge billing systems.",
    dimension: "payment_complexity",
  },
];

const cloudscalePersonas: BuyerPersona[] = [
  {
    id: "persona-cs-1",
    name: "Priya Sharma",
    title: "Director of Revenue Operations",
    relevanceExplanation:
      "Owns the billing and revenue operations function including invoicing, dunning, and revenue recognition — the exact processes agentic payments would automate.",
    email: "priya.sharma@cloudscale.io",
    relevanceRank: 1,
  },
  {
    id: "persona-cs-2",
    name: "James Liu",
    title: "VP of Finance",
    relevanceExplanation:
      "Budget authority over finance operations tooling. International expansion is creating multi-currency complexity that falls under his purview.",
    linkedinUrl: "https://linkedin.com/in/jamesliu-cloudscale",
    relevanceRank: 2,
  },
];

const cloudscaleScore: OpportunityScore = {
  total: 65,
  dimensions: [
    {
      name: "payment_complexity",
      weight: 0.3,
      subScore: 75,
      contributingSignals: ["ev-cs-1", "ev-cs-4"],
    },
    {
      name: "operational_urgency",
      weight: 0.2,
      subScore: 65,
      contributingSignals: ["ev-cs-3"],
    },
    {
      name: "automation_fit",
      weight: 0.2,
      subScore: 68,
      contributingSignals: ["ev-cs-2"],
    },
    {
      name: "buyer_accessibility",
      weight: 0.15,
      subScore: 55,
      contributingSignals: [],
    },
    {
      name: "confidence",
      weight: 0.15,
      subScore: 52,
      contributingSignals: ["ev-cs-1", "ev-cs-3"],
    },
  ],
  topFactors: [
    "Usage-based billing for 2,400 enterprise customers",
    "International expansion creating multi-currency complexity",
    "Manual dunning process with revenue leakage risk",
  ],
  missingFactors: [
    "Limited direct evidence of payment failure rates",
    "No confirmed budget signals for automation investment",
  ],
  recommendedAction: "generate_outreach",
};

const cloudscaleBrief: AccountOpportunityBrief = {
  accountId: "account-cloudscale",
  companySummary:
    "CloudScale is a SaaS platform managing subscription billing for 2,400 enterprise customers with usage-based pricing. They recently expanded to London and Singapore, adding multi-currency invoicing complexity, and are hiring for billing operations roles focused on dunning and dispute management.",
  paymentComplexityHypothesis:
    "CloudScale's usage-based billing model combined with international expansion creates invoicing complexity that their current manual processes (evidenced by billing ops hiring) cannot scale efficiently.",
  supportingEvidence: [
    {
      claim: "Manages usage-based billing for 2,400 enterprise customers",
      evidenceType: "observed",
      source: "Product Page",
      confidenceLevel: "high",
      evidenceCardId: "ev-cs-1",
    },
    {
      claim: "Manual dunning and dispute handling",
      evidenceType: "inferred",
      source: "LinkedIn Jobs",
      confidenceLevel: "medium",
      evidenceCardId: "ev-cs-2",
    },
    {
      claim: "Multi-currency invoicing across new international offices",
      evidenceType: "observed",
      source: "LinkedIn Company Page",
      confidenceLevel: "medium",
      evidenceCardId: "ev-cs-3",
    },
    {
      claim: "Complex billing stack with Stripe Billing and NetSuite integration",
      evidenceType: "observed",
      source: "CloudScale Help Center",
      confidenceLevel: "medium",
      evidenceCardId: "ev-cs-4",
    },
  ],
  likelyPainPoints: [
    "Revenue leakage from manual dunning processes",
    "Multi-currency invoicing complexity as they expand internationally",
    "Invoice disputes consuming billing ops time",
    "Reconciliation overhead between Stripe Billing and NetSuite",
  ],
  recommendedPersonas: ["persona-cs-1", "persona-cs-2"],
  suggestedOutreachAngle:
    "Position agentic payments as the solution to revenue leakage — autonomous dunning, dispute resolution, and multi-currency invoicing that scales with their international growth.",
  discoveryQuestions: [
    "What's your current dunning recovery rate, and how much revenue do you estimate falls through?",
    "How is multi-currency invoicing being handled as you expand to London and Singapore?",
    "How many hours per week does your billing team spend on invoice disputes?",
  ],
  lowEvidenceWarning:
    "Automation fit score relies partially on inferred evidence from job postings. Direct confirmation of manual process pain would strengthen this assessment.",
};

const cloudscaleOutreach: OutreachPack = {
  accountId: "account-cloudscale",
  whyThisAccountWhyNow:
    "CloudScale is expanding internationally while hiring billing ops specialists for dunning and disputes. This signals manual processes breaking under growth — the exact moment autonomous billing agents deliver ROI.",
  email: {
    subject: "Dunning recovery at scale",
    body: "Hi Priya,\n\nWith 2,400 enterprise customers on usage-based billing and new offices in London and Singapore, I imagine invoice disputes and dunning are getting more complex, not less.\n\nWe've built autonomous billing agents that handle dunning sequences, dispute resolution, and multi-currency invoicing without manual intervention — so your team can focus on strategy rather than chasing failed payments.\n\nWorth a quick conversation?",
  },
  linkedinMessage:
    "Hi Priya — saw CloudScale is scaling billing ops internationally. We help SaaS companies automate dunning and multi-currency invoicing with autonomous agents. Interested?",
  callOpener: {
    talkingPoints: [
      "Ask about their dunning recovery rate and how much time the team spends on it",
      "Reference the international expansion and multi-currency invoicing challenge",
      "Introduce autonomous billing agents as a way to scale without proportional headcount",
    ],
  },
  followUp:
    "Hi Priya, following up — as CloudScale grows internationally, multi-currency invoicing and dunning complexity will only increase. Our agents handle both autonomously. Happy to show a 10-minute demo.",
  discoveryQuestions: [
    "What's your current dunning recovery rate?",
    "How is multi-currency invoicing being handled across your new offices?",
    "How many hours per week does your billing team spend on invoice disputes?",
  ],
  generatedAt: "2024-12-01T10:00:00Z",
  generationMethod: "template",
  claimEvidenceIds: ["ev-cs-1", "ev-cs-2", "ev-cs-3", "ev-cs-4"],
};


// ============================================================
// ACCOUNT 4: FreightPay — Logistics, Score 48 (Research Further)
// Calculation: 65×0.30 + 45×0.20 + 40×0.20 + 50×0.15 + 25×0.15
//            = 19.5 + 9.0 + 8.0 + 7.5 + 3.75 = 47.75 → 48
// Confidence penalty applied: confidence subScore reduced by 20 (45→25)
// due to conflicting/weak evidence (ev-fp-4 contradicts ev-fp-1)
// ============================================================

const freightpayEvidence: EvidenceCard[] = [
  {
    id: "ev-fp-1",
    signalType: "complex_payouts",
    evidenceType: "inferred",
    rawEvidence:
      "FreightPay appears to handle carrier payments for logistics companies. Company description mentions 'freight payment solutions' and 'carrier settlement'.",
    sourceLabel: "LinkedIn Company Page",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    inferenceExplanation:
      "Company description suggests payment complexity but does not confirm volume, multi-party structure, or manual processes.",
    confidenceLevel: "medium",
    whyItMatters:
      "Freight payments involve multi-party settlements between shippers, carriers, and brokers — potentially complex.",
    suggestedOutreachAngle:
      "Ask about their carrier payment volume and settlement process.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-fp-2",
    signalType: "legacy_tools",
    evidenceType: "inferred",
    rawEvidence:
      "One employee mentions 'SAP integration' in their LinkedIn skills. Another mentions 'QuickBooks' in their experience.",
    sourceLabel: "LinkedIn Profiles",
    sourceOrigin: "linkedin",
    sourceReliability: "low",
    inferenceExplanation:
      "Individual employee skills do not confirm company-wide tool usage. SAP and QuickBooks may be from previous roles.",
    confidenceLevel: "low",
    whyItMatters:
      "If confirmed, legacy tools like SAP suggest manual payment processes ripe for automation.",
    suggestedOutreachAngle:
      "Verify tool usage before referencing in outreach.",
    dimension: "automation_fit",
  },
  {
    id: "ev-fp-3",
    signalType: "payment_role",
    evidenceType: "observed",
    rawEvidence:
      "Has a 'Finance Manager' but no dedicated payment operations roles visible on LinkedIn.",
    sourceLabel: "LinkedIn Company Page",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    confidenceLevel: "medium",
    whyItMatters:
      "Small finance team without dedicated payment ops may indicate either low complexity or under-investment in automation.",
    suggestedOutreachAngle:
      "Unclear signal — needs further research before outreach.",
    dimension: "buyer_accessibility",
  },
  {
    id: "ev-fp-4",
    signalType: "marketplace_model",
    evidenceType: "inferred",
    rawEvidence:
      "FreightPay website mentions 'connecting shippers with carriers' but a competitor review site describes them as a 'simple invoicing tool for small fleets'.",
    sourceLabel: "FreightPay Website / TruckTechReview",
    sourceUrl: "https://freightpay.com",
    sourceOrigin: "web",
    sourceReliability: "low",
    inferenceExplanation:
      "Conflicting signals: company positions itself as a marketplace connector, but third-party review suggests simpler invoicing tool. Cannot confirm multi-party payment complexity.",
    confidenceLevel: "low",
    whyItMatters:
      "If truly a marketplace connector, payment complexity is high. If just an invoicing tool, complexity is low. Conflicting evidence prevents confident assessment.",
    suggestedOutreachAngle:
      "Do not reference in outreach until conflict is resolved through direct research.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-fp-5",
    signalType: "international_expansion",
    evidenceType: "inferred",
    rawEvidence:
      "One job posting mentions 'US and Canada operations' but company LinkedIn shows only 40 employees, all US-based.",
    sourceLabel: "LinkedIn Jobs",
    sourceOrigin: "linkedin",
    sourceReliability: "low",
    inferenceExplanation:
      "Job posting mentions Canada but no other evidence of international operations. May be aspirational rather than current.",
    confidenceLevel: "low",
    whyItMatters:
      "Cross-border operations would add payment complexity, but evidence is weak and possibly aspirational.",
    suggestedOutreachAngle:
      "Do not reference — insufficient evidence of actual international operations.",
    dimension: "operational_urgency",
  },
];

const freightpayPersonas: BuyerPersona[] = [
  {
    id: "persona-fp-1",
    name: "Emily Watson",
    title: "Finance Manager",
    relevanceExplanation:
      "Only identified finance contact. May own payment operations but title suggests broader finance scope rather than dedicated payment focus.",
    email: "emily@freightpay.com",
    relevanceRank: 1,
  },
];

const freightpayScore: OpportunityScore = {
  total: 48,
  dimensions: [
    {
      name: "payment_complexity",
      weight: 0.3,
      subScore: 65,
      contributingSignals: ["ev-fp-1", "ev-fp-4"],
    },
    {
      name: "operational_urgency",
      weight: 0.2,
      subScore: 45,
      contributingSignals: ["ev-fp-5"],
    },
    {
      name: "automation_fit",
      weight: 0.2,
      subScore: 40,
      contributingSignals: ["ev-fp-2"],
    },
    {
      name: "buyer_accessibility",
      weight: 0.15,
      subScore: 50,
      contributingSignals: ["ev-fp-3"],
    },
    {
      name: "confidence",
      weight: 0.15,
      subScore: 25,
      contributingSignals: [],
    },
  ],
  topFactors: [
    "Freight payment domain suggests multi-party complexity",
    "Finance Manager identified as potential contact",
  ],
  missingFactors: [
    "Conflicting evidence about business model (marketplace vs. simple invoicing tool)",
    "Legacy tool usage inferred from individual profiles, not confirmed at company level",
    "No urgency signals — no hiring surge, no funding, weak expansion evidence",
  ],
  recommendedAction: "research_further",
};


// ============================================================
// ACCOUNT 5: TinyBooks — Other, Score 32 (Deprioritized)
// Calculation: 28×0.30 + 30×0.20 + 25×0.20 + 40×0.15 + 45×0.15
//            = 8.4 + 6.0 + 5.0 + 6.0 + 6.75 = 32.15 → 32
// ============================================================

const tinybooksEvidence: EvidenceCard[] = [
  {
    id: "ev-tb-1",
    signalType: "other",
    evidenceType: "inferred",
    rawEvidence:
      "TinyBooks is a small accounting software company with 15 employees. Product focuses on invoicing for freelancers and micro-businesses.",
    sourceLabel: "LinkedIn Company Page",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    inferenceExplanation:
      "While they work in the payments/invoicing space, they are a tool provider, not a company with payment operations pain. Their customers have the pain, not TinyBooks itself.",
    confidenceLevel: "low",
    whyItMatters:
      "Low relevance — TinyBooks builds payment tools rather than needing payment automation for their own operations.",
    suggestedOutreachAngle: "Not recommended — wrong ICP fit.",
    dimension: "payment_complexity",
  },
  {
    id: "ev-tb-2",
    signalType: "billing_operations",
    evidenceType: "observed",
    rawEvidence:
      "TinyBooks processes subscription payments from their own customers via Stripe. Standard SaaS billing with no multi-party complexity.",
    sourceLabel: "TinyBooks Pricing Page",
    sourceUrl: "https://tinybooks.app/pricing",
    sourceOrigin: "web",
    sourceReliability: "high",
    confidenceLevel: "high",
    whyItMatters:
      "Simple subscription billing through Stripe — no payment complexity that would benefit from agentic automation.",
    suggestedOutreachAngle:
      "Not applicable — their billing is straightforward single-party SaaS subscriptions.",
    dimension: "automation_fit",
  },
  {
    id: "ev-tb-3",
    signalType: "decision_maker_present",
    evidenceType: "observed",
    rawEvidence:
      "Founder/CEO handles finance directly. No dedicated finance or payment operations team.",
    sourceLabel: "LinkedIn Profile",
    sourceOrigin: "linkedin",
    sourceReliability: "medium",
    confidenceLevel: "medium",
    whyItMatters:
      "CEO-as-finance-team confirms the company is too small for enterprise payment automation. No buyer persona with payment ops authority.",
    suggestedOutreachAngle:
      "Not recommended — company too small and no dedicated payment operations function.",
    dimension: "buyer_accessibility",
  },
];

const tinybooksPersonas: BuyerPersona[] = [
  {
    id: "persona-tb-1",
    name: "Alex Rivera",
    title: "Founder & CEO",
    relevanceExplanation:
      "Only decision-maker at the company. Handles finance directly but company is too small (15 employees) and has no payment complexity that would justify enterprise automation tooling.",
    linkedinUrl: "https://linkedin.com/in/alexrivera-tinybooks",
    relevanceRank: 1,
  },
];

const tinybooksScore: OpportunityScore = {
  total: 32,
  dimensions: [
    {
      name: "payment_complexity",
      weight: 0.3,
      subScore: 28,
      contributingSignals: ["ev-tb-1"],
    },
    {
      name: "operational_urgency",
      weight: 0.2,
      subScore: 30,
      contributingSignals: [],
    },
    {
      name: "automation_fit",
      weight: 0.2,
      subScore: 25,
      contributingSignals: ["ev-tb-2"],
    },
    {
      name: "buyer_accessibility",
      weight: 0.15,
      subScore: 40,
      contributingSignals: ["ev-tb-3"],
    },
    {
      name: "confidence",
      weight: 0.15,
      subScore: 45,
      contributingSignals: ["ev-tb-1", "ev-tb-2", "ev-tb-3"],
    },
  ],
  topFactors: ["Works in payments/invoicing space"],
  missingFactors: [
    "Company builds payment tools — does not have payment operations pain itself",
    "Too small (15 employees) for enterprise payment automation",
    "No urgency signals — stable small business with no growth pressure",
  ],
  recommendedAction: "deprioritize",
  deprioritizeReason:
    "TinyBooks is a payment tool provider, not a company with payment operations complexity. They build invoicing software for freelancers — their customers have the pain, not TinyBooks itself. Too small (15 employees) for enterprise payment automation.",
};


// ============================================================
// ASSEMBLED ACCOUNTS
// ============================================================

export const demoAccounts: Account[] = [
  {
    id: "account-marketflow",
    name: "MarketFlow",
    website: "https://marketflow.io",
    location: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/company/marketflow",
    businessModel: "marketplace",
    industry: "E-commerce Marketplace",
    employeeCount: 180,
    fundingStage: "Series B",
    personas: marketflowPersonas,
    evidenceCards: marketflowEvidence,
    opportunityScore: marketflowScore,
    opportunityBrief: marketflowBrief,
    outreachPack: marketflowOutreach,
    status: "outreach_ready",
    confidencePenalty: false,
  },
  {
    id: "account-gigconnect",
    name: "GigConnect",
    website: "https://gigconnect.co",
    location: "London, UK",
    linkedinUrl: "https://linkedin.com/company/gigconnect",
    businessModel: "gig_economy",
    industry: "Gig Economy Platform",
    employeeCount: 120,
    fundingStage: "Series A",
    personas: gigconnectPersonas,
    evidenceCards: gigconnectEvidence,
    opportunityScore: gigconnectScore,
    opportunityBrief: gigconnectBrief,
    outreachPack: gigconnectOutreach,
    status: "outreach_ready",
    confidencePenalty: false,
  },
  {
    id: "account-cloudscale",
    name: "CloudScale",
    website: "https://cloudscale.io",
    location: "Austin, TX",
    linkedinUrl: "https://linkedin.com/company/cloudscale",
    businessModel: "saas",
    industry: "Enterprise SaaS",
    employeeCount: 95,
    fundingStage: "Series A",
    personas: cloudscalePersonas,
    evidenceCards: cloudscaleEvidence,
    opportunityScore: cloudscaleScore,
    opportunityBrief: cloudscaleBrief,
    outreachPack: cloudscaleOutreach,
    status: "outreach_ready",
    confidencePenalty: false,
  },
  {
    id: "account-freightpay",
    name: "FreightPay",
    website: "https://freightpay.com",
    location: "Chicago, IL",
    linkedinUrl: "https://linkedin.com/company/freightpay",
    businessModel: "logistics",
    industry: "Logistics Payments",
    employeeCount: 40,
    fundingStage: "Seed",
    personas: freightpayPersonas,
    evidenceCards: freightpayEvidence,
    opportunityScore: freightpayScore,
    status: "scored",
    confidencePenalty: true,
    deprioritizeReason:
      "Conflicting evidence about business model and weak signals across all dimensions. Confidence penalty applied due to contradictory web sources.",
    lowEvidenceWarning: true,
  },
  {
    id: "account-tinybooks",
    name: "TinyBooks",
    website: "https://tinybooks.app",
    location: "Remote",
    linkedinUrl: "https://linkedin.com/company/tinybooks",
    businessModel: "other",
    industry: "Accounting Software",
    employeeCount: 15,
    personas: tinybooksPersonas,
    evidenceCards: tinybooksEvidence,
    opportunityScore: tinybooksScore,
    status: "deprioritized",
    confidencePenalty: false,
    deprioritizeReason: tinybooksScore.deprioritizeReason,
  },
];

// ============================================================
// HELPER EXPORTS
// ============================================================

/** @deprecated Use `demoAccounts` directly. Kept for backward compatibility. */
export function getDemoAccounts(): Account[] {
  return demoAccounts;
}

export function getDemoEnrichment(accounts: Account[]): Account[] {
  // In demo mode, accounts already have full evidence from seed data
  return accounts.map((a) => ({ ...a, status: "enriched" as const }));
}

export function getDemoOutreachPack(account: Account): OutreachPack {
  // Return precomputed outreach if available
  if (account.outreachPack) return account.outreachPack;

  // Fallback template for accounts without precomputed outreach
  return {
    accountId: account.id,
    whyThisAccountWhyNow: `${account.name} shows payment complexity signals that align with agentic payment automation.`,
    email: {
      subject: `Payment automation for ${account.name}`.slice(0, 60),
      body: `Hi,\n\nI noticed ${account.name} is dealing with payment operations complexity. We've built autonomous payment agents that handle reconciliation, routing, and exceptions without human intervention.\n\nWorth a quick conversation?`,
    },
    linkedinMessage: `Hi — saw ${account.name} is scaling payment operations. We help companies automate with autonomous agents. Worth connecting?`,
    callOpener: {
      talkingPoints: [
        "Reference their payment complexity",
        "Ask about manual processes",
      ],
    },
    followUp: `Following up on payment automation for ${account.name}. Happy to show a quick demo.`,
    discoveryQuestions: [
      "How much time does your team spend on payment operations weekly?",
      "What's your biggest payment-related pain point right now?",
      "How do you see payment operations scaling over the next 12 months?",
    ],
    generatedAt: new Date().toISOString(),
    generationMethod: "template",
    claimEvidenceIds: account.evidenceCards.map((e) => e.id),
  };
}

export function getDemoBrief(account: Account): AccountOpportunityBrief {
  // Return precomputed brief if available
  if (account.opportunityBrief) return account.opportunityBrief;

  // Fallback template
  return {
    accountId: account.id,
    companySummary: `${account.name} is a ${account.businessModel} company based in ${account.location}.`,
    paymentComplexityHypothesis: `${account.name} likely has payment complexity based on their business model and available signals.`,
    supportingEvidence: account.evidenceCards.map((e) => ({
      claim: e.rawEvidence.slice(0, 100),
      evidenceType: e.evidenceType,
      source: e.sourceLabel,
      confidenceLevel: e.confidenceLevel,
      evidenceCardId: e.id,
    })),
    likelyPainPoints: [
      "Payment operations scaling challenges",
      "Manual process overhead",
    ],
    recommendedPersonas: account.personas.map((p) => p.id),
    suggestedOutreachAngle:
      "Position agentic payments as a way to scale without proportional headcount growth.",
    discoveryQuestions: [
      "How much time does your team spend on payment operations?",
      "What's your biggest payment-related challenge?",
      "How do you plan to scale payment operations?",
    ],
  };
}
