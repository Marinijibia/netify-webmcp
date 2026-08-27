# Netify — Agent-Ready Collections Workspace

Netify helps African SME owners understand who owes them money, why that customer needs attention, and what action should happen next.

Built for **[The WebMCP Challenge](https://webmcp.devpost.com/)**, this web application enables business owners and AI agents to investigate customer credit risk, review historical payment commitments, and draft safe collection reminders using the browser-native **WebMCP** standard (`document.modelContext.registerTool`).

---

## 🌟 Key Capabilities
- **Command Center Dashboard (`/`):** Real-time financial exposure, overdue debtor counts, promises due today, and daily executive AI briefing.
- **Customer Intelligence Hub (`/customers` & `/customers/[id]`):** Deep customer profile with receivables aging, payment history, and AI behavioral analysis.
- **Collections Priority Queue (`/collections`):** Deterministically ranked accounts requiring urgent collection follow-up.
- **AI Copilot & Business Memory (`/chat`):** Collaborative investigation screen linking directly to customer ledgers and evidence citations.
- **Safe Action Proposals (`/messages/draft`):** AI generates culturally aware, respectful payment reminders with tone selectors, channel routing (WhatsApp/SMS), and explicit human approval controls.
- **Judge WebMCP Inspector:** Floating on-screen test harness to inspect registered tools, examine JSON schemas, and trigger live executions with 1 click.

---

## 🛠 Registered WebMCP Tools
The application registers 6 browser-native tools:
1. `get_collection_priority` (Read-Only) — Retrieves ranked priority debtors from the live queue.
2. `search_customers` (Read-Only) — Searches live customer accounts by name and location.
3. `get_customer_evidence` (Read-Only) — Fetches invoices, payment history, and WhatsApp promise logs for a specific customer ID.
4. `get_customer_risk_profile` (Read-Only) — Retrieves AI risk explanation and recommended recovery strategy.
5. `draft_follow_up_message` (Proposal) — Generates tailored payment reminder proposal without side effects.
6. `record_collection_activity` (Mutating / Confirmed) — Persists confirmed collection activity into the customer timeline after human review.

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
