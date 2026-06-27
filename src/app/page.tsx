"use client";

import { useEffect, useRef, useState } from "react";
import { Chart } from "@/components/Chart";
import { KpiCards, type KpiData } from "@/components/KpiCards";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type QueryHistoryEntry = {
  id: string;
  nl_question: string;
  generated_sql: string;
  row_count: number;
  latency_ms: number;
  created_at: string;
};

type Message = {
  id: string;
  question: string;
  response: AskResponse;
  ts: Date;
};

// ─── Sample questions ─────────────────────────────────────────────────────────

const SAMPLES = [
  "How many orders this week?",
  "Revenue by category in the last 30 days",
  "Which orders are stuck and why?",
  "Refunds over $200 this month by reason",
  "What's about to stock out?",
  "Flag all stuck orders for review",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function describeAction(a: Action): string {
  switch (a.name) {
    case "flag_orders":
      return `Flag ${(a.args.order_ids as number[])?.length ?? 0} order(s) for review — reason: "${a.args.reason}"`;
    case "create_refund":
      return `Create a $${a.args.amount} refund on order #${a.args.order_id} — reason: "${a.args.reason}"`;
    case "adjust_inventory": {
      const d = Number(a.args.delta);
      return `Adjust inventory of product #${a.args.product_id} by ${d > 0 ? "+" : ""}${d} — reason: "${a.args.reason}"`;
    }
    default:
      return `Run action: ${a.name}`;
  }
}

function summarize(affected: Record<string, unknown> | undefined): string {
  if (!affected) return "";
  return Object.entries(affected)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.length : String(v)}`)
    .join(" · ");
}

function relativeTime(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ACTION_ICON: Record<string, string> = {
  flag_orders: "⚑",
  create_refund: "↩",
  adjust_inventory: "↕",
};

const ACTION_COLORS: Record<string, string> = {
  flag_orders: "bg-amber-100 text-amber-700",
  create_refund: "bg-blue-100 text-blue-700",
  adjust_inventory: "bg-emerald-100 text-emerald-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<{ action: Action; explanation: string } | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [auditTick, setAuditTick] = useState(0);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/kpis")
      .then((r) => r.json())
      .then(setKpis)
      .catch(() => setKpis({ unavailable: true }));
  }, []);

  useEffect(() => {
    // Fetch query history on mount and after each new message
    (async () => {
      try {
        const r = await fetch("/api/history");
        if (r.ok) {
          const data = await r.json();
          setQueryHistory(data.entries ?? []);
        }
      } catch {
        // Silently fail
      }
    })();
  }, [messages.length]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setToast(null);
    const msgId = crypto.randomUUID();
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data: AskResponse = await r.json();
      const msg: Message = { id: msgId, question, response: data, ts: new Date() };
      setMessages((prev) => [msg, ...prev]);
      if ("intent" in data && data.intent === "action") {
        setPending({ action: data.action, explanation: data.explanation });
      }
    } catch {
      const msg: Message = { id: msgId, question, response: { error: "Network error" }, ts: new Date() };
      setMessages((prev) => [msg, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  function submit(question: string) {
    setQ("");
    ask(question);
  }

  const isDemo = kpis?.demo === true;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-md">
              <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5ZM8 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7ZM14 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4Z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white">Pulse</div>
              <div className="text-xs text-slate-400">AI Ops Copilot · Amazon Aurora PostgreSQL</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
                DEMO MODE
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-slate-700/60 px-3 py-1 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isDemo ? "Simulated" : "Live"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Demo banner ────────────────────────────────────────────────────── */}
      {isDemo && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5">
          <div className="mx-auto max-w-5xl text-center text-xs text-amber-700">
            <strong>Demo Mode</strong> — AI responses and database calls are simulated. All query results, charts, and actions use realistic pre-seeded data. The live path uses Anthropic Claude + Amazon Aurora PostgreSQL.
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 space-y-6">
        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <KpiCards kpis={kpis} />

        {/* ── Ask bar ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(q.trim());
            }}
            className="flex gap-2"
          >
            <div className="relative flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
              <svg
                className="mr-3 h-4 w-4 flex-shrink-0 text-indigo-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask about orders, revenue, inventory — or ask to flag / refund / restock…"
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
                  </span>
                  <span>Thinking</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                  </svg>
                  Ask AI
                </>
              )}
            </button>
          </form>

          {/* Sample chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Toast ────────────────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{toast.tone === "success" ? "✓" : "✕"}</span>
            {toast.text}
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-current opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Conversation history ──────────────────────────────────────────── */}
        {messages.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Results
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageCard key={msg.id} msg={msg} />
              ))}
            </div>
          </section>
        )}

        {/* ── Query History ─────────────────────────────────────────────────── */}
        <QueryHistoryPanel entries={queryHistory} />

        {/* ── Audit log ─────────────────────────────────────────────────────── */}
        <AuditPanel refreshKey={auditTick} />
      </main>

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      {pending && (
        <ConfirmModal
          action={pending.action}
          explanation={pending.explanation}
          onCancel={() => setPending(null)}
          onConfirmed={(text) => {
            setPending(null);
            setToast({ text, tone: "success" });
            setAuditTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

// ─── MessageCard ──────────────────────────────────────────────────────────────

function MessageCard({ msg }: { msg: Message }) {
  const res = msg.response;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Question header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs text-white font-bold">
            U
          </div>
          <span className="truncate text-sm font-medium text-slate-800">{msg.question}</span>
        </div>
        <time className="flex-shrink-0 text-xs text-slate-400">{formatTime(msg.ts)}</time>
      </div>

      {/* Response body */}
      <div className="px-5 py-4">
        {"error" in res ? (
          <Banner tone="error">{res.error}</Banner>
        ) : res.intent === "refuse" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">⚠</span>
              <p className="text-sm text-slate-700">{res.explanation}</p>
            </div>
            {res.sql && <SqlBlock sql={res.sql} />}
          </div>
        ) : res.intent === "action" ? (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">◈</span>
            <p className="text-sm text-slate-700">
              Action proposed — review the confirmation dialog before proceeding.
            </p>
          </div>
        ) : (
          <QueryResult res={res} />
        )}
      </div>
    </div>
  );
}

// ─── QueryResult ──────────────────────────────────────────────────────────────

function QueryResult({
  res,
}: {
  res: Extract<AskResponse, { intent: "query" }>;
}) {
  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">
            ◈
          </div>
          <span className="text-xs font-semibold text-indigo-700">Pulse</span>
        </div>
        <span className="h-3 w-px bg-slate-200" />
        <MetaBadge>{res.rowCount} row{res.rowCount !== 1 ? "s" : ""}</MetaBadge>
        <MetaBadge>{res.latencyMs} ms</MetaBadge>
        <MetaBadge>{res.chartSpec.type} chart</MetaBadge>
      </div>

      <p className="text-sm text-slate-700">{res.explanation}</p>

      <SafetyPipeline latencyMs={res.latencyMs} />

      {res.chartSpec.type !== "table" && (
        <Chart spec={res.chartSpec} columns={res.columns} rows={res.rows} />
      )}

      <DataTable columns={res.columns} rows={res.rows} />
      <SqlBlock sql={res.sql} />

      {res.warnings?.length > 0 && (
        <Banner tone="warn">{res.warnings.join("; ")}</Banner>
      )}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

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
      onConfirmed(`Done: ${action.name.replace(/_/g, " ")}. ${summarize(data.affected)}`);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              ⚑
            </div>
            <h2 className="text-base font-semibold text-slate-900">Confirm action</h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-800">{describeAction(action)}</p>
            <p className="mt-1 text-xs text-slate-500">{explanation}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50">
            <div className="border-b border-slate-100 px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Arguments
              </span>
            </div>
            <pre className="max-h-40 overflow-auto px-3 py-2.5 text-xs text-slate-700">
              {JSON.stringify(action.args, null, 2)}
            </pre>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Working…
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AuditPanel ───────────────────────────────────────────────────────────────

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
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Audit Log
        </h2>
        {entries.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {entries.length}
          </span>
        )}
      </div>

      {!loaded ? (
        <div className="mt-4 flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 flex-1 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-4 flex flex-col items-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
            ⚑
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">No actions yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Try <em className="text-indigo-500">"Flag all stuck orders for review"</em>
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  ACTION_COLORS[e.action_type] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {ACTION_ICON[e.action_type] ?? "●"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {e.action_type.replace(/_/g, " ")}
                  </span>
                  <span className="flex-shrink-0 text-xs text-slate-400">
                    {relativeTime(e.created_at)} · {e.actor}
                  </span>
                </div>
                {e.payload?.affected && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {summarize(e.payload.affected)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400">No rows returned.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400">
          Showing first 50 of {rows.length} rows
        </div>
      )}
    </div>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-slate-500 hover:bg-slate-50"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
        Generated SQL
      </button>
      {open && (
        <pre className="overflow-x-auto border-t border-slate-100 bg-slate-50 px-4 pb-3 pt-2 font-mono text-slate-700">
          {sql}
        </pre>
      )}
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "error" | "warn" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

// ─── SafetyPipeline ───────────────────────────────────────────────────────────

function SafetyPipeline({ latencyMs }: { latencyMs: number }) {
  const pipeline = [
    { step: 1, label: "Structured JSON", icon: "◈" },
    { step: 2, label: "Zod Validation", icon: "✓" },
    { step: 3, label: "SQL Parser", icon: "◀" },
    { step: 4, label: "RO Role", icon: "🔒" },
    { step: 5, label: "Statement Timeout", icon: "⏱" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          5-Layer Safety Pipeline
        </span>
        <span className="text-xs text-slate-400">{latencyMs} ms</span>
      </div>
      <div className="flex items-center gap-1">
        {pipeline.map((layer, idx) => (
          <div key={layer.step} className="flex flex-1 items-center gap-0.5">
            <div
              title={layer.label}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white"
            >
              {layer.icon}
            </div>
            {idx < pipeline.length - 1 && (
              <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-300 to-slate-300" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-600">
        All AI-generated SQL runs through <strong>5 independent safety layers</strong>: structured output validation →
        parser allowlist → read-only Postgres role → automatic statement timeout.
      </div>
    </div>
  );
}

// ─── QueryHistoryPanel ────────────────────────────────────────────────────────

function QueryHistoryPanel({ entries }: { entries: QueryHistoryEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        Query History ({entries.length})
      </h2>
      <div className="space-y-2">
        {entries.slice(0, 5).map((entry) => (
          <div key={entry.id} className="group rounded-lg border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{entry.nl_question}</p>
                <p className="mt-1 font-mono text-xs text-slate-500 line-clamp-1">{entry.generated_sql}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                  {entry.row_count} rows
                </span>
                <span className="block text-xs text-slate-400 mt-1">{entry.latency_ms} ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
