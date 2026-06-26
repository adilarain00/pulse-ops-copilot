"use client";

import { useEffect, useState } from "react";

type Kpis = {
  revenueToday?: number;
  stuckOrders?: number;
  lowStock?: number;
  refundRatePct?: number;
  unavailable?: boolean;
};

export function KpiCards() {
  const [k, setK] = useState<Kpis | null>(null);

  useEffect(() => {
    fetch("/api/kpis")
      .then((r) => r.json())
      .then(setK)
      .catch(() => setK({ unavailable: true }));
  }, []);

  const cards = [
    { label: "Revenue today", value: k ? money(k.revenueToday) : "—" },
    { label: "Stuck orders", value: k ? num(k.stuckOrders) : "—", alert: (k?.stuckOrders ?? 0) > 0 },
    { label: "Low stock SKUs", value: k ? num(k.lowStock) : "—", alert: (k?.lowStock ?? 0) > 0 },
    { label: "Refund rate (30d)", value: k ? pct(k.refundRatePct) : "—" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 p-4">
          <div className={`text-2xl font-bold tracking-tight ${c.alert ? "text-amber-600" : ""}`}>
            {c.value}
          </div>
          <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{c.label}</div>
        </div>
      ))}
    </section>
  );
}

function money(v?: number) {
  if (v == null) return "—";
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function num(v?: number) {
  return v == null ? "—" : v.toLocaleString();
}
function pct(v?: number) {
  return v == null ? "—" : `${v}%`;
}
