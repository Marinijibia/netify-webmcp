# Netify — Agent-Native Trade Credit Recovery for African SMEs

[![WebMCP Challenge](https://img.shields.io/badge/OpenAI-The_WebMCP_Challenge_2026-10a37f?style=for-the-badge&logo=openai&logoColor=white)](https://webmcp.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![WebMCP Standard](https://img.shields.io/badge/W3C_WebMCP-document.modelContext-00A581?style=for-the-badge)](https://webmachinelearning.github.io/webmcp/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud_Run_Live-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/run)

> **Submission for [The WebMCP Challenge](https://webmcp.devpost.com/)**  
> *"Turn informal WhatsApp promises and overdue trade credit ledgers into recovered cash using browser-native AI agents and the WebMCP standard."*

---

## 🎯 Judge Fast-Track (1-Click Evaluation)

| Resource | Live Link / Value | Description |
| :--- | :--- | :--- |
| **Live Web App** | **[https://app.netify.ng](https://app.netify.ng)** | Live production web application (Google Cloud Run + Cloudflare) |
| **Interactive WebMCP Sandbox** | **[https://app.netify.ng/webmcp](https://app.netify.ng/webmcp)** | On-screen WebMCP tool simulator & execution inspector |
| **WebMCP Standard Manifest** | **[https://app.netify.ng/api/webmcp](https://app.netify.ng/api/webmcp)** | REST discovery and live execution bridge |
| **Auto-Discovery Root** | **[https://app.netify.ng/.well-known/webmcp.json](https://app.netify.ng/.well-known/webmcp.json)** | Standard RFC WebMCP agent discovery descriptor |
| **Backend API Health** | **[https://api.app.netify.ng/api/v1/health](https://api.app.netify.ng/api/v1/health)** | Live NestJS API connected to Cloud SQL (`pgvector`) & Redis |

### Judge 1-Click Demo Credentials
- **Login URL:** [https://app.netify.ng/login](https://app.netify.ng/login)
- **1-Click Button:** Click **"Fill Demo Credentials (Judges)"**
- **Email:** `merchant@netify.ng`
- **Password:** `Password123!`
- **Pre-Seeded Data:** ₦28.4M in realistic African trade receivables across wholesale distributors, retail FMCG buyers, 12 broken WhatsApp commitments, and timeline logs.

---

## 🌍 The Problem: The $330B Trade Credit Blindspot

Across sub-Saharan Africa, over **80% of wholesale and retail trade runs on credit**. But it doesn't happen through corporate banks or credit cards—it happens through trust, verbal handshakes, and informal WhatsApp chats. A distributor in Kano or Lagos supplies goods on Monday with a verbal promise to be paid on Friday.

When promises break, merchants lose hundreds of hours calculating overdue balances on paper and sending awkward, confrontational reminders that destroy customer relationships.

### The Netify + WebMCP Solution
Netify connects autonomous browser agents directly to live merchant ledgers using **WebMCP** (`document.modelContext.registerTool`):

1. **Autonomous Discovery**: The agent queries overdue debtor accounts ranked by urgency score, aging days, and broken commitments.
2. **Contextual Debtor Evidence**: The agent inspects historical invoices, payment promises, and past conversations.
3. **Culturally Grounded Proposals**: The agent crafts respectful follow-up reminders in 6 regional commerce languages: **English, Hausa, Yorùbá, Igbo, Nigerian Pidgin, and Fulfulde**.
4. **Human-in-the-Loop Dispatch**: The merchant reviews the proposal and dispatches it to WhatsApp with a single tap.
5. **Relational Memory**: When the debtor responds, the agent persists new payment commitments and timelines directly to the live PostgreSQL database.

---

## 🏛️ System Architecture

```
                                  [ Autonomous AI Agents ]
                        (ChatGPT In-App Browser / Chrome Gemini Nano)
                                            │
                                            ▼  W3C WebMCP Standard
                              document.modelContext.registerTool
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
     ┌───────────────────────────────────┐             ┌───────────────────────────────────┐
     │      Next.js 14 Web Workspace    │             │   WebMCP Interactive Inspector    │
     │      (https://app.netify.ng)      │             │    (https://app.netify.ng/webmcp) │
     │  - 12 Typed Client-Side Tools     │             │  - Real-Time JSON Schema Viewer   │
     │  - Automatic ModelContext Fallback│             │  - In-Browser Tool Execution HUD  │
     │  - Multilingual Relational Memory │             │  - Latency & Status Timeline Logs │
     └─────────────────┬─────────────────┘             └─────────────────┬─────────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                                ▼ HTTPS (JWT Authenticated)
                               ┌───────────────────────────────────┐
                               │       NestJS REST API Server      │
                               │   (https://api.app.netify.ng)     │
                               │  - Rate Limiting & Tenant Guard   │
                               │  - Zod Input Contract Validation  │
                               │  - AI Multi-Dialect Generator     │
                               └─────────────────┬─────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                ┌─────────────────────────────┐     ┌─────────────────────────────┐
                │     Google Cloud SQL 16     │     │     Google Memorystore      │
                │     PostgreSQL + pgvector   │     │           Redis 7           │
                │   - Deterministic Balances  │     │   - Rate-Limit Caching      │
                │   - Vector Debtor Embeddings│     │   - Token Invalidation      │
                └─────────────────────────────┘     └─────────────────────────────┘
```

---

## 🛠️ The 12 Registered WebMCP Tools

Netify exposes 12 production-grade browser agent tools on `document.modelContext.registerTool`:

| # | Tool Name | Category | Description | Primary Inputs |
| :-: | :--- | :---: | :--- | :--- |
| **1** | **`get_collection_priority`** | `READ_ONLY` | Retrieves debtor accounts ranked by urgency, aging days, and missed commitments. | `limit?: number`, `currency?: string` |
| **2** | **`search_customers`** | `READ_ONLY` | Searches customer accounts by business name or location with live ledger balances. | `query: string` |
| **3** | **`get_customer_evidence`** | `READ_ONLY` | Fetches active invoices, historical payments, WhatsApp promises, and activity logs. | `customerId: string` |
| **4** | **`get_customer_risk_profile`**| `READ_ONLY` | Returns AI-grounded risk explanation, behavioral patterns, and recovery recommendations. | `customerId: string` |
| **5** | **`list_receivables`** | `READ_ONLY` | Queries live receivables filtered by status (`OPEN`, `OVERDUE`, `PAID`) or customer ID. | `customerId?: string`, `isOverdue?: boolean` |
| **6** | **`get_daily_briefing`** | `READ_ONLY` | Fetches executive morning collection briefing (total overdue, today promises, top accounts). | `currency?: string` |
| **7** | **`query_business_memory`** | `READ_ONLY` | Queries long-term behavioral memory records, commitment fulfillment rates, and debt notes. | `customerId: string` |
| **8** | **`list_notifications`** | `READ_ONLY` | Lists actionable alerts and real-time SSE payment notifications. | `unreadOnly?: boolean`, `pageSize?: number` |
| **9** | **`draft_follow_up_message`** | `PROPOSAL` | Generates a culturally nuanced WhatsApp reminder draft in 6 commerce languages. | `customerId: string`, `tone?: string`, `channel?: string` |
| **10** | **`create_payment_commitment`**| `MUTATING` | Records a customer's promised payment date and amount into the database. | `customerId: string`, `amount: number`, `promisedFor: string` |
| **11** | **`record_collection_activity`**| `MUTATING` | Persists verified call, WhatsApp, or promissory visit logs to the customer timeline. | `customerId: string`, `channel: string`, `outcome: string` |
| **12** | **`mark_notification_read`** | `MUTATING` | Dismisses or acknowledges an actionable notification by ID. | `notificationId: string` |

---

## 💻 3 Ways to Test WebMCP

### 1. In-App Interactive Inspector (Works in Any Browser)
1. Visit **[https://app.netify.ng/webmcp](https://app.netify.ng/webmcp)** (or click the floating **"WebMCP Engine"** badge at the bottom-right of any screen).
2. Select any tool (e.g. `get_collection_priority`).
3. Click **"Execute Tool Live"** to see live debtor data returned in milliseconds.

### 2. Google Chrome Native WebMCP Flag
1. Open Google Chrome (v149+) and navigate to `chrome://flags/#enable-webmcp-testing`.
2. Toggle to **Enabled** and relaunch.
3. Open **DevTools Console** (`F12`) on `https://app.netify.ng` and execute:
   ```javascript
   document.modelContext.getTools();
   ```

### 3. ChatGPT In-App Browser & Autonomous Agent Testing Prompt
Copy and paste this prompt into ChatGPT (with Web Browsing enabled) or any autonomous browser agent:

```text
Please navigate to Netify's web application and test the WebMCP Integration:

[STEP 1: AUTHENTICATION REQUIRED]
External AI agents must authenticate before accessing the merchant's workspace.
Method A (Direct Browser Agent In-App Login):
1. Open https://app.netify.ng/login
2. Sign in with demo judge credentials:
   • Email: merchant@netify.ng
   • Password: Password123!
3. Once logged in, navigate to https://app.netify.ng/webmcp to view the live WebMCP Browser Agent Tools inspector.

Method B (Delegated Agent Authorization via RFC 7636 OAuth 2.0 PKCE):
External agents can request delegated access directly via:
https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft

[STEP 2: VERIFY 12 REGISTERED WEBMCP TOOLS]
Verify that the following 12 tools are registered on the browser model context (document.modelContext):
1. get_collection_priority
2. search_customers
3. get_customer_evidence
4. get_customer_risk_profile
5. list_receivables
6. get_daily_briefing
7. query_business_memory
8. list_notifications
9. draft_follow_up_message
10. create_payment_commitment
11. record_collection_activity
12. mark_notification_read

[STEP 3: EXECUTE AUTONOMOUS TRIAGE WORKFLOW]
Execute the following 3-step debt recovery triage:
1. Call "get_collection_priority" to retrieve the top overdue debtor accounts.
2. Call "get_customer_evidence" for the highest-ranked debtor (ABC Stores, customerId: "f14e802a-573d-46bb-8257-317bdc3cddb0").
3. Call "draft_follow_up_message" with channel "WHATSAPP" and tone "RESPECTFUL_REMINDER" to generate a tailored WhatsApp reminder.

[STEP 4: HUMAN-IN-THE-LOOP SAFEGUARD]
Verify that financial write tools (create_payment_commitment, record_collection_activity) require explicit human confirmation safeguards before committing changes to the live ledger.
```

### 4. Delegated AI Agent Authorization (OAuth 2.0 PKCE Consent Flow)
External agents (like ChatGPT Agent, Claude, Gemini Nano) can securely request access without credential sharing:
1. Visit the live consent screen: **[https://app.netify.ng/oauth/authorize](https://app.netify.ng/oauth/authorize?client_id=chatgpt-agent&response_type=code&scope=receivables:read%20customers:read%20customer_evidence:read%20business_memory:read%20collection_messages:draft)**
2. Select desired granular permissions (e.g. read receivables vs. mutate commitments).
3. Review audit logs and active grants under **[Settings > Connected AI Agents](https://app.netify.ng/settings)**.


---

## 📦 Monorepo Structure

```
netify/
├── apps/
│   ├── web/            # Next.js 14 Desktop App & WebMCP Implementation
│   ├── api/            # NestJS Modular Monolith REST API & BullMQ Queues
│   └── mobile/         # Expo React Native mobile application
│
├── packages/
│   ├── database/       # Prisma ORM + PostgreSQL schema + pgvector extensions
│   ├── ai/             # Multi-dialect AI generation & debtor embeddings
│   ├── types/          # Shared domain models, WebMCP DTOs, API responses
│   ├── validation/     # Zod validation schemas
│   ├── config/         # Multi-currency config (NGN, GHS, KES, ZAR, USD)
│   └── ui/             # Shared African design system tokens and theme engine
│
├── infrastructure/
│   ├── docker/         # Docker Compose for local development
│   └── gcp/            # Google Cloud Run, Cloud Build, and Cloud SQL configs
│
└── docs/
    └── HOSTING_AND_HACKATHON_GUIDE.md  # Production hosting and judge instructions
```

---

## ⚡ Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/Marinijibia/netify-app.git
cd netify-app

# 2. Install monorepo dependencies
npm install --legacy-peer-deps

# 3. Setup environment variables
cp .env.example .env

# 4. Push database schema & seed realistic African SME records
npm run db:push
npm run db:seed

# 5. Start development servers
npm run dev
```

---

## 📄 Open Source License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
