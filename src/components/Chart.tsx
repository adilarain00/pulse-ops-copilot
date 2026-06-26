"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartSpec = { type: string; x?: string; y?: string };
type Row = Record<string, unknown>;

const COLORS = ["#0f172a", "#2563eb", "#16a34a", "#d97706", "#db2777", "#7c3aed", "#0891b2"];

/** Render a query result per the model's chart_spec. Returns null to fall back to a table. */
export function Chart({
  spec,
  columns,
  rows,
}: {
  spec: ChartSpec;
  columns: string[];
  rows: Row[];
}) {
  if (!rows.length) return null;

  const numericCols = columns.filter((c) => rows.every((r) => isNumeric(r[c])));
  const y = spec.y && columns.includes(spec.y) ? spec.y : numericCols[0];
  const x = spec.x && columns.includes(spec.x) ? spec.x : columns.find((c) => c !== y);

  if (spec.type === "number") {
    const col = y ?? columns[0];
    const value = rows.length === 1 ? rows[0][col] : rows.length;
    const label = rows.length === 1 ? humanize(col) : "rows";
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <div className="text-4xl font-bold tracking-tight">{formatNum(value)}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{label}</div>
      </div>
    );
  }

  // bar/line/pie need both an x (category) and a numeric y.
  if (!x || !y) return null;
  const data = rows.map((r) => ({ ...r, [y]: toNum(r[y]) }));

  return (
    <div className="h-72 w-full rounded-xl border border-gray-200 p-4">
      <ResponsiveContainer width="100%" height="100%">
        {spec.type === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey={x} fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey={y} stroke={COLORS[1]} strokeWidth={2} dot={false} />
          </LineChart>
        ) : spec.type === "pie" ? (
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey={y} nameKey={x} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey={x} fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey={y} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function isNumeric(v: unknown): boolean {
  if (typeof v === "number") return true;
  if (typeof v === "string" && v.trim() !== "") return !Number.isNaN(Number(v));
  return false;
}
function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}
function formatNum(v: unknown): string {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v ?? "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function humanize(s: string): string {
  return s.replace(/_/g, " ");
}
