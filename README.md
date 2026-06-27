# Pulse — AI Ops Copilot for SMBs (H0 entry)

Ask your Aurora PostgreSQL e-commerce data in plain English → safe SQL → charts + tables,
plus a confirmed, audited action layer for safe writes. Built for the H0 hackathon
(Vercel v0 + AWS Databases).

## Status

| Piece | State |
|---|---|
| Next.js 16 + TS + Tailwind scaffold | ✅ |
| Deliberate schema (10 tables, indexes, FKs) — `src/db/schema.ts` | ✅ generates valid DDL |
| Two-pool least-privilege DB access — `src/db/pools.ts` | ✅ |
| **SQL guard** (fail-closed regex + AST allowlist + LIMIT) — `src/lib/sql-guard.ts` | ✅ **14/14 tests pass** |
| NL→plan via Claude (structured + Zod) — `src/lib/plan.ts` | ✅ code complete |
| **`POST /api/ask`** read path | ✅ code complete |
| **`POST /api/act`** (confirmed writes) + **`GET /api/audit`** | ✅ code complete |
| **Action layer** — allowlisted, transactional, audited writes — `src/lib/actions.ts` | ✅ **9/9 tests pass** |
| Confirmation modal + live audit panel | ✅ |
| Charts (Recharts) — number/bar/line/pie from `chart_spec` | ✅ |
| KPI home cards + `GET /api/kpis` | ✅ with trend indicators |
| Demo Mode — simulated AI + DB (DEMO_MODE=true) | ✅ `src/lib/demo.ts` |
| UI redesign — dark header, conversation history, timeline audit | ✅ |
| Architecture diagram (mermaid, ready to export) — `docs/architecture.md` | ✅ |
| Database seeded (50 products, 150 customers, 300 orders, 15 stuck) | ✅ |
| Vercel deployment (Aurora Marketplace integration) | ✅ |

`pnpm build`, `pnpm typecheck`, `pnpm test:guard`, and `pnpm test:actions` all pass with **no DB or API key**.

## Run it locally

### Demo Mode (no Aurora / Anthropic credits needed)
```bash
# Fresh OIDC token (Vercel Marketplace vars auto-inject)
npx vercel env pull .env.local

# Add ANTHROPIC_API_KEY back (vercel pull removes it)
# Then add DEMO_MODE=true to .env.local

pnpm dev      # http://localhost:3000
# Demo Mode banner explains the simulated AI/DB path
```

### Live Mode (with Aurora + Anthropic credits)
```bash
npx vercel env pull .env.local
# Add ANTHROPIC_API_KEY to .env.local
# Remove DEMO_MODE from .env.local

# 1) Apply schema (once per database)
pnpm db:push    # Run in PowerShell; press Y to confirm migration

# 2) Seed demo data (optional)
pnpm db:seed    # Loads 50 products, 150 customers, 300 orders with 15 stuck

# 3) Dev server
pnpm dev        # http://localhost:3000
```

### Vercel Deployment
1. Add `ANTHROPIC_API_KEY` to Vercel project Settings → Environment Variables
2. Optionally add `DEMO_MODE=true` if you want judges to see simulated AI
3. Push code to GitHub → auto-deploys via Vercel git integration
4. Visit your live Vercel URL

## Scripts
- `pnpm dev` / `build` / `start` — Next.js
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test:guard` — SQL safety tests (no DB/key needed)
- `pnpm db:generate` — emit SQL migration from schema
- `pnpm db:push` — apply schema to the database
- `pnpm db:seed` — load realistic DTC demo data

## Safety & Architecture (the H0 centerpiece)

**Five-layer read safety:**
1. Structured JSON output (Zod-validated) — never raw SQL strings
2. SQL parser allowlist (SELECT-only, no DML/DDL, allowed tables)
3. Fail-closed regex guards + forced LIMIT
4. Execute on read-only Postgres role (no write privilege)
5. Statement timeout (4s) enforced by role

**Write safety — human-in-the-loop:**
1. AI proposes one of three allowlisted actions (not SQL)
2. UI shows confirmation modal with exact args
3. User approves → parameterized transaction (no string concat)
4. Every write logged to JSONB `audit_log` with full payload
5. Live audit panel shows all actions in real-time

**Two database roles:**
- `pulse_app` (RW) — used only for confirmed writes + logging
- `pulse_readonly` (RO, SELECT-only) — used for all AI-generated queries

This design means: AI SQL failures are safe (readonly role can't write), model hallucinations can't access system catalogs, and every action is auditable.

---

## The Quick Differentiator

Most NL→SQL hackathon projects are read-only chatbots. Pulse goes further:
- **Ask** (NL question → safe chart + table)
- **Act** (propose an action → confirm modal → parameterized transaction)
- **Audit** (live timeline of every action, full payload visible)

The Act+Audit loop with human confirmation is the story for judges.
