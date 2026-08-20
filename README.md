# Netify — AI Collections + Business Memory for African SMEs

> **"Know who owes you. Remember what they promised. Know who needs attention. Get paid."**

Netify is an AI-powered collections and business memory system designed specifically for African SMEs. It bridges the gap between informal payment commitments (WhatsApp messages, phone calls, verbal promises) and deterministic financial accounting.

---

## 🏗️ Architecture & Monorepo Structure

Netify is structured as a **Turborepo + Yarn Workspaces** monorepo:

```
netify/
├── apps/
│   ├── mobile/         # Mobile-first Expo React Native app (Primary MVP)
│   ├── api/            # NestJS Modular Monolith REST API & BullMQ Queues
│   ├── web/            # Next.js Web App (Scaffolded shell, frozen during MVP)
│   └── admin/          # Next.js Admin App (Scaffolded shell, frozen during MVP)
│
├── packages/
│   ├── database/       # Prisma ORM + PostgreSQL schema + pgvector extensions
│   ├── ai/             # AI Provider Abstraction (Gemini dev / OpenAI prod)
│   ├── types/          # Shared domain models, DTOs, API responses, Enums
│   ├── validation/     # Zod validation schemas
│   ├── config/         # Multi-currency config (NGN, GHS, KES, ZAR, USD, GBP)
│   ├── ui/             # Shared design tokens and visual primitives
│   ├── tsconfig/       # Shared TypeScript configurations
│   └── eslint-config/  # Shared ESLint rules
│
├── infrastructure/
│   ├── docker/         # Docker Compose for PostgreSQL 16 (pgvector) + Redis 7
│   └── gcp/            # GCP Cloud Run & Cloud SQL configurations
│
└── docs/
    ├── architecture/   # System design and tenant isolation specs
    ├── api/            # API reference and data contracts
    └── product/        # Product requirements and MVP slice guidelines
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 18.x
- Yarn >= 1.22.x
- Docker & Docker Compose (for local PostgreSQL + pgvector + Redis)

### 1. Install Monorepo Dependencies
```bash
yarn install
```

### 2. Start Local Infrastructure
Start PostgreSQL (with `pgvector` enabled) and Redis via Docker Compose:
```bash
yarn docker:up
```

### 3. Setup Database Schema & Seed Data
Generate the Prisma client, run migrations, and seed realistic African SME data:
```bash
yarn db:generate
yarn db:migrate
yarn db:seed
```

### 4. Run Development Servers
To run all applications concurrently:
```bash
yarn dev
```

Or run individual apps:
- **API Server** (`http://localhost:4000`):
  ```bash
  yarn api:dev
  ```
- **Mobile App** (Expo bundler):
  ```bash
  yarn mobile
  ```

---

## 🧠 Core Engineering Principles

1. **Source of Truth is PostgreSQL**: The database holds verified business truth. AI is never the source of truth for financial balances.
2. **Deterministic Calculations**: Balances, aging buckets, overdue fees, commitment states, and risk metrics are calculated in code with 100% precision.
3. **AI for Reasoning & Extraction**: AI handles unstructured extraction, risk explanation, semantic search, and follow-up message generation.
4. **Evidence-Based Trust**: Every AI statement links to concrete Invoice, Payment, Commitment, or Message IDs. Tapping "Why?" reveals verifiable evidence.
5. **Multi-Currency African Focus**: Native support for `NGN (₦)`, `GHS (₵)`, `KES (KSh)`, `ZAR (R)`, `USD ($)`, and `GBP (£)` without hardcoding.

---

## 🧪 Testing

Run typechecks and automated test suites across all packages:
```bash
yarn typecheck
yarn test
yarn lint
```
# netify-app
