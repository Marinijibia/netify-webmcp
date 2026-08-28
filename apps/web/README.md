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
The application registers 8 browser-native tools:
1. `get_collection_priority` (Read-Only) — Retrieves ranked priority debtors from the live queue.
2. `search_customers` (Read-Only) — Searches live customer accounts by name and location.
3. `get_customer_evidence` (Read-Only) — Fetches invoices, payment history, and WhatsApp promise logs for a customer ID.
4. `get_customer_risk_profile` (Read-Only) — Retrieves AI risk explanation and recommended recovery strategy.
5. `list_receivables` (Read-Only) — Queries live invoices filtered by status (`OPEN`, `OVERDUE`, `PAID`) or customer.
6. `draft_follow_up_message` (Proposal) — Generates tailored payment reminder proposal without side effects.
7. `create_payment_commitment` (Mutating / Confirmed) — Records customer promise-to-pay date and amount into the database.
8. `record_collection_activity` (Mutating / Confirmed) — Persists confirmed collection activity into the customer timeline after human review.

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
