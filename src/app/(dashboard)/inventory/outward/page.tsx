"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ItemIcon from "@/components/icons/items/ItemIcon";
import RequisitionDetailModal from "@/components/shared/RequisitionDetailModal";
import { useAppStore } from "@/stores/app-store";
import { formatDateTime } from "@/lib/utils";
import { MockRequisition } from "@/lib/data/mock-data";
import { ArrowUpFromLine, Plus, Search, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

type Period = "this_month" | "last_3_months" | "last_6_months" | "last_year" | "all";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadXlsx(filename: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock Outward");
  XLSX.writeFile(wb, filename);
}

function getPeriodRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let from: Date;
  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_3_months":
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "last_6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      from = new Date(2000, 0, 1);
  }
  return { from, to };
}

export default function StockOutwardPage() {
  const searchParams = useSearchParams();
  const { stockItems, stockTransactions, requisitions, recordManualMovement } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [linkedRequisitionId, setLinkedRequisitionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [viewingRequisition, setViewingRequisition] = useState<MockRequisition | null>(null);

  useEffect(() => {
    const itemParam = searchParams.get("item");
    if (itemParam) { setItemId(itemParam); setShowForm(true); }
  }, [searchParams]);

  const allOutward = stockTransactions.filter((t) => t.type === "OUTWARD");

  const filteredHistory = useMemo(() => {
    const { from, to } = getPeriodRange(period);
    let data = allOutward.filter((t) => {
      const d = new Date(t.date);
      return d >= from && d <= to;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (t) => t.itemName.toLowerCase().includes(q) ||
               t.referenceNo.toLowerCase().includes(q) ||
               (t.linkedRequisitionId || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [allOutward, period, searchQuery]);

  const findRequisition = (reqId?: string) =>
    reqId ? requisitions.find((r) => r.id === reqId) : undefined;

  const selectedItem = stockItems.find((i) => i.id === itemId);
  const linkableRequisitions = useMemo(
    () => requisitions.filter((r) => ["APPROVED", "ISSUED", "PARTIAL"].includes(r.status)),
    [requisitions]
  );

  const handleSubmit = () => {
    if (!selectedItem || quantity <= 0) return;
    recordManualMovement({
      type: "OUTWARD",
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity,
      unitPrice: selectedItem.unitPrice,
      referenceNo: referenceNo || `OUT-${Date.now().toString().slice(-6)}`,
      remarks: reason,
      linkedRequisitionId: linkedRequisitionId || undefined,
    });
    setShowForm(false);
    setItemId(""); setQuantity(1); setReason(""); setReferenceNo(""); setLinkedRequisitionId("");
  };

  const periodLabel: Record<Period, string> = {
    all: "All Time",
    this_month: "This Month",
    last_3_months: "Last 3 Months",
    last_6_months: "Last 6 Months",
    last_year: "Last Year",
  };

  const exportHeaders = ["Date", "Item", "Qty", "Requisition ID", "Reference No", "Unit Price (₹)", "Total (₹)"];
  const exportRows = filteredHistory.map((t) => [
    formatDateTime(t.date),
    t.itemName,
    t.quantity,
    t.linkedRequisitionId || "—",
    t.referenceNo,
    t.unitPrice.toFixed(2),
    (t.quantity * t.unitPrice).toFixed(2),
  ]);

  return (
    <div>
      <PageHeader
        title="Stock Outward"
        subtitle="Outward movements — auto-generated on approval + manual entries"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover"
          >
            <Plus size={16} />
            Manual Entry
          </button>
        }
      />

      {/* Manual entry form */}
      {showForm && (
        <div className="mb-5 rounded-card border border-border bg-surface-card p-4">
          <h3 className="mb-3 text-[14px] font-semibold text-text-primary">New Manual Stock Outward</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Item *</label>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none">
                <option value="">Select item...</option>
                {stockItems.map((i) => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Quantity *</label>
              <input type="number" value={quantity} min={1} max={selectedItem?.currentStock || 9999}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Link to Requisition (optional)</label>
              <select value={linkedRequisitionId} onChange={(e) => setLinkedRequisitionId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none">
                <option value="">No requisition — independent movement</option>
                {linkableRequisitions.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.userName} ({r.departmentName})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Reference No.</label>
              <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Auto if blank"
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged, Write-off"
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
            </div>
          </div>
          {selectedItem && quantity > selectedItem.currentStock && (
            <p className="mt-2 text-[11px] text-red-600">Quantity exceeds available stock ({selectedItem.currentStock})</p>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={!itemId || (selectedItem ? quantity > selectedItem.currentStock : false)}
              className="rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40">
              Record Outward
            </button>
          </div>
        </div>
      )}

      {/* History table */}
      <div className="rounded-card border border-border bg-surface-card">
        {/* Filter + export bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search item, reference, req ID..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-button border border-border py-1.5 pl-8 pr-2 text-[12px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none" />
          </div>

          {/* Period filter */}
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-button border border-border px-3 py-1.5 text-[12px] text-text-secondary focus:border-brand-primary focus:outline-none">
            {(Object.keys(periodLabel) as Period[]).map((p) => (
              <option key={p} value={p}>{periodLabel[p]}</option>
            ))}
          </select>

          {/* Export buttons */}
          <button
            onClick={() => downloadCsv(
              `stock_outward_${period}_${new Date().toISOString().slice(0, 10)}.csv`,
              [exportHeaders, ...exportRows.map(r => r.map(String))]
            )}
            className="flex items-center gap-1.5 rounded-button border border-border px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-gray-50"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={() => downloadXlsx(
              `stock_outward_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`,
              exportHeaders,
              exportRows
            )}
            className="flex items-center gap-1.5 rounded-button border border-green-600 px-3 py-1.5 text-[12px] font-medium text-green-700 hover:bg-green-50"
          >
            <FileSpreadsheet size={14} />
            XLSX
          </button>

          <span className="text-[11px] text-text-muted ml-auto">
            {filteredHistory.length} movement{filteredHistory.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Item</th>
                <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Qty</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Requisition ID</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Reference No.</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Date</th>
                <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[14px] text-text-muted">
                  No outward movements in {periodLabel[period].toLowerCase()}
                </td></tr>
              ) : filteredHistory.map((txn) => {
                const linkedReq = findRequisition(txn.linkedRequisitionId);
                const stockItem = stockItems.find((i) => i.id === txn.itemId);
                return (
                  <tr key={txn.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon iconKey={stockItem?.iconKey} itemId={txn.itemId} size={22} />
                        <span className="text-[13px] text-text-primary">{txn.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-[13px] font-medium text-red-600">
                        <ArrowUpFromLine size={11} />{txn.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {linkedReq ? (
                        <button onClick={() => setViewingRequisition(linkedReq)}
                          className="text-[13px] font-medium text-brand-primary hover:underline">
                          {linkedReq.id}
                        </button>
                      ) : (
                        <span className="text-[13px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{txn.referenceNo}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{formatDateTime(txn.date)}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-text-primary">
                      ₹{(txn.quantity * txn.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredHistory.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-gray-50">
                  <td colSpan={5} className="px-4 py-2 text-right text-[12px] font-semibold text-text-primary">
                    Total ({periodLabel[period]})
                  </td>
                  <td className="px-4 py-2 text-right text-[13px] font-bold text-brand-primary">
                    ₹{filteredHistory.reduce((s, t) => s + t.quantity * t.unitPrice, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <RequisitionDetailModal requisition={viewingRequisition} onClose={() => setViewingRequisition(null)} />
    </div>
  );
}
