# Netify — Agent-Ready Collections Workspace

Netify helps African SME owners understand who owes them money, why that customer needs attention, and what action should happen next.

Built for **[The WebMCP Challenge](https://webmcp.devpost.com/)**, this web application is a full desktop replica of the Netify mobile application, enabling business owners and AI agents to investigate customer credit risk, review historical payment commitments, issue receivables, record payments, and draft safe collection reminders using the browser-native **WebMCP** standard (`document.modelContext.registerTool`).

---

## 🌟 Key Capabilities (Full Mobile Parity)
- **Command Center Dashboard (`/`):** Real-time financial exposure, overdue debtor counts, promises due today, and daily executive AI briefing.
- **Receivables Ledger (`/receivables` & `/receivables/[id]`):** Credit sales, aging overdue invoices, status filters (`ALL`, `OPEN`, `OVERDUE`, `PAID`), and payment recording modals.
- **Issue Invoices / Receivables (`/receivables/create`):** Fast creation of credit sales and formal invoices with term selectors (7/14/30/60 days).
- **Payment Commitments Hub (`/commitments`):** Track promises negotiated across WhatsApp and phone calls with `TODAY`, `MISSED`, `UPCOMING`, and `FULFILLED` tabs.
- **Customer Directory & Intelligence (`/customers`, `/customers/create`, `/customers/[id]`):** Customer accounts, risk classifications, 4-tab ledgers, and AI behavioral analysis.
- **Collections Priority Queue (`/collections`):** Deterministically ranked accounts requiring urgent collection follow-up.
- **AI Copilot & Business Memory (`/chat`):** Collaborative investigation screen linking directly to customer ledgers and evidence citations.
- **Safe Action Proposals (`/messages/draft`):** AI generates culturally aware, respectful payment reminders with tone selectors, channel routing (WhatsApp/SMS), and explicit human approval controls.
- **Notifications Center (`/notifications`):** Real-time signals, broken promise alerts, and unread badge counters.
- **Judge WebMCP Inspector:** Floating on-screen test harness to inspect registered tools, examine JSON schemas, and trigger live executions with 1 click.

---

## 🛠 Registered WebMCP Tools
The application registers 12 browser-native tools:
1. `get_collection_priority` (Read-Only) — Retrieves ranked priority debtors from the live queue.
2. `search_customers` (Read-Only) — Searches live customer accounts by name, phone, or location.
3. `get_customer_evidence` (Read-Only) — Fetches invoices, delivery receipts, payment history, and WhatsApp promise logs for a customer ID.
4. `get_customer_risk_profile` (Read-Only) — Retrieves AI risk explanation, behavioral patterns, and recommended recovery strategy.
5. `list_receivables` (Read-Only) — Queries live invoices filtered by status (`OPEN`, `OVERDUE`, `PAID`) or customer ID.
6. `get_daily_briefing` (Read-Only) — Returns daily executive collections briefing (total overdue, promises due today, urgent actions).
7. `query_business_memory` (Read-Only) — Queries relational memory records, debtor trust metrics, and past dispute context.
8. `list_notifications` (Read-Only) — Retrieves real-time alerts, payment confirmations, and broken promise notices.
9. `draft_follow_up_message` (Proposal) — Generates tailored payment reminder proposals in 6 African commerce languages without side effects.
10. `create_payment_commitment` (Mutating / Confirmed) — Records customer promise-to-pay date and amount into the database with human confirmation safeguard.
11. `record_collection_activity` (Mutating / Confirmed) — Persists confirmed collection activity into the customer timeline after human review.
12. `mark_notification_read` (Mutating) — Dismisses or acknowledges an actionable notification by ID.

### 🔐 Delegated AI Agent Authorization (OAuth 2.0 PKCE)
External AI agents (ChatGPT Agent, Claude, Gemini Nano) can securely request access to the merchant's workspace without API key sharing via RFC 7636 OAuth 2.0 PKCE consent screen at `/oauth/authorize`. Mutating actions require explicit merchant confirmation safeguards.


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Netify API running on `http://localhost:4000/api/v1` (or configure via `NEXT_PUBLIC_API_URL`)

### Running the Web Application
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing with WebMCP
1. **In Google Chrome:** Enable WebMCP testing flag at `chrome://flags/#enable-webmcp-testing` and restart Chrome.
2. **In ChatGPT In-App Browser:** Navigate directly to your deployed HTTPS URL.
3. **In Any Standard Browser:** Click the floating **"WebMCP Engine"** badge at the bottom-right of the screen to open the interactive Judge Inspector and run live test calls against the backend.

---

## 📄 License
This project is open source and available under the [MIT License](../../LICENSE).
