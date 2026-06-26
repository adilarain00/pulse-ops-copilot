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
| NL→plan via Claude (structured + Zod) — `src/lib/plan.ts` | ✅ code complete (needs API key to run) |
| **`POST /api/ask`** read path | ✅ code complete (needs DB + key to run) |
| Ask UI — `src/app/page.tsx` | ✅ |
| Seed script — `scripts/seed.ts` | ✅ (needs DB) |
| **Action layer** — allowlisted, transactional, audited writes — `src/lib/actions.ts` | ✅ **9/9 tests pass** |
| **`POST /api/act`** (confirmed writes) + **`GET /api/audit`** | ✅ code complete |
| Confirmation modal + live audit panel — `src/app/page.tsx` | ✅ |
| Charts (Recharts) — number/bar/line/pie from `chart_spec` — `src/components/Chart.tsx` | ✅ |
| KPI home cards + `GET /api/kpis` — `src/components/KpiCards.tsx` | ✅ |
| Architecture diagram (mermaid, ready to export) — `docs/architecture.md` | ✅ |

`pnpm build`, `pnpm typecheck`, `pnpm test:guard`, and `pnpm test:actions` all pass with **no DB or API key**.

## Run it (after provisioning)

```bash
cp .env.example .env.local      # then fill in the values

# 1) Provision Aurora PostgreSQL via the Vercel AWS Marketplace; put its URL in DATABASE_URL
# 2) Apply schema
pnpm db:push
# 3) (recommended) create the read-only role, then set DATABASE_URL_RO
#    psql "$DATABASE_URL" -f drizzle/readonly-role.sql
# 4) Seed demo data
pnpm db:seed
# 5) Set ANTHROPIC_API_KEY, then run
pnpm dev      # http://localhost:3000
```

## Scripts
- `pnpm dev` / `build` / `start` — Next.js
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test:guard` — SQL safety tests (no DB/key needed)
- `pnpm db:generate` — emit SQL migration from schema
- `pnpm db:push` — apply schema to the database
- `pnpm db:seed` — load realistic DTC demo data

## Safety model (the H0 centerpiece)
1. Model returns **structured JSON** (Zod-validated), never free-form SQL trusted blindly.
2. `guardSelect()` fail-closes: single statement, SELECT/WITH only, no DML/DDL keywords, table allowlist, forced `LIMIT`.
3. Reads execute on a **read-only Postgres role** with a 4s `statement_timeout` — defense in depth.
4. Writes never use model SQL — they go through allowlisted, confirmed, audited actions (Day 2).
