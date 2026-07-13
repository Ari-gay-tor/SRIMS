"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusPill from "@/components/shared/StatusPill";
import ItemIcon from "@/components/icons/items/ItemIcon";
import { useAppStore } from "@/stores/app-store";
import { getStockStatus } from "@/lib/data/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusVariant } from "@/types";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusToVariant: Record<string, StatusVariant> = {
  DRAFT: "draft", PENDING: "pending", APPROVED: "approved",
  REJECTED: "rejected", ISSUED: "issued", PARTIAL: "partial",
};
const stockStatusToVariant: Record<string, StatusVariant> = {
  IN_STOCK: "inStock", LOW: "low", CRITICAL: "critical", OUT_OF_STOCK: "outOfStock",
};
const txnTypeToVariant: Record<string, StatusVariant> = {
  INWARD: "inward", OUTWARD: "outward", ADJUSTMENT: "partial",
};

/** Build trend data from all requisitions, bucketed by day / week / month. */
function buildTrend(reqs: { createdAt: string; status: string }[]) {
  if (!reqs.length) return [];

  const sorted = [...reqs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const fromMs = new Date(sorted[0].createdAt).getTime();
  const toMs   = new Date(sorted[sorted.length - 1].createdAt).getTime();
  const spanDays = (toMs - fromMs) / 86400000;
  const gran = spanDays < 31 ? "day" : spanDays < 91 ? "week" : "month";

  const bucket = new Map<string, { submitted: number; issued: number }>();
  for (const r of reqs) {
    const d = new Date(r.createdAt);
    let key: string;
    if (gran === "day") {
      key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } else if (gran === "week") {
      const off = d.getDay() === 0 ? -6 : 1 - d.getDay();
      const mon = new Date(d.getTime() + off * 86400000);
      key = mon.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } else {
      key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    }
    const b = bucket.get(key) ?? { submitted: 0, issued: 0 };
    b.submitted += 1;
    if (r.status === "ISSUED" || r.status === "PARTIAL") b.issued += 1;
    bucket.set(key, b);
  }
  return Array.from(bucket.entries()).map(([date, v]) => ({ date, ...v }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { requisitions, stockItems, stockTransactions, currentUser } = useAppStore();

  // Employee guard
  useEffect(() => {
    if (currentUser.role === "USER") router.replace("/requisitions/my");
  }, [currentUser.role, router]);

  // ─── Stat values ───────────────────────────────────────────────────────
  const totalReqs    = requisitions.length;
  const pendingCount = requisitions.filter((r) => r.status === "PENDING").length;
  const issuedCount  = requisitions.filter((r) => r.status === "ISSUED" || r.status === "PARTIAL").length;

  const itemsWithStatus = useMemo(
    () => stockItems.map((i) => ({ ...i, stockStatus: getStockStatus(i) })),
    [stockItems]
  );
  const lowStockCount = itemsWithStatus.filter(
    (i) => i.stockStatus !== "IN_STOCK"
  ).length;

  // ─── Trend chart (all data) ────────────────────────────────────────────
  const trendData = useMemo(() => buildTrend(requisitions), [requisitions]);

  // ─── Low stock (top 4) ─────────────────────────────────────────────────
  const lowStockItems = useMemo(
    () => itemsWithStatus.filter((i) => i.stockStatus !== "IN_STOCK").slice(0, 4),
    [itemsWithStatus]
  );

  // ─── Recent data (latest 5) ────────────────────────────────────────────
  const recentReqs = useMemo(
    () => [...requisitions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [requisitions]
  );

  const recentTxns = useMemo(() => stockTransactions.slice(0, 5), [stockTransactions]);

  const iconKeyFor = (itemId: string) =>
    stockItems.find((i) => i.id === itemId)?.iconKey;

  if (currentUser.role === "USER") return null;

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of requisitions and inventory"
      />

      {/* ─── Row 1: Stat cards ───────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="Archive"       iconTint="blue"   label="Total Requisitions" value={totalReqs} />
        <StatCard icon="Hourglass"     iconTint="amber"  label="Pending Approvals"  value={pendingCount} />
        <StatCard icon="PackageCheck"  iconTint="green"  label="Issued / Partial"   value={issuedCount} />
        <StatCard icon="AlertTriangle" iconTint="red"    label="Low Stock Items"     value={lowStockCount} />
      </div>

      {/* ─── Row 2: Trend chart + Low Stock ──────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5">

        <div className="col-span-1 rounded-card border border-border bg-surface-card p-4 lg:col-span-3">
          <h3 className="mb-0.5 text-[14px] font-semibold text-text-primary">Requisition Trend</h3>
          <p className="mb-3 text-[11px] text-text-muted">All requisitions to date</p>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSubmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} iconType="circle" iconSize={7} />
                <Area type="monotone" dataKey="submitted" name="Submitted"
                  stroke="#2563EB" strokeWidth={2} fill="url(#gSubmit)"
                  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
                <Area type="monotone" dataKey="issued" name="Issued"
                  stroke="#10B981" strokeWidth={2} fill="url(#gIssued)"
                  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 rounded-card border border-border bg-surface-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text-primary">Low Stock Alerts</h3>
            <Link href="/inventory/low-stock"
              className="text-[12px] font-medium text-brand-primary hover:underline">
              View All
            </Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="flex h-[155px] items-center justify-center text-[12px] text-text-muted">
              All items sufficiently stocked ✓
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
                  <ItemIcon iconKey={item.iconKey} itemId={item.id} size={20} />
                  <span className="flex-1 truncate text-[12px] font-medium text-text-primary">{item.name}</span>
                  <span className="text-[11px] text-text-muted">{item.currentStock}/{item.minStockLevel}</span>
                  <StatusPill variant={stockStatusToVariant[item.stockStatus]} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Row 3: Recent Requisitions + Recent Transactions ─────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <div className="rounded-card border border-border bg-surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text-primary">Recent Requisitions</h3>
            <Link href="/requisitions/my"
              className="text-[12px] font-medium text-brand-primary hover:underline">
              View All
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary">REQ No.</th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary">By</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Amount</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReqs.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[12px] text-text-muted">No requisitions yet</td></tr>
              ) : recentReqs.map((req) => (
                <tr key={req.id} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <Link href="/requisitions/my"
                      className="text-[12px] font-medium text-brand-primary hover:underline">
                      {req.id}
                    </Link>
                  </td>
                  <td className="py-2 text-[12px] text-text-secondary">{req.userName.split(" ")[0]}</td>
                  <td className="py-2 text-right text-[12px] font-medium">{formatCurrency(req.totalAmount)}</td>
                  <td className="py-2 text-right">
                    <StatusPill variant={statusToVariant[req.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-card border border-border bg-surface-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-text-primary">Recent Transactions</h3>
            <Link href="/inventory/transactions"
              className="text-[12px] font-medium text-brand-primary hover:underline">
              View All
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Type</th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Item</th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Qty</th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[12px] text-text-muted">No transactions yet</td></tr>
              ) : recentTxns.map((txn) => (
                <tr key={txn.id} className="border-b border-border last:border-0">
                  <td className="py-2">
                    <StatusPill
                      variant={txnTypeToVariant[txn.type]}
                      label={txn.type.charAt(0) + txn.type.slice(1).toLowerCase()}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <ItemIcon iconKey={iconKeyFor(txn.itemId)} itemId={txn.itemId} size={18} />
                      <span className="max-w-[100px] truncate text-[12px] text-text-primary">{txn.itemName}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right text-[12px] font-medium">{txn.quantity}</td>
                  <td className="py-2 text-[12px] text-text-secondary">{formatDate(txn.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
