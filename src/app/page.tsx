"use client";

import { useEffect, useState } from "react";
import { Chart } from "@/components/Chart";
import { KpiCards } from "@/components/KpiCards";

type Action = { name: string; args: Record<string, unknown> };

type AskResponse =
  | {
      intent: "query";
      sql: string;
      columns: string[];
      rows: Record<string, unknown>[];
      rowCount: number;
      latencyMs: number;
      chartSpec: { type: string; x?: string; y?: string };
      explanation: string;
      warnings: string[];
    }
  | { intent: "action"; action: Action; explanation: string }
  | { intent: "refuse"; explanation: string; sql?: string }
  | { error: string };

type AuditEntry = {
  id: string;
  actor: string;
  action_type: string;
  entity_type: string;
  payload: { args?: Record<string, unknown>; affected?: Record<string, unknown> };
  created_at: string;
};

const SAMPLES = [
  "How many orders this week?",
  "Revenue by category in the last 30 days",
  "Which orders are stuck and why?",
  "Refunds over $200 this month by reason",
  "What's about to stock out?",
  "Flag all stuck orders for review",
];

function describeAction(a: Action): string {
  switch (a.name) {
    case "flag_orders":
      return `Flag ${(a.args.order_ids as number[])?.length ?? 0} order(s) for review — reason: "${a.args.reason}".`;
    case "create_refund":
      return `Create a $${a.args.amount} refund on order #${a.args.order_id} — reason: "${a.args.reason}".`;
    case "adjust_inventory": {
      const d = Number(a.args.delta);
      return `Adjust inventory of product #${a.args.product_id} by ${d > 0 ? "+" : ""}${d} — reason: "${a.args.reason}".`;
    }
    default:
      return `Run action: ${a.name}`;
  }
}

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AskResponse | null>(null);
  const [pending, setPending] = useState<{ action: Action; explanation: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [auditTick, setAuditTick] = useState(0);

  async function ask(question: string) {
    setLoading(true);
    setRes(null);
    setToast(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data: AskResponse = await r.json();
      setRes(data);
      if ("intent" in data && data.intent === "action") {
        setPending({ action: data.action, explanation: data.explanation });
      }
    } catch {
      setRes({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Pulse</h1>
        <p className="text-sm text-gray-500">
          AI ops copilot for SMBs · ask <em>and act on</em> your Aurora PostgreSQL data in plain English
        </p>
      </header>

      <div className="mb-8">
        <KpiCards />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) ask(q.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about orders, inventory, customers — or ask to flag/refund/restock…"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQ(s);
              ask(s);
            }}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-gray-400"
          >
            {s}
          </button>
        ))}
      </div>

      {toast && <Banner tone="info">{toast}</Banner>}
      {res && <Result res={res} />}

      <AuditPanel refreshKey={auditTick} />

      {pending && (
        <ConfirmModal
          action={pending.action}
          explanation={pending.explanation}
          onCancel={() => setPending(null)}
          onConfirmed={(msg) => {
            setPending(null);
            setToast(msg);
            setAuditTick((t) => t + 1);
          }}
        />
      )}
    </main>
  );
}

function Result({ res }: { res: AskResponse }) {
  if ("error" in res) return <Banner tone="error">{res.error}</Banner>;

  if (res.intent === "refuse") {
    return (
      <div className="mt-8">
        <Banner tone="warn">{res.explanation}</Banner>
        {res.sql && <Sql sql={res.sql} />}
      </div>
    );
  }

  if (res.intent === "action") {
    // The modal handles confirmation; show a quiet hint here.
    return <Banner tone="info">Proposed action ready — review and confirm in the dialog.</Banner>;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{res.rowCount} rows</span>
        <span>·</span>
        <span>{res.latencyMs} ms</span>
        <span>·</span>
        <span>chart: {res.chartSpec.type}</span>
      </div>
      <p className="text-sm text-gray-700">{res.explanation}</p>
      {res.chartSpec.type !== "table" && (
        <Chart spec={res.chartSpec} columns={res.columns} rows={res.rows} />
      )}
      <Table columns={res.columns} rows={res.rows} />
      <Sql sql={res.sql} />
      {res.warnings?.length > 0 && <Banner tone="warn">{res.warnings.join("; ")}</Banner>}
    </div>
  );
}

function ConfirmModal({
  action,
  explanation,
  onCancel,
  onConfirmed,
}: {
  action: Action;
  explanation: string;
  onCancel: () => void;
  onConfirmed: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: action.name, args: action.args }),
      });
      const data = await r.json();
      if (!r.ok || data.error) {
        setError(data.error ?? "Action failed");
        return;
      }
      onConfirmed(`Done: ${action.name}. ${summarize(data.affected)}`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Confirm action</h2>
        <p className="mt-2 text-sm text-gray-700">{describeAction(action)}</p>
        <p className="mt-1 text-xs text-gray-500">{explanation}</p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
          {JSON.stringify(action.args, null, 2)}
        </pre>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditPanel({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/audit");
        const data = await r.json();
        if (active) setEntries(data.entries ?? []);
      } catch {
        if (active) setEntries([]);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <section className="mt-12">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Audit log</h2>
      {!loaded ? (
        <p className="mt-2 text-sm text-gray-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">No actions yet. Try “Flag all stuck orders for review”.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{e.action_type}</span>
                <span className="text-xs text-gray-400">
                  {new Date(e.created_at).toLocaleString()} · {e.actor}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">{summarize(e.payload?.affected)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function summarize(affected: Record<string, unknown> | undefined): string {
  if (!affected) return "";
  return Object.entries(affected)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : String(v)}`)
    .join(" · ");
}

function Table({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">No rows.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              {columns.map((c) => (
                <td key={c} className="px-3 py-2">{String(row[c] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sql({ sql }: { sql: string }) {
  return (
    <details className="rounded-lg border border-gray-200">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-600">Generated SQL</summary>
      <pre className="overflow-x-auto px-3 pb-3 text-xs text-gray-800">{sql}</pre>
    </details>
  );
}

function Banner({ tone, children }: { tone: "error" | "warn" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];
  return <div className={`mt-8 rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
