/**
 * SQL guard — never trust model-generated SQL.
 *
 * Two independent layers protect the read path (the database read-only role is
 * a third, at the infrastructure level):
 *
 *   Layer 1 (fail-closed regex): reject anything that isn't a single read
 *     statement — no DML/DDL keywords, no statement chaining, must start with
 *     SELECT or WITH.
 *   Layer 2 (AST allowlist): parse the statement and assert it's a SELECT that
 *     only touches allowlisted tables. If the PG-specific parser can't handle
 *     the syntax, we don't hard-fail (Layer 1 already blocked the dangerous
 *     shapes and the RO role can't write) — we surface a warning instead.
 *
 * A hard LIMIT is appended when the query lacks one, bounding result size.
 */
import { Parser } from "node-sql-parser";

export const ALLOWED_TABLES = new Set([
  "customers",
  "products",
  "orders",
  "order_items",
  "refunds",
  "shipments",
  "order_flags",
  "inventory_adjustments",
  "query_history",
  "audit_log",
]);

const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|comment|copy|merge|call|do|vacuum|analyze|reindex|set|reset|begin|commit|rollback)\b/i;
const DEFAULT_LIMIT = 1000;

export class UnsafeSqlError extends Error {}

export interface GuardResult {
  sql: string; // sanitized SQL ready to execute (LIMIT enforced)
  warnings: string[];
}

export function guardSelect(raw: string, maxLimit = DEFAULT_LIMIT): GuardResult {
  const warnings: string[] = [];
  let sql = raw.trim().replace(/;+\s*$/, ""); // strip trailing semicolons

  if (!sql) throw new UnsafeSqlError("Empty query");

  // Reject statement chaining (a semicolon anywhere other than the stripped tail).
  if (sql.includes(";")) throw new UnsafeSqlError("Multiple statements are not allowed");

  // Layer 1: fail-closed keyword + shape checks.
  if (!/^\s*(select|with)\b/i.test(sql)) {
    throw new UnsafeSqlError("Only SELECT (or WITH ... SELECT) queries are allowed");
  }
  if (FORBIDDEN.test(stripStringLiterals(sql))) {
    throw new UnsafeSqlError("Query contains a forbidden keyword");
  }

  // Layer 2: AST allowlist (best-effort; PG dialect coverage isn't 100%).
  try {
    const parser = new Parser();
    const ast = parser.astify(sql, { database: "postgresql" });
    const statements = Array.isArray(ast) ? ast : [ast];
    if (statements.length !== 1) throw new UnsafeSqlError("Multiple statements are not allowed");
    const type = (statements[0] as { type?: string }).type;
    if (type !== "select") throw new UnsafeSqlError(`Only SELECT permitted (got ${type})`);

    // CTE names (WITH x AS …) are internal aliases, not real tables — allow them.
    const cteNames = collectCteNames(statements[0]);

    for (const entry of parser.tableList(sql, { database: "postgresql" })) {
      // entries look like "select::null::orders"
      const table = entry.split("::").pop()!.toLowerCase();
      if (table === "null" || table === "dual") continue;
      if (cteNames.has(table)) continue;
      if (!ALLOWED_TABLES.has(table)) {
        throw new UnsafeSqlError(`Table not allowed: ${table}`);
      }
    }
  } catch (err) {
    if (err instanceof UnsafeSqlError) throw err;
    // Parser couldn't handle the PG syntax — Layer 1 + RO role still protect us.
    warnings.push("AST validation skipped (parser limitation); relying on keyword guard + read-only role");
  }

  // Enforce a result-size ceiling.
  if (!/\blimit\b/i.test(sql)) {
    sql = `${sql}\nLIMIT ${maxLimit}`;
  }

  return { sql, warnings };
}

/** Replace single-quoted string contents so keywords inside literals don't trip the guard. */
function stripStringLiterals(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, "''");
}

/** Pull CTE names out of a parsed SELECT's WITH clause (shape varies across parser versions). */
function collectCteNames(stmt: unknown): Set<string> {
  const names = new Set<string>();
  const withClause = (stmt as { with?: unknown }).with;
  const list = Array.isArray(withClause) ? withClause : [];
  for (const cte of list) {
    const name = (cte as { name?: unknown }).name;
    const value =
      typeof name === "string" ? name : (name as { value?: unknown })?.value;
    if (typeof value === "string") names.add(value.toLowerCase());
  }
  return names;
}
