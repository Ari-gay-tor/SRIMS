"use client";

import React, { useState } from "react";
import { X, History } from "lucide-react";
import StatusPill from "@/components/shared/StatusPill";
import ItemIcon from "@/components/icons/items/ItemIcon";
import { MockRequisition } from "@/lib/data/mock-data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusVariant } from "@/types";

const statusToVariant: Record<string, StatusVariant> = {
  DRAFT: "draft", PENDING: "pending", APPROVED: "approved",
  REJECTED: "rejected", ISSUED: "issued", PARTIAL: "partial",
};

interface RequisitionDetailModalProps {
  requisition: MockRequisition | null;
  onClose: () => void;
}

export default function RequisitionDetailModal({ requisition, onClose }: RequisitionDetailModalProps) {
  const [viewMode, setViewMode] = useState<"issued" | "original">("issued");

  if (!requisition) return null;
  const req = requisition;

  // Whether this req has been through approval+issue and may differ from original
  const hasBeenIssued = req.status === "ISSUED" || req.status === "PARTIAL";
  const isPartial = req.status === "PARTIAL" ||
    req.items.some((i) => i.issuedQty > 0 && i.issuedQty < i.requestedQty);

  // Compute original total from requestedQty (always preserved regardless of approval changes)
  const originalTotal  = req.items.reduce((s, i) => s + i.requestedQty * i.unitPrice, 0);
  // Approved/issued total is whatever was actually issued
  const issuedTotal    = req.items.reduce((s, i) => s + i.issuedQty * i.unitPrice, 0);

  // Which qty + amount to show in the items table depends on the view mode
  const showingOriginal = viewMode === "original";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card bg-surface-card shadow-lg">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-[18px] font-bold text-text-primary">{req.id}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusPill variant={statusToVariant[req.status] || "draft"} />
              {isPartial && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Partial Issue
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          {/* ─── Meta grid ─── */}
          <div className="mb-5 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
            {[
              ["Requested By",  req.userName],
              ["Department",    req.departmentName],
              ["Created On",    formatDateTime(req.createdAt)],
              ["Required Date", req.requiredDate ? formatDate(req.requiredDate) : "—"],
              ["Purpose",       req.purpose || "—"],
              ["Priority",      req.priority.charAt(0) + req.priority.slice(1).toLowerCase()],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-[11px] uppercase text-text-muted">{label}</span>
                <p className="text-[13px] font-medium text-text-primary">{value}</p>
              </div>
            ))}
            {req.remarks && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[11px] uppercase text-text-muted">Remarks</span>
                <p className="text-[13px] text-text-primary">{req.remarks}</p>
              </div>
            )}
          </div>

          {/* ─── Approval / rejection banner ─── */}
          {(req.approvedByName || req.rejectedReason) && (
            <div className={`mb-5 rounded-lg p-3 text-[13px] ${
              req.status === "REJECTED" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
            }`}>
              {req.status === "REJECTED" ? (
                <>
                  <span className="font-semibold">Rejected by {req.approvedByName}: </span>
                  {req.rejectedReason}
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {isPartial ? "Partially approved" : "Approved"} by {req.approvedByName}
                  </span>
                  {req.approvedAt && <> on {formatDateTime(req.approvedAt)}</>}
                  {isPartial && (
                    <span className="ml-1 text-[12px] opacity-80">
                      — some items issued at reduced quantity
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── OG vs Approved toggle — only shown when req has been through issue ─── */}
          {hasBeenIssued && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex rounded-lg border border-border bg-gray-50 p-0.5">
                <button
                  onClick={() => setViewMode("issued")}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    viewMode === "issued"
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Approved / Issued
                </button>
                <button
                  onClick={() => setViewMode("original")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    viewMode === "original"
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <History size={12} />
                  Original Request
                </button>
              </div>
              {isPartial && viewMode === "issued" && (
                <span className="text-[11px] text-amber-600">
                  ↑ Issued amount differs from original
                </span>
              )}
            </div>
          )}

          {/* ─── Items table ─── */}
          <h4 className="mb-2 text-[13px] font-semibold text-text-primary">
            Items ({req.items.length})
            {hasBeenIssued && showingOriginal && (
              <span className="ml-2 text-[11px] font-normal text-text-muted">
                (as originally submitted — before approval)
              </span>
            )}
          </h4>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-border ${showingOriginal ? "bg-amber-50" : "bg-gray-50"}`}>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Item</th>
                  {hasBeenIssued ? (
                    <>
                      {showingOriginal ? (
                        <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          Requested Qty
                        </th>
                      ) : (
                        <>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                            Requested
                          </th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-green-700">
                            Issued
                          </th>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Req.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Appr.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Issued</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Amount</th>
                </tr>
              </thead>
              <tbody>
                {req.items.map((item) => {
                  const isReduced = item.issuedQty > 0 && item.issuedQty < item.requestedQty;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ItemIcon itemId={item.itemId} size={22} />
                          <span className="text-[12px] text-text-primary">{item.itemName}</span>
                        </div>
                      </td>

                      {hasBeenIssued ? (
                        showingOriginal ? (
                          // Original view: show only requestedQty
                          <>
                            <td className="px-3 py-2 text-right text-[12px] font-medium text-amber-700">
                              {item.requestedQty}
                            </td>
                          </>
                        ) : (
                          // Issued view: show requestedQty and issuedQty side by side
                          <>
                            <td className="px-3 py-2 text-right text-[12px] text-text-muted">
                              {item.requestedQty}
                            </td>
                            <td className={`px-3 py-2 text-right text-[12px] font-semibold ${
                              isReduced ? "text-amber-600" : "text-green-600"
                            }`}>
                              {item.issuedQty}
                              {isReduced && (
                                <span className="ml-1 text-[9px] font-normal text-amber-500">
                                  (-{item.requestedQty - item.issuedQty})
                                </span>
                              )}
                            </td>
                          </>
                        )
                      ) : (
                        // Pre-issue: show all three columns
                        <>
                          <td className="px-3 py-2 text-right text-[12px] text-text-primary">{item.requestedQty}</td>
                          <td className="px-3 py-2 text-right text-[12px] text-text-secondary">{item.approvedQty || "—"}</td>
                          <td className="px-3 py-2 text-right text-[12px] text-text-secondary">{item.issuedQty || "—"}</td>
                        </>
                      )}

                      <td className="px-3 py-2 text-right text-[12px] font-medium text-text-primary">
                        {showingOriginal
                          ? formatCurrency(item.requestedQty * item.unitPrice)
                          : formatCurrency((hasBeenIssued ? item.issuedQty : item.requestedQty) * item.unitPrice)
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={showingOriginal ? "bg-amber-50" : "bg-gray-50"}>
                  <td colSpan={hasBeenIssued ? (showingOriginal ? 2 : 3) : 4}
                    className="px-3 py-2 text-right text-[12px] font-semibold text-text-primary">
                    {showingOriginal ? "Original Total" : "Issued Total"}
                  </td>
                  <td className={`px-3 py-2 text-right text-[13px] font-bold ${
                    showingOriginal ? "text-amber-700" : "text-brand-primary"
                  }`}>
                    {showingOriginal
                      ? formatCurrency(originalTotal)
                      : formatCurrency(hasBeenIssued ? issuedTotal : req.totalAmount)
                    }
                  </td>
                </tr>
                {/* Summary row: show both totals when issued and partial */}
                {hasBeenIssued && isPartial && !showingOriginal && (
                  <tr className="bg-gray-50 border-t border-dashed border-border">
                    <td colSpan={3} className="px-3 py-1.5 text-right text-[11px] text-text-muted">
                      Original requested total
                    </td>
                    <td className="px-3 py-1.5 text-right text-[11px] text-text-muted line-through">
                      {formatCurrency(originalTotal)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
