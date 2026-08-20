# Netify System Architecture & Design Specification

## Multi-Tenancy Isolation Model
Netify uses row-level tenant isolation enforced at the NestJS API barrier.
- Every tenant has an `Organization`.
- Every domain record (`Customer`, `Invoice`, `Payment`, `Commitment`, `Conversation`, `Document`, `MemoryItem`) includes `organizationId`.
- An authenticated `User` belongs to one or more organizations via `Membership` (roles: `OWNER`, `ADMIN`, `MANAGER`, `STAFF`).
- Global `TenantGuard` and Prisma query scoping guarantees that a tenant can never view or mutate another tenant's records.

## Deterministic Computation vs. AI Reasoning
```
[ User Input / WhatsApp / Invoices / Payments ]
                      │
                      ▼
        [ Authoritative PostgreSQL ] ───(Deterministic Engines: Balance, Overdue, Risk Score)
                      │
                      ▼
         [ Structured Domain Records ]
                      │
                      ├───► [ pgvector Embeddings (Semantic Index) ]
                      │
                      ▼
         [ Hybrid RAG Context Assembly ]
                      │
                      ▼
             [ AI Service Layer ] ───► Explanations, Message Drafting, Extraction (With Evidence IDs)
```

## Hybrid Memory Retrieval (RAG)
1. **Deterministic Retrieval**: SQL queries for balances, aging buckets, commitment dates, and customer details.
2. **Semantic Retrieval**: pgvector cosine similarity search over `MemoryItem` records (conversation fragments, document text, customer notes).
3. **Synthesis & Evidence Citations**: AI analyzes combined structured + semantic context, strictly citing database IDs (`[Invoice:INV-001]`, `[Commitment:COM-002]`) so users can inspect evidence.
