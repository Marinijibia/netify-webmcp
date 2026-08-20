# Netify REST API Reference

Base URL: `http://localhost:4000/api/v1`

## Authentication & Tenancy
- `POST /auth/register` - Create user and new organization
- `POST /auth/login` - Authenticate and receive JWT + refresh token
- `POST /auth/refresh` - Refresh access token
- `GET  /auth/me` - Get current authenticated user profile and memberships
- `GET  /organizations/current` - Get current organization details and settings

## Customers & Invoices
- `GET    /customers` - List organization customers (supports `search`, `status`, `riskLevel`)
- `POST   /customers` - Create customer
- `GET    /customers/:id` - Get customer detail with financial summaries, commitments, risk profile
- `GET    /invoices` - List invoices (filterable by status: `OVERDUE`, `ISSUED`, `PAID`, etc.)
- `POST   /invoices` - Create invoice with line items
- `GET    /invoices/:id` - Get invoice detail with balance and payment history

## Payments & Commitments
- `GET    /payments` - List payments
- `POST   /payments` - Record payment (allocates against invoice balance and customer balance)
- `GET    /commitments` - List promises/commitments (status: `PENDING`, `FULFILLED`, `MISSED`)
- `POST   /commitments` - Create payment commitment (manual or AI-extracted)
- `PATCH  /commitments/:id/status` - Update commitment status

## Collections & Risk Engines
- `GET    /collections/priority-queue` - Deterministic collection queue (`DUE_TODAY`, `OVERDUE`, `MISSED_COMMITMENT`, `HIGH_RISK`)
- `GET    /risk/customer/:id` - Deterministic risk signals + AI explanation + supporting evidence

## Business Memory & AI
- `POST   /ai/investigate` - Natural language query against Business Memory (hybrid SQL + pgvector)
- `POST   /ai/extract-commitment` - Parse unstructured notes/WhatsApp message into verified commitment DTO
- `POST   /ai/draft-followup` - Generate context-aware collection message (WhatsApp / SMS)
- `GET    /evidence/:id` - Retrieve evidence trail for an AI insight or risk assessment
