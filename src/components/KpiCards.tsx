"use client";

export type KpiData = {
  revenueToday?: number;
  stuckOrders?: number;
  lowStock?: number;
  refundRatePct?: number;
  unavailable?: boolean;
  demo?: boolean;
  trends?: {
    revenueToday?: number;
    stuckOrders?: number;
    lowStock?: number;
    refundRatePct?: number;
  };
};

function TrendBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {value > 0 ? "▲" : "▼"} {sign}{value}
    </span>
  );
}

const ICONS = {
  revenue: (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 0 1-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582ZM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 0 1-.567.267Z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v.798a4.185 4.185 0 0 0-.821.277 2.688 2.688 0 0 0-1.135 1.118c-.23.432-.342.924-.342 1.557 0 .633.112 1.125.342 1.557.23.43.577.763 1.135 1.118.26.15.539.268.821.277v1.806l-.321-.063c-.44-.088-.89-.213-1.175-.421a.75.75 0 0 0-.879 1.21c.589.43 1.33.601 1.84.676v.748a.75.75 0 0 0 1.5 0v-.798a4.192 4.192 0 0 0 .821-.277 2.688 2.688 0 0 0 1.135-1.118c.23-.432.342-.924.342-1.557 0-.633-.112-1.125-.342-1.557a2.688 2.688 0 0 0-1.135-1.118 4.186 4.186 0 0 0-.821-.277V6.75l.321.063c.44.088.89.213 1.175.421a.75.75 0 0 0 .879-1.21c-.589-.43-1.33-.601-1.84-.676v-.748Z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
    </svg>
  ),
  box: (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4.464 3.162A2 2 0 0 1 6.28 2h7.44a2 2 0 0 1 1.816 1.162l1.154 2.5c.067.145.1.305.1.469v.272A2.75 2.75 0 0 1 14.04 9H5.96A2.75 2.75 0 0 1 3.21 6.403v-.272c0-.164.033-.324.1-.469l1.154-2.5ZM3.5 9.773A4.24 4.24 0 0 0 5.96 10.5h8.08a4.24 4.24 0 0 0 2.46-.727V15a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V9.773ZM8 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" />
    </svg>
  ),
  refund: (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L6.107 5h6.143a3.75 3.75 0 0 1 0 7.5H6a.75.75 0 0 1 0-1.5h6.25a2.25 2.25 0 0 0 0-4.5H6.107l1.661 1.708a.75.75 0 1 1-1.086 1.034L4.31 7.214a.75.75 0 0 1 0-1.034l2.372-2.44a.75.75 0 0 1 1.06.025l.051.467Z" clipRule="evenodd" />
    </svg>
  ),
};

export function KpiCards({ kpis }: { kpis: KpiData | null }) {
  const k = kpis;

  const cards = [
    {
      label: "Revenue Today",
      value: k ? "$" + (k.revenueToday ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—",
      icon: ICONS.revenue,
      iconBg: "bg-indigo-100 text-indigo-600",
      trend: k?.trends?.revenueToday != null ? (
        <TrendBadge value={k.trends.revenueToday} />
      ) : null,
      alert: false,
      sub: "vs. yesterday",
    },
    {
      label: "Stuck Orders",
      value: k ? (k.stuckOrders ?? 0).toLocaleString() : "—",
      icon: ICONS.warning,
      iconBg: (k?.stuckOrders ?? 0) > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400",
      trend: k?.trends?.stuckOrders != null ? (
        <TrendBadge value={k.trends.stuckOrders} invert />
      ) : null,
      alert: (k?.stuckOrders ?? 0) > 0,
      sub: "needs attention",
    },
    {
      label: "Low Stock SKUs",
      value: k ? (k.lowStock ?? 0).toLocaleString() : "—",
      icon: ICONS.box,
      iconBg: (k?.lowStock ?? 0) > 0 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400",
      trend: k?.trends?.lowStock != null ? (
        <TrendBadge value={k.trends.lowStock} invert />
      ) : null,
      alert: (k?.lowStock ?? 0) > 0,
      sub: "below reorder point",
    },
    {
      label: "Refund Rate (30d)",
      value: k ? `${k.refundRatePct ?? 0}%` : "—",
      icon: ICONS.refund,
      iconBg: (k?.refundRatePct ?? 0) > 5 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500",
      trend: k?.trends?.refundRatePct != null ? (
        <TrendBadge value={k.trends.refundRatePct} invert />
      ) : null,
      alert: false,
      sub: "of orders refunded",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`group relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
            c.alert ? "border-amber-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconBg}`}>
              {c.icon}
            </div>
            {c.trend && <div>{c.trend}</div>}
          </div>
          <div className={`mt-3 text-2xl font-bold tracking-tight ${c.alert ? "text-amber-600" : "text-slate-900"}`}>
            {c.value}
          </div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</div>
          {c.sub && <div className="mt-0.5 text-xs text-slate-400">{c.sub}</div>}
        </div>
      ))}
    </section>
  );
}
