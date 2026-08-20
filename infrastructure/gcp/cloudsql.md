# Google Cloud SQL (PostgreSQL + pgvector) Setup

## 1. Instance Creation
- Engine: PostgreSQL 16
- Region: europe-west1 (or closest African/European edge)
- Tier: db-custom-2-7680 (2 vCPUs, 7.5GB RAM)
- Storage: Auto-increasing SSD

## 2. Enable pgvector Extension
Connect via `psql` or Cloud Shell as postgres superuser:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 3. Secret Manager Configuration
Store connection strings and keys in Google Secret Manager:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `REVENUECAT_SECRET`
