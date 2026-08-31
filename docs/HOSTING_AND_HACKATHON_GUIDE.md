# Netify — Hackathon Submission & Hosting Deployment Guide

> **Submission for [The WebMCP Challenge](https://webmcp.devpost.com/)**  
> **Theme:** AI Collections + Relational Business Memory for African SMEs  
> **Protocol:** W3C WebMCP Standard (`document.modelContext.registerTool`)

---

## 🎯 1. Hackathon Alignment & Judge Fast-Track

Netify is designed specifically for African trade credit (where 90% of credit terms are negotiated verbally or via WhatsApp). It provides a full desktop web workspace and mobile app with 8 browser-native **WebMCP** tools.

### Judge Credentials (1-Click Fast Track)
- **Demo Login URL:** `/login` (click the **"Fill Demo Login"** button)
- **Email:** `merchant@netify.ng`
- **Password:** `Password123!`
- **Pre-Seeded Data:** ₦28.4M in realistic trade receivables, Kano grain wholesale distributors, Lagos FMCG buyers, 12 broken WhatsApp payment promises, and past payment logs.

### 3 Ways Judges Can Test WebMCP:
1. **Interactive On-Screen Inspector (Instant):** Click the floating **"WebMCP Engine"** badge at the bottom-right of any page to inspect the 8 registered tools, review JSON schemas, and trigger live executions with 1 click.
2. **Google Chrome DevTools (Native Flag):**
   - Enable `chrome://flags/#enable-webmcp-testing` in Chrome.
   - Open DevTools Console and execute:
     ```javascript
     document.modelContext.getTools();
     ```
3. **ChatGPT In-App Browser:** Browse directly to the hosted web URL inside ChatGPT. The agent autonomously discovers registered tools and invokes them.

---

## 🌐 2. Hosting Architecture Overview

```
                          [ Internet / Judges ]
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌───────────────────┐           ┌───────────────────┐
          │     Next.js 14    │           │    NestJS REST    │
          │   Web Application │           │     API Server    │
          │   (Vercel/Render) │           │  (Render/Railway) │
          └─────────┬─────────┘           └─────────┬─────────┘
                    │                               │
                    │ NEXT_PUBLIC_API_URL           │
                    └──────────────────────────────►│
                                                    ▼
                                          ┌───────────────────┐
                                          │ PostgreSQL 16     │
                                          │  + pgvector       │
                                          │  + Redis 7        │
                                          └───────────────────┘
```

---

## 🚀 3. Recommended Hosting Setup (15-Minute Deployment)

### Step 1: Database & Redis (Free Tier)
1. **PostgreSQL with `pgvector`:**
   - **Supabase (Recommended):** Create a free project at [supabase.com](https://supabase.com). It comes with `pgvector` pre-installed.
     - Copy the **Connection String (URI)**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - **Alternative (Neon / Railway / Render):** Create a PostgreSQL 16 database. Run `CREATE EXTENSION IF NOT EXISTS vector;` in the SQL editor.
2. **Redis:**
   - **Upstash (Recommended):** Create a free Redis database at [upstash.com](https://upstash.com).
     - Copy the `REDIS_URL`: `rediss://default:[PASSWORD]@[HOST]:6379`
   - *Note:* If Redis is omitted, the API automatically falls back gracefully to `mock_ready` without failing.

### Step 2: Push Schema & Seed Database
From your local workspace terminal:
```bash
# Set your hosted DATABASE_URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Push the schema and apply pgvector migrations
yarn db:push

# Seed the realistic African SME demonstration records
yarn db:seed
```

---

### Step 3: Deploy the Backend API (`apps/api`)

#### Deploying on Render (Easiest)
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Web Service**.
2. Connect your GitHub repository: `netify-app`.
3. Configure the service:
   - **Name:** `netify-api`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `apps/api/Dockerfile`
   - **Context:** Root directory (`.`)
4. Add Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | `postgresql://...` (your Supabase/hosted DB URL) |
   | `REDIS_URL` | `rediss://...` (optional, Upstash Redis) |
   | `JWT_SECRET` | Any strong random string (e.g. `netify_production_jwt_secret_2026`) |
   | `REFRESH_TOKEN_SECRET` | Any strong random string |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-1.5-flash` |
5. Click **Create Web Service**.
6. Once deployed, note your live API URL: `https://netify-api.onrender.com`.

---

### Step 4: Deploy the Web App (`apps/web`)

#### Deploying on Vercel (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new) and import your `netify-app` repository.
2. Under **Project Settings**:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit and select `apps/web`
3. Add Environment Variable:
   | Variable | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://netify-api.onrender.com/api/v1` (your live API URL from Step 3) |
4. Click **Deploy**.
5. Your live app will be published at `https://netify-web.vercel.app`.

---

## ⚡ 4. 1-Click Alternative: Render Blueprint

If you prefer deploying everything on a single platform with zero manual configuration, Netify includes a pre-configured `render.yaml` blueprint:

1. Push your code to GitHub.
2. In Render, click **Blueprints > New Blueprint Instance**.
3. Select your repository.
4. Render will automatically parse `render.yaml` and provision:
   - `netify-api` (Docker container)
   - `netify-web` (Next.js service)
   - `netify-db` (PostgreSQL database)
   - `netify-redis` (Redis instance)
5. Fill in your `GEMINI_API_KEY` when prompted and click **Apply**.

---

## ✅ 5. Pre-Flight Hosting Checklist

- [x] **Next.js Web Build Verified:** `npm run build` in `apps/web` generated all 29 routes with **0 errors**.
- [x] **NestJS API Build Verified:** `npm run build` in `apps/api` compiled to `dist/` with **0 errors**.
- [x] **Cross-Origin (CORS) Ready:** `app.enableCors({ origin: true, credentials: true })` configured in `apps/api/src/main.ts` to accept any frontend domain.
- [x] **Multi-Language Support (6 Commerce Languages):** English, Hausa, Yorùbá, Igbo, Nigerian Pidgin, Fulfulde all verified with 100% dictionary key parity.
- [x] **WebMCP 8-Tool Protocol:** `get_collection_priority`, `search_customers`, `get_customer_evidence`, `get_customer_risk_profile`, `list_receivables`, `draft_follow_up_message`, `create_payment_commitment`, `record_collection_activity` all verified.
- [x] **Judge 1-Click Demo:** `merchant@netify.ng` / `Password123!` seeded with ₦28.4M in realistic debtor balances.
- [x] **Dockerfiles & Configs:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/vercel.json`, and `render.yaml` created and verified.
