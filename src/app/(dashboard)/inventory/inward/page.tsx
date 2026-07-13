"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import WizardStepper from "@/components/shared/WizardStepper";
import ItemIcon from "@/components/icons/items/ItemIcon";
import { useAppStore } from "@/stores/app-store";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Upload,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Paperclip,
  X,
} from "lucide-react";

const wizardSteps = [
  { number: 1, label: "Stock Entry" },
  { number: 2, label: "Item Details" },
  { number: 3, label: "Review & Submit" },
];

interface GrnLine {
  id: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  unit: string;
  receivedQty: number;
  unitPrice: number;
  iconKey?: string;
}

export default function StockInwardPage() {
  const router = useRouter();
  const { submitGRN, suppliers, stockItems: catalogItems, draftGRNs, saveGRNDraft, deleteGRNDraft } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Inward Details
  const [documentType, setDocumentType] = useState("GRN (Goods Receipt Note)");
  const [grnNo] = useState(() => `GRN-2025-${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`);
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierId, setSupplierId] = useState(suppliers[0].id);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [deliveryChallan, setDeliveryChallan] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [grnRemarks, setGrnRemarks] = useState("");

  // Step 1 / 2: Item lines
  const [lines, setLines] = useState<GrnLine[]>([
    { id: "line-1", itemId: "", itemName: "", categoryName: "", unit: "", receivedQty: 0, unitPrice: 0 },
  ]);
  const [completedGrnId, setCompletedGrnId] = useState("");

  // File attachments (in-memory only — no backend storage in this build)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFileError("");
    const validFiles: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name}: exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const supplier = suppliers.find((s) => s.id === supplierId);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: `line-${prev.length + 1}-${Date.now()}`, itemId: "", itemName: "", categoryName: "", unit: "", receivedQty: 0, unitPrice: 0 },
    ]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof GrnLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "itemId") {
          const catalogItem = catalogItems.find((ci) => ci.id === value);
          return {
            ...l,
            itemId: value as string,
            itemName: catalogItem?.name || "",
            categoryName: catalogItem?.categoryName || "",
            unit: catalogItem?.unit || "",
            unitPrice: catalogItem?.unitPrice || 0,
            iconKey: catalogItem?.iconKey,
          };
        }
        return { ...l, [field]: value };
      })
    );
  };

  const validLines = lines.filter((l) => l.itemId && l.receivedQty > 0);
  const totalItems = validLines.length;
  const totalQuantity = validLines.reduce((s, l) => s + l.receivedQty, 0);
  const grandTotal = validLines.reduce((s, l) => s + l.receivedQty * l.unitPrice, 0);

  const handleSubmit = () => {
    const grnId = submitGRN({
      supplierId,
      supplierName: supplier?.name || "",
      grnDate,
      invoiceNo,
      invoiceDate,
      deliveryChallan,
      deliveryDate,
      remarks: grnRemarks,
      lines: validLines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        receivedQty: l.receivedQty,
        unitPrice: l.unitPrice,
      })),
    });
    setCompletedGrnId(grnId);
    setCurrentStep(3);
  };

  const [draftSavedMessage, setDraftSavedMessage] = useState("");

  const handleSaveDraft = () => {
    saveGRNDraft({
      supplierId,
      grnDate,
      invoiceNo,
      invoiceDate,
      deliveryChallan,
      deliveryDate,
      remarks: grnRemarks,
      lines,
    });
    setDraftSavedMessage("Draft saved. You can resume it from the banner above, or come back to this page later.");
    setTimeout(() => setDraftSavedMessage(""), 4000);
  };

  const loadDraft = (draftId: string) => {
    const draft = draftGRNs.find((d) => d.id === draftId);
    if (!draft) return;
    setSupplierId(draft.supplierId);
    setGrnDate(draft.grnDate);
    setInvoiceNo(draft.invoiceNo);
    setInvoiceDate(draft.invoiceDate);
    setDeliveryChallan(draft.deliveryChallan);
    setDeliveryDate(draft.deliveryDate);
    setGrnRemarks(draft.remarks);
    setLines(draft.lines);
    deleteGRNDraft(draftId);
  };

  const handleDone = () => {
    router.push("/inventory/overview");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Stock Inward" subtitle="Record incoming stock via GRN entry" />
        {currentStep < 3 && <WizardStepper steps={wizardSteps} currentStep={currentStep} />}
      </div>

      {/* Resume saved drafts */}
      {currentStep === 1 && draftGRNs.length > 0 && (
        <div className="mb-6 rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-[13px] font-semibold text-amber-800">
            You have {draftGRNs.length} saved draft{draftGRNs.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {draftGRNs.map((d) => {
              const sup = suppliers.find((s) => s.id === d.supplierId);
              return (
                <div key={d.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                  <span className="text-[12px] text-amber-900">
                    {sup?.name || "Unknown supplier"} — {d.lines.filter((l) => l.itemId).length} item(s) — saved {new Date(d.savedAt).toLocaleString("en-IN")}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => loadDraft(d.id)} className="text-[12px] font-medium text-brand-primary hover:underline">
                      Resume
                    </button>
                    <button onClick={() => deleteGRNDraft(d.id)} className="text-[12px] font-medium text-red-600 hover:underline">
                      Discard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {draftSavedMessage && (
        <div className="mb-6 rounded-md bg-green-50 px-4 py-2.5 text-[13px] text-green-700">
          ✓ {draftSavedMessage}
        </div>
      )}

      {/* ─── STEP 1 & 2 combined: Stock Entry + Item Details ─── */}
      {(currentStep === 1 || currentStep === 2) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: Forms */}
          <div className="lg:col-span-3 space-y-4">
            {/* Inward Details */}
            <div className="rounded-card border border-border bg-surface-card p-card-padding">
              <h3 className="mb-4 text-[15px] font-semibold text-text-primary">1. Inward Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Document Type *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  >
                    <option>GRN (Goods Receipt Note)</option>
                    <option>Purchase Order</option>
                    <option>Direct Inward</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">GRN No. *</label>
                  <input
                    type="text"
                    value={grnNo}
                    readOnly
                    className="w-full rounded-button border border-border bg-gray-50 px-3 py-2 text-[13px] text-text-secondary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">GRN Date *</label>
                  <input
                    type="date"
                    value={grnDate}
                    onChange={(e) => setGrnDate(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Invoice No.</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="INV-XXXX"
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Delivery Challan No.</label>
                  <input
                    type="text"
                    value={deliveryChallan}
                    onChange={(e) => setDeliveryChallan(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-text-primary">Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 flex justify-between text-[12px] font-medium text-text-primary">
                    <span>Remarks</span>
                    <span className="text-text-muted">{grnRemarks.length}/250</span>
                  </label>
                  <textarea
                    value={grnRemarks}
                    onChange={(e) => setGrnRemarks(e.target.value.slice(0, 250))}
                    rows={2}
                    className="w-full rounded-button border border-border px-3 py-2 text-[13px] focus:border-brand-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="rounded-card border border-border bg-surface-card p-card-padding">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-text-primary">2. Item Details</h3>
                <button
                  onClick={() => {
                    const csvText = prompt(
                      "Paste items as CSV (one row per item):\nFormat: Item Name, Quantity, Unit Price\n\nExample:\nA4 Copier Paper, 10, 210\nBall Pen (Blue), 50, 5"
                    );
                    if (!csvText) return;
                    const newLines = csvText
                      .split("\n")
                      .map((row) => row.trim())
                      .filter(Boolean)
                      .map((row, i) => {
                        const parts = row.split(",").map((p) => p.trim());
                        const nameOrId = parts[0] || "";
                        const qty = parseFloat(parts[1]) || 1;
                        const price = parseFloat(parts[2]) || 0;
                        // Try to match by name in the catalog
                        const catalogItem = catalogItems.find(
                          (c) => c.name.toLowerCase() === nameOrId.toLowerCase() || c.id === nameOrId
                        );
                        return {
                          id: `line-bulk-${Date.now()}-${i}`,
                          itemId: catalogItem?.id || "",
                          itemName: catalogItem?.name || nameOrId,
                          categoryName: catalogItem?.categoryName || "",
                          unit: catalogItem?.unit || "",
                          receivedQty: qty,
                          unitPrice: price || catalogItem?.unitPrice || 0,
                          iconKey: catalogItem?.iconKey,
                        };
                      });
                    setLines((prev) => [...prev.filter((l) => l.itemId || l.itemName), ...newLines]);
                  }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-brand-primary hover:underline"
                  title="Paste multiple items at once from clipboard (CSV format)"
                >
                  <Plus size={12} />
                  Bulk Add (paste CSV)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-[11px] uppercase tracking-wide text-text-secondary font-semibold w-8">#</th>
                      <th className="pb-2 text-left text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Item *</th>
                      <th className="pb-2 text-left text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Unit</th>
                      <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Qty *</th>
                      <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Price (₹) *</th>
                      <th className="pb-2 text-right text-[11px] uppercase tracking-wide text-text-secondary font-semibold">Total (₹)</th>
                      <th className="pb-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={line.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-[12px] text-text-secondary">{idx + 1}</td>
                        <td className="py-2">
                          <select
                            value={line.itemId}
                            onChange={(e) => updateLine(line.id, "itemId", e.target.value)}
                            className="w-full rounded border border-border px-2 py-1.5 text-[12px] focus:border-brand-primary focus:outline-none"
                          >
                            <option value="">Select item...</option>
                            {catalogItems.map((ci) => (
                              <option key={ci.id} value={ci.id}>{ci.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 text-[12px] text-text-secondary">{line.unit || "—"}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={line.receivedQty || ""}
                            onChange={(e) => updateLine(line.id, "receivedQty", parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-20 rounded border border-border px-2 py-1.5 text-right text-[12px] focus:border-brand-primary focus:outline-none"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={line.unitPrice || ""}
                            onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            min={0}
                            step="0.01"
                            className="w-24 rounded border border-border px-2 py-1.5 text-right text-[12px] focus:border-brand-primary focus:outline-none"
                          />
                        </td>
                        <td className="py-2 text-right text-[12px] font-medium text-text-primary">
                          {formatCurrency(line.receivedQty * line.unitPrice)}
                        </td>
                        <td className="py-2 text-center">
                          <button onClick={() => removeLine(line.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addLine}
                className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-brand-primary hover:underline"
              >
                <Plus size={14} />
                Add Item
              </button>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[13px] text-text-secondary">Total Items: {totalItems}</span>
                <span className="text-[14px] font-bold text-green-600">Grand Total: {formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Right: Stock Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-[88px] rounded-card border border-border bg-surface-card p-card-padding">
              <h3 className="mb-4 text-[15px] font-semibold text-text-primary">Stock Summary</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Total Items</span>
                  <span className="font-medium text-text-primary">{totalItems}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Total Quantity</span>
                  <span className="font-medium text-text-primary">{totalQuantity}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-[14px]">
                  <span className="font-semibold text-text-primary">Grand Total (₹)</span>
                  <span className="font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Attachment Zone */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-2 cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                  isDragging ? "border-brand-primary bg-tint-blue-bg" : "border-border hover:bg-gray-50"
                }`}
              >
                <Upload size={24} className="mx-auto mb-2 text-text-muted" />
                <p className="text-[12px] font-medium text-text-primary">Drag & drop files here</p>
                <span className="mt-1 text-[12px] text-brand-primary hover:underline">or Browse Files</span>
                <p className="mt-1 text-[10px] text-text-muted">Supports: PDF, JPG, PNG (Max 5MB each)</p>
              </div>

              {fileError && (
                <p className="mb-2 text-[11px] text-red-600">{fileError}</p>
              )}

              {attachments.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5">
                      <Paperclip size={12} className="flex-shrink-0 text-text-muted" />
                      <span className="flex-1 truncate text-[12px] text-text-primary">{file.name}</span>
                      <span className="flex-shrink-0 text-[11px] text-text-muted">{formatFileSize(file.size)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }} className="flex-shrink-0 text-text-muted hover:text-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {attachments.length === 0 && <div className="mb-4" />}

              {/* Notes */}
              <div className="flex items-start gap-2 rounded-md bg-tint-blue-bg p-2.5">
                <Info size={14} className="mt-0.5 flex-shrink-0 text-tint-blue-icon" />
                <span className="text-[11px] text-tint-blue-icon">
                  After submission, stock quantity will be updated and available for issuance.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action row for Step 1 */}
      {currentStep === 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/inventory/overview")}
            className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={validLines.length === 0}
              className="flex items-center gap-1.5 rounded-button bg-brand-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40"
            >
              Next: Review & Submit
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Review & Submit ─── */}
      {currentStep === 3 && !completedGrnId && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-card border border-border bg-surface-card p-card-padding">
            <h3 className="mb-6 text-[15px] font-semibold text-text-primary">3. Review & Submit</h3>

            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div><span className="text-[12px] text-text-muted">GRN No.</span><p className="text-[14px] font-medium text-text-primary">{grnNo}</p></div>
              <div><span className="text-[12px] text-text-muted">GRN Date</span><p className="text-[14px] font-medium text-text-primary">{grnDate}</p></div>
              <div><span className="text-[12px] text-text-muted">Supplier</span><p className="text-[14px] font-medium text-text-primary">{supplier?.name}</p></div>
              <div><span className="text-[12px] text-text-muted">Invoice No.</span><p className="text-[14px] font-medium text-text-primary">{invoiceNo || "—"}</p></div>
            </div>

            <h4 className="mb-3 text-[14px] font-semibold text-text-primary">Items ({validLines.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">Item</th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">Qty</th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">Price</th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {validLines.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-3"><div className="flex items-center gap-2"><ItemIcon iconKey={l.iconKey} itemId={l.itemId} size={24} /><span className="text-[13px] text-text-primary">{l.itemName}</span></div></td>
                      <td className="py-3 text-right text-[13px] text-text-primary">{l.receivedQty}</td>
                      <td className="py-3 text-right text-[13px] text-text-primary">{formatCurrency(l.unitPrice)}</td>
                      <td className="py-3 text-right text-[13px] font-medium text-text-primary">{formatCurrency(l.receivedQty * l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={3} className="py-3 text-right text-[14px] font-semibold text-text-primary">Grand Total</td>
                    <td className="py-3 text-right text-[16px] font-bold text-green-600">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-button bg-brand-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover"
              >
                Submit & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {currentStep === 3 && completedGrnId && (
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-card border border-border bg-surface-card p-10">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
            </div>
            <h2 className="mb-2 text-[20px] font-bold text-text-primary">Stock Updated!</h2>
            <p className="mb-6 text-[14px] text-text-secondary">
              {completedGrnId} has been recorded and stock levels updated.
            </p>
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-text-secondary">Items Received</span>
                <span className="font-semibold text-text-primary">{totalItems}</span>
              </div>
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-text-secondary">Total Value</span>
                <span className="font-semibold text-text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              {attachments.length > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Attachments</span>
                  <span className="font-semibold text-text-primary">{attachments.length} file{attachments.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleDone}
              className="w-full rounded-button bg-brand-primary py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover"
            >
              View Stock Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
