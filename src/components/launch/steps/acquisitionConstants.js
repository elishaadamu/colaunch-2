export const PARTNERSHIP_EMAIL = import.meta.env.VITE_PARTNERSHIP_EMAIL || "creatorforgeweb@gmail.com";

export const VENTURE_ARTIFACTS = {
  agreement: {
    id: "CF-5050",
    title: "50/50 Co-Founder Venture Agreement",
    shortTitle: "CF-5050 Agreement",
    subtitle: "Standard Mutual Operating Covenant & Revenue Split Agreement",
    badge: "Verified Legal Spec",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    summary: "The legally binding operating partnership agreement guaranteeing zero upfront capital expenditure from the creator and an automated 50/50 net platform revenue split via Stripe Connect.",
    stats: [
      { label: "Revenue Split", val: "50% / 50%" },
      { label: "Upfront Cost", val: "$0.00" },
      { label: "MVP SLA", val: "7 Days" },
      { label: "Audience IP", val: "100% Creator" },
    ],
    clauses: [
      {
        num: "01",
        title: "50/50 Net Revenue Automation",
        body: "All platform customer subscriptions and one-time payments processed through Stripe are subject to an automated daily 50/50 payout split between Creator and Operator Studio. Payouts execute directly to connected creator bank accounts without intermediary withholding or manual invoices."
      },
      {
        num: "02",
        title: "$0 Upfront Development CapEx",
        body: "Creator incurs strictly $0 in upfront engineering, hosting, or tool development costs. Operator Studio commits 100% full-stack product engineering, cloud infrastructure provisioning, and production maintenance as sweat equity."
      },
      {
        num: "03",
        title: "7-Day MVP Turnaround & Pre-Order SLA",
        body: "Studio guarantees a production-ready MVP with integrated authentication, database, payment processing, and pre-order waitlist within 7 calendar days of niche selection and concept alignment."
      },
      {
        num: "04",
        title: "IP & Audience Sovereignty",
        body: "Creator retains 100% complete ownership of their personal brand, channel trademarks, content catalog, and direct relationship with audience subscribers. The joint venture owns the software source code and platform revenue stream."
      },
      {
        num: "05",
        title: "Non-Exclusive Safe Harbor",
        body: "This agreement does not restrict Creator's ongoing sponsorships, merchandise, or traditional content deals. Creator retains full discretion over promotion cadence and software feature roadmaps."
      }
    ]
  },
  architecture: {
    id: "ARCH-PROD-24",
    title: "Production Software Architecture Blueprint",
    shortTitle: "Tech Architecture",
    subtitle: "Zero-DevOps Full-Stack Cloud & Intelligence Infrastructure",
    badge: "Infrastructure Pre-Wired",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    summary: "Complete technical architecture pre-configured for every co-launched venture. Engineered for instantaneous deployment with zero server maintenance overhead.",
    stats: [
      { label: "Frontend", val: "Next.js 14 App" },
      { label: "Backend Core", val: "FastAPI Async" },
      { label: "Database", val: "Postgres 16" },
      { label: "Payments", val: "Stripe Connect" },
    ],
    specs: [
      {
        tier: "Frontend Experience Layer",
        tech: "Next.js 14 App Router · React 18 · Tailwind CSS · Lucide",
        details: "Server-side rendering, sub-100ms first contentful paint, mobile-first responsive layout, and integrated creator brand theming engine."
      },
      {
        tier: "Microservice Core & API",
        tech: "Python 3.11 FastAPI · Asyncpg · Pydantic v2",
        details: "High-throughput asynchronous REST API endpoints, automated OpenAPI documentation, rate limiting, and sub-50ms query latency."
      },
      {
        tier: "Database & Real-time Queue",
        tech: "PostgreSQL 16 Relational Engine · Redis 7 Cluster",
        details: "ACID-compliant customer data isolation, automated point-in-time daily backups, and BullMQ background task processing for outreach automation."
      },
      {
        tier: "AI Intelligence & LLM Synthesis",
        tech: "Anthropic Claude 3.5 Sonnet · OpenAI GPT-4o",
        details: "Dynamic prompt chaining for audience comment mining, problem extraction, personalized email generation, and instant MVP feature synthesis."
      },
      {
        tier: "Payments & Automated Splits",
        tech: "Stripe Connect Express · Webhook Engine",
        details: "Instantaneous onboarding for creators, automated sales tax calculation, fraud protection, and instant 50/50 revenue routing."
      }
    ]
  },
  signals: {
    id: "SIG-WTP-01",
    title: "Audience Demand Synthesis & WTP Model",
    shortTitle: "Demand Signals",
    subtitle: "Algorithmic Monetization Signal Extraction Rules",
    badge: "Signal Parser Active",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    summary: "The empirical rule engine that analyzes creator comment sections, community Discord/Reddit threads, and engagement ratios to identify recurring software-solvable pain points.",
    stats: [
      { label: "WTP Threshold", val: "≥ 8.8 / 10" },
      { label: "Cluster Rule", val: "5+ Mentions" },
      { label: "Blueprints", val: "3 Micro-SaaS" },
      { label: "Target MRR", val: "$15K–$45K" },
    ],
    metrics: [
      {
        label: "Willingness-to-Pay (WTP) Score",
        value: "8.8 / 10 Threshold",
        desc: "Requires empirical evidence of audience expressing intent to purchase a tool, software, or workflow replacement rather than generic entertainment."
      },
      {
        label: "Problem Clustering Engine",
        value: "5+ Recurring Mentions",
        desc: "Aggregates video comments into semantic vectors to isolate highest-friction friction points among active subscribers."
      },
      {
        label: "Micro-SaaS Concept Generator",
        value: "3 Tailored Blueprints",
        desc: "Synthesizes three tailored software concepts per creator: Productivity Utility, AI Content Assistant, or Workflow Automation OS."
      },
      {
        label: "Audience Conversion Forecast",
        value: "2.5% – 5.2% Estimate",
        desc: "Forecasts conservative MRR potential based on verified channel subscriber volume, engagement rates, and average subscription tier ($19–$49/mo)."
      }
    ]
  }
};
