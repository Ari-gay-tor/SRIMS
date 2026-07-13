"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ItemIcon from "@/components/icons/items/ItemIcon";
import { useAppStore } from "@/stores/app-store";
import { formatDateTime } from "@/lib/utils";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";

export default function AdjustStockPage() {
  const searchParams = useSearchParams();
  const { stockItems, stockTransactions, recordManualMovement } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [itemId, setItemId] = useState("");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  // Deep-link support: /inventory/adjust?item=ITM-0001 (used by Stock Overview's kebab menu)
  useEffect(() => {
    const itemParam = searchParams.get("item");
    if (itemParam) {
      setItemId(itemParam);
      setShowForm(true);
    }
  }, [searchParams]);

  const adjustmentHistory = stockTransactions.filter((t) => t.type === "ADJUSTMENT");
  const selectedItem = stockItems.find((i) => i.id === itemId);

  const handleSubmit = () => {
    if (!selectedItem || quantity <= 0 || !reason) return;
    const signedQty = direction === "increase" ? quantity : -quantity;
    recordManualMovement({
      type: "ADJUSTMENT",
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: signedQty,
      unitPrice: selectedItem.unitPrice,
      referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
      remarks: reason,
    });
    setShowForm(false);
    setItemId("");
    setQuantity(1);
    setReason("");
  };

  return (
    <div>
      <PageHeader
        title="Adjust Stock"
        subtitle="Correct stock discrepancies from physical counts, damage, or loss"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover"
          >
            <Plus size={16} />
            New Adjustment
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-card border border-border bg-surface-card p-card-padding">
          <h3 className="mb-4 text-[15px] font-semibold text-text-primary">New Stock Adjustment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Item *</label>
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
              >
                <option value="">Select item...</option>
                {stockItems.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} (Current: {i.currentStock} {i.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Direction</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("increase")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-button border px-3 py-2 text-[13px] font-medium ${
                    direction === "increase" ? "border-green-500 bg-green-50 text-green-700" : "border-border text-text-secondary"
                  }`}
                >
                  <ArrowUp size={14} />
                  Increase
                </button>
                <button
                  onClick={() => setDirection("decrease")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-button border px-3 py-2 text-[13px] font-medium ${
                    direction === "decrease" ? "border-red-500 bg-red-50 text-red-700" : "border-border text-text-secondary"
                  }`}
                >
                  <ArrowDown size={14} />
                  Decrease
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Quantity *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-text-primary">Reason *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Physical count correction, Damaged in storage"
                className="w-full rounded-button border border-border px-3 py-2 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>
          {selectedItem && (
            <div className="mt-3 rounded-md bg-gray-50 p-2.5 text-[12px] text-text-secondary">
              New stock level will be: <span className="font-semibold text-text-primary">
                {Math.max(0, selectedItem.currentStock + (direction === "increase" ? quantity : -quantity))} {selectedItem.unit}
              </span>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!itemId || quantity <= 0 || !reason}
              className="rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      )}

      <div className="rounded-card border border-border bg-surface-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Item</th>
                <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Adjustment</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Reference</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {adjustmentHistory.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-[14px] text-text-muted">No adjustments recorded</td></tr>
              ) : (
                adjustmentHistory.map((txn) => (
                  <tr key={txn.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ItemIcon itemId={txn.itemId} size={24} />
                        <span className="text-[13px] text-text-primary">{txn.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[13px] font-medium ${txn.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {txn.quantity > 0 ? "+" : ""}{txn.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{txn.referenceNo}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{formatDateTime(txn.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
