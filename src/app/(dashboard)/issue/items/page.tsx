"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import WizardStepper from "@/components/shared/WizardStepper";
import StatusPill from "@/components/shared/StatusPill";
import ItemIcon from "@/components/icons/items/ItemIcon";
import { useAppStore } from "@/stores/app-store";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { MockRequisition } from "@/lib/data/mock-data";
import {
  CheckCircle2,
  ArrowLeft,
  Save,
  Search,
} from "lucide-react";

const wizardSteps = [
  { number: 1, label: "Select Requisition" },
  { number: 2, label: "Issue Items" },
  { number: 3, label: "Confirm & Complete" },
];

interface IssueLine {
  itemId: string;
  itemName: string;
  unit: string;
  requestedQty: number;
  approvedQty: number;
  availableStock: number;
  issueQty: number;
  unitPrice: number;
  iconKey?: string;
}

export default function IssueItemsPage() {
  const router = useRouter();
  const { requisitions, stockItems, confirmIssuance, currentUser, allUsers, issueDrafts, saveIssueDraft, clearIssueDraft } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReq, setSelectedReq] = useState<MockRequisition | null>(null);
  const [issueLines, setIssueLines] = useState<IssueLine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Issuing details (Step 2 right panel)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [issuedToId, setIssuedToId] = useState("");
  const [handedOverById, setHandedOverById] = useState(currentUser.id);
  const [receivedBy, setReceivedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [referenceNo] = useState(() => `ISS-2025-${String(Math.floor(Math.random() * 900) + 100).padStart(5, "0")}`);
  const [completedRef, setCompletedRef] = useState("");

  const approvedReqs = requisitions
    .filter((r) => r.status === "APPROVED")
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.id.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q);
    });

  const selectRequisition = (req: MockRequisition) => {
    setSelectedReq(req);
    setIssuedToId(req.userId);
    setReceivedBy(req.userName);

    const existingDraft = issueDrafts[req.id];
    if (existingDraft && existingDraft.length > 0) {
      setIssueLines(existingDraft);
      setCurrentStep(2);
      return;
    }

    const lines: IssueLine[] = req.items.map((item) => {
      const stockItem = stockItems.find((s) => s.id === item.itemId);
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        requestedQty: item.requestedQty,
        approvedQty: item.approvedQty,
        availableStock: stockItem?.currentStock ?? 0,
        issueQty: Math.min(item.approvedQty, stockItem?.currentStock ?? 0),
        unitPrice: item.unitPrice,
        iconKey: stockItem?.iconKey,
      };
    });
    setIssueLines(lines);
    setCurrentStep(2);
  };

  const updateIssueQty = (itemId: string, qty: number) => {
    setIssueLines((lines) =>
      lines.map((l) =>
        l.itemId === itemId
          ? { ...l, issueQty: Math.max(0, Math.min(qty, Math.min(l.approvedQty, l.availableStock))) }
          : l
      )
    );
  };

  const totalItems = issueLines.length;
  const fullIssueCount = issueLines.filter((l) => l.issueQty === l.approvedQty).length;
  const partialIssueCount = issueLines.filter((l) => l.issueQty > 0 && l.issueQty < l.approvedQty).length;
  const totalAmount = issueLines.reduce((s, l) => s + l.issueQty * l.unitPrice, 0);

  const handleConfirm = () => {
    if (!selectedReq) return;
    const issuedToUser = allUsers.find((u) => u.id === issuedToId);
    const ref = confirmIssuance({
      requisitionId: selectedReq.id,
      issuedToId,
      issuedToName: issuedToUser?.name || receivedBy,
      receivedBy,
      remarks,
      lines: issueLines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        issuedQty: l.issueQty,
        approvedQty: l.approvedQty,
        unitPrice: l.unitPrice,
      })),
    });
    setCompletedRef(ref);
    clearIssueDraft(selectedReq.id);
    setCurrentStep(3);
  };

  const handleDone = () => {
    setSelectedReq(null);
    setIssueLines([]);
    setCurrentStep(1);
    router.push("/issue/history");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Issue Items" subtitle="Process approved requisitions and issue stock" />
        <WizardStepper steps={wizardSteps} currentStep={currentStep} />
      </div>

      {/* ─── STEP 1: Select Requisition ─── */}
      {currentStep === 1 && (
        <div className="rounded-card border border-border bg-surface-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search approved requisitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-button border border-border py-2 pl-9 pr-3 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">REQ No.</th>
                  <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Requested By</th>
                  <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Department</th>
                  <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Approved On</th>
                  <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Items</th>
                  <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Amount</th>
                  <th className="px-4 py-3 text-center text-table-header uppercase tracking-table-header text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedReqs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[14px] text-text-muted">
                      No approved requisitions awaiting issuance
                    </td>
                  </tr>
                ) : (
                  approvedReqs.map((req) => (
                    <tr key={req.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-[13px] font-medium text-brand-primary">
                        {req.id}
                        {issueDrafts[req.id] && (
                          <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Draft saved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-primary">{req.userName}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{req.departmentName}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{req.approvedAt ? formatDate(req.approvedAt) : "—"}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-text-primary">{req.items.length}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-text-primary">{formatCurrency(req.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => selectRequisition(req)}
                          className="rounded-button bg-brand-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-primary-hover"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Issue Items ─── */}
      {currentStep === 2 && selectedReq && (
        <div>
          {/* Info Banner */}
          <div className="mb-6 rounded-card border border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-green-700">
              <CheckCircle2 size={16} />
              APPROVED — {selectedReq.id}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px] text-green-800 sm:grid-cols-4">
              <div>
                <span className="text-green-600">Requested By:</span> {selectedReq.userName} ({selectedReq.departmentName})
              </div>
              <div>
                <span className="text-green-600">Requested On:</span> {formatDateTime(selectedReq.createdAt)}
              </div>
              <div>
                <span className="text-green-600">Approved On:</span> {selectedReq.approvedAt ? formatDateTime(selectedReq.approvedAt) : "—"}
              </div>
              <div>
                <span className="text-green-600">Purpose:</span> {selectedReq.purpose}
              </div>
              <div className="col-span-2 sm:col-span-2">
                <span className="text-green-600">Total Items:</span> {issueLines.length} &nbsp;&nbsp;
                <span className="text-green-600">Total Amount:</span> {formatCurrency(selectedReq.totalAmount)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: Items to be Issued */}
            <div className="lg:col-span-3">
              <div className="rounded-card border border-border bg-surface-card p-card-padding">
                <h3 className="mb-4 text-[15px] font-semibold text-text-primary">Items to be Issued</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Item</th>
                        <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Req.</th>
                        <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Appr.</th>
                        <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Stock</th>
                        <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Issue Qty</th>
                        <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Short</th>
                        <th className="pb-2 text-center text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issueLines.map((line) => {
                        const short = line.approvedQty - line.issueQty;
                        const isFull = short === 0;
                        return (
                          <tr key={line.itemId} className="border-b border-border last:border-0">
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <ItemIcon iconKey={line.iconKey} itemId={line.itemId} size={22} />
                                <span className="text-[12px] font-medium text-text-primary">{line.itemName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-[12px] text-text-secondary">{line.requestedQty}</td>
                            <td className="py-2.5 text-right text-[12px] text-text-primary">{line.approvedQty}</td>
                            <td className="py-2.5 text-right text-[12px] text-text-secondary">{line.availableStock}</td>
                            <td className="py-2.5 text-right">
                              <input
                                type="number"
                                value={line.issueQty}
                                onChange={(e) => updateIssueQty(line.itemId, parseInt(e.target.value) || 0)}
                                min={0}
                                max={Math.min(line.approvedQty, line.availableStock)}
                                className="w-16 rounded border border-border px-2 py-1 text-right text-[12px] focus:border-brand-primary focus:outline-none"
                              />
                            </td>
                            <td className={`py-2.5 text-right text-[12px] font-semibold ${short > 0 ? "text-red-600" : "text-text-muted"}`}>
                              {short > 0 ? short : "—"}
                            </td>
                            <td className="py-2.5 text-center">
                              <StatusPill
                                variant={isFull ? "approved" : "partial"}
                                label={isFull ? "Full Issue" : "Partial Issue"}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-text-secondary">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" /> Full Issue: All approved quantity issued
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Partial Issue: Issued less than approved quantity
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stock Summary + Issuing Details */}
            <div className="lg:col-span-2">
              <div className="rounded-card border border-border bg-surface-card p-card-padding">
                {/* Summary Pills */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-gray-50 p-2 text-center">
                    <div className="text-[16px] font-bold text-text-primary">{totalItems}</div>
                    <div className="text-[10px] text-text-muted">Total Items</div>
                  </div>
                  <div className="rounded-md bg-green-50 p-2 text-center">
                    <div className="text-[16px] font-bold text-green-600">{fullIssueCount}</div>
                    <div className="text-[10px] text-text-muted">Full Issue</div>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2 text-center">
                    <div className="text-[16px] font-bold text-amber-600">{partialIssueCount}</div>
                    <div className="text-[10px] text-text-muted">Partial Issue</div>
                  </div>
                </div>

                <h4 className="mb-3 text-[14px] font-semibold text-text-primary">Issuing Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-primary">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-primary">Reference No.</label>
                    <input
                      type="text"
                      value={referenceNo}
                      readOnly
                      className="w-full rounded-button border border-border bg-gray-50 px-3 py-2 text-[13px] text-text-secondary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-primary">Issued To *</label>
                    <select
                      value={issuedToId}
                      onChange={(e) => setIssuedToId(e.target.value)}
                      className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-primary">Handed Over By *</label>
                    <select
                      value={handedOverById}
                      onChange={(e) => setHandedOverById(e.target.value)}
                      className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                    >
                      {allUsers.filter((u) => u.role === "INVENTORY_MGR" || u.role === "ADMIN").map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-text-primary">Received By *</label>
                    <input
                      type="text"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex justify-between text-[12px] font-medium text-text-primary">
                      <span>Remarks</span>
                      <span className="text-text-muted">{remarks.length}/500</span>
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
                      rows={3}
                      className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={handleConfirm}
                    className="flex items-center justify-center gap-2 rounded-button bg-brand-primary py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover"
                  >
                    <CheckCircle2 size={16} />
                    Confirm & Complete
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 rounded-button border border-border py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
                    >
                      <ArrowLeft size={14} className="mr-1 inline" />
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedReq) return;
                        saveIssueDraft(selectedReq.id, issueLines);
                        setCurrentStep(1);
                      }}
                      className="flex-1 rounded-button border border-border py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
                    >
                      <Save size={14} className="mr-1 inline" />
                      Save Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Confirm & Complete ─── */}
      {currentStep === 3 && (
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-card border border-border bg-surface-card p-10">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
            </div>
            <h2 className="mb-2 text-[20px] font-bold text-text-primary">Issuance Complete!</h2>
            <p className="mb-6 text-[14px] text-text-secondary">
              {selectedReq?.id} has been processed and stock has been updated.
            </p>
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-text-secondary">Reference No.</span>
                <span className="font-semibold text-text-primary">{completedRef}</span>
              </div>
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-text-secondary">Items Issued</span>
                <span className="font-semibold text-text-primary">{issueLines.filter(l => l.issueQty > 0).length}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Total Value</span>
                <span className="font-semibold text-text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            <button
              onClick={handleDone}
              className="w-full rounded-button bg-brand-primary py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover"
            >
              View Issued History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
