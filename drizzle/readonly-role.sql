-- Pulse: create the least-privilege role the NL->SQL engine runs as.
-- Run this ONCE against your Aurora PostgreSQL database (after `pnpm db:push`),
-- e.g. with psql or the Vercel/AWS query console. Then set DATABASE_URL_RO to a
-- connection string using this role.

CREATE ROLE pulse_readonly LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

GRANT CONNECT ON DATABASE postgres TO pulse_readonly;  -- adjust db name if not 'postgres'
GRANT USAGE  ON SCHEMA public TO pulse_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pulse_readonly;

-- Future tables created by migrations are also readable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO pulse_readonly;

-- Server-side guardrail: queries from this role can't run longer than 4s.
ALTER ROLE pulse_readonly SET statement_timeout = '4s';

-- This role has NO INSERT/UPDATE/DELETE/DDL. Even if a malicious query slips past
-- the application guard, the database itself refuses to mutate or run long.
