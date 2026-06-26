# Pulse — Architecture Diagram (submission artifact)

H0 requires an architecture diagram showing app → backend connections. Two ways
to produce the image:

- **Fastest:** copy the Mermaid block below into <https://mermaid.live>, then
  export PNG/SVG. (VS Code "Markdown Preview Mermaid Support" also renders it.)
- **Polished:** rebuild it in <https://draw.io> using AWS icons (Aurora, etc.).

---

## Mermaid (paste into mermaid.live)

```mermaid
flowchart LR
  U["Operator (browser)<br/>Next.js UI · KPI cards · charts"]
  subgraph Vercel["Vercel (Next.js 16 on AWS)"]
    ASK["/api/ask<br/>read path"]
    ACT["/api/act<br/>confirmed writes"]
    AUD["/api/audit · /api/kpis"]
    GUARD["SQL guard<br/>(SELECT-only, allowlist, LIMIT)"]
  end
  LLM["Claude API<br/>opus-4-8 / haiku-4-5<br/>structured JSON plan"]
  subgraph Aurora["Amazon Aurora PostgreSQL (Serverless v2)"]
    RO[("pulse_readonly role<br/>SELECT only · statement_timeout 4s")]
    RW[("pulse_app role<br/>parameterized transactions")]
    T["orders · order_items · customers<br/>products · refunds · shipments<br/>order_flags · inventory_adjustments<br/>query_history · audit_log"]
  end

  U -->|"NL question"| ASK
  U -->|"confirm action"| ACT
  U -->|"on load"| AUD
  ASK -->|"plan"| LLM
  LLM -->|"sql | action | refuse"| ASK
  ASK --> GUARD
  GUARD -->|"validated SELECT"| RO
  ACT -->|"Zod-validated TX"| RW
  RW -->|"writes + audit row"| T
  RO --> T
  AUD --> RW
```

---

## ASCII fallback

```
 ┌──────────────┐  NL question   ┌──────────────────────────┐
 │  Operator    │ ─────────────▶ │  Next.js UI (Vercel)      │
 │  (browser)   │ ◀── charts ─── │  KPI cards · ask · audit  │
 └──────────────┘                └───┬───────────┬──────────┘
                       /api/ask        │           │ /api/act (after confirm)
                                       ▼           ▼
                          ┌─────────────────────────────────┐
                          │ Vercel Functions                 │
                          │  planner ─────▶ Claude API        │
                          │  SQL guard (SELECT-only/allowlist)│
                          │  action executor (Zod + TX)       │
                          └──────┬───────────────┬───────────┘
              read-only SELECT   │               │ parameterized TX
                                 ▼               ▼
                   ┌───────────────────────────────────────────┐
                   │  Amazon Aurora PostgreSQL                  │
                   │  roles: pulse_readonly | pulse_app         │
                   │  10 tables incl. query_history, audit_log  │
                   └───────────────────────────────────────────┘
```

**Talking points for the demo:** two DB roles (least privilege), reads and
writes are separate code paths, every write is human-confirmed and audited.
