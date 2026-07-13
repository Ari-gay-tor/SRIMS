"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import WizardStepper from "@/components/shared/WizardStepper";
import CategoryTile from "@/components/shared/CategoryTile";
import QuantityStepper from "@/components/shared/QuantityStepper";

import ItemIcon from "@/components/icons/items/ItemIcon";
import { useAppStore } from "@/stores/app-store";
import { generateRequisitionId } from "@/lib/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  Info,
  ArrowRight,
  ArrowLeft,
  Save,

  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const wizardSteps = [
  { number: 1, label: "Add Items" },
  { number: 2, label: "Requisition Details" },
  { number: 3, label: "Review & Submit" },
];

const purposeOptions = [
  "Marketing Campaign",
  "Office Use",
  "Event Preparation",
  "Training Session",
  "Workshop",
  "Recruitment Drive",
  "Quarterly Audit",
  "IT Supplies",
  "Year End",
  "Other",
];

export default function NewRequisitionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const {
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal,
    currentUser, addRequisition, stockItems: items, categories,
    requisitions, updateRequisitionFull, loadRequisitionToCart,
  } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemPage, setItemPage] = useState(1);
  const itemsPerPage = 5;

  // Step 2 form fields
  const todayStr = new Date().toISOString().slice(0, 10);

  // Default required date = today + 7 days, skipping to Monday if it lands on a weekend
  const defaultRequiredDate = (() => {
    const d = new Date(Date.now() + 7 * 86400000);
    const day = d.getDay();
    if (day === 0) d.setDate(d.getDate() + 1);      // Sunday → Monday
    if (day === 6) d.setDate(d.getDate() + 2);      // Saturday → Monday
    return d.toISOString().slice(0, 10);
  })();

  const [department, setDepartment] = useState(currentUser.departmentName);
  const [requiredDate, setRequiredDate] = useState(defaultRequiredDate);
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "URGENT">("NORMAL");

  // ─── Edit mode: pre-fill cart + form fields from the draft being edited.
  // Fresh (non-edit) loads clear any leftover cart from a prior unfinished session. ───
  useEffect(() => {
    if (editId) {
      const draft = requisitions.find((r) => r.id === editId);
      if (!draft) return;
      loadRequisitionToCart(editId);
      setDepartment(draft.departmentName);
      setRequiredDate(draft.requiredDate || "");
      setPurpose(draft.purpose || "");
      setRemarks(draft.remarks || "");
      setPriority(draft.priority);
    } else {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items.filter((i) => i.isActive);
    if (selectedCategory) {
      result = result.filter((i) => i.categoryId === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, searchQuery, selectedCategory]);

  const totalFilteredPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (itemPage - 1) * itemsPerPage,
    itemPage * itemsPerPage
  );

  const isInCart = (itemId: string) => cart.some((c) => c.itemId === itemId);
  const total = cartTotal();

  const handleSubmit = (asDraft: boolean) => {
    const itemsPayload = cart.map((c, idx) => ({
      id: `ri-${editId || "new"}-${idx}`,
      requisitionId: editId || "",
      itemId: c.itemId,
      itemName: c.itemName,
      categoryName: c.categoryName,
      unit: c.unit,
      requestedQty: c.quantity,
      approvedQty: 0,
      issuedQty: 0,
      unitPrice: c.unitPrice,
    }));

    if (editId) {
      // Editing an existing draft — update it in place, keep its original ID
      updateRequisitionFull(editId, {
        departmentName: department,
        status: asDraft ? "DRAFT" : "PENDING",
        purpose,
        remarks,
        requiredDate,
        priority,
        totalAmount: total,
        items: itemsPayload,
      });
      clearCart();
      router.push(asDraft ? "/requisitions/drafts" : "/requisitions/my");
      return;
    }

    const newReq = {
      id: generateRequisitionId(),
      userId: currentUser.id,
      userName: currentUser.name,
      departmentId: currentUser.departmentId,
      departmentName: department,
      status: (asDraft ? "DRAFT" : "PENDING") as "DRAFT" | "PENDING",
      purpose,
      remarks,
      requiredDate,
      priority,
      totalAmount: total,
      createdAt: new Date().toISOString(),
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      rejectedReason: null,
      items: itemsPayload,
    };
    addRequisition(newReq);
    clearCart();
    router.push("/requisitions/my");
  };

  return (
    <div>
      {/* Header + Stepper */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={editId ? `Edit Draft — ${editId}` : "New Requisition"}
          subtitle={editId ? "Update items and details for this draft" : "Create a new stationery requisition request"}
        />
        <WizardStepper steps={wizardSteps} currentStep={currentStep} />
      </div>

      {/* ─── STEP 1: Add Items ─── */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left: Item Selection */}
          <div className="lg:col-span-3">
            <div className="rounded-card border border-border bg-surface-card p-card-padding">
              <h3 className="mb-4 text-[15px] font-semibold text-text-primary">
                1. Select Items
              </h3>

              {/* Search bar */}
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search items by name or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setItemPage(1);
                    }}
                    className="w-full rounded-button border border-border py-2 pl-9 pr-3 text-[13px] placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Category Tiles */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setItemPage(1);
                  }}
                  className={`flex-shrink-0 rounded-lg border-2 px-4 py-2 text-[12px] font-medium transition-all ${
                    !selectedCategory
                      ? "border-brand-primary bg-tint-blue-bg text-brand-primary"
                      : "border-transparent bg-gray-50 text-text-secondary hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <CategoryTile
                    key={cat.id}
                    icon={cat.icon}
                    color={cat.color}
                    bgColor={cat.bgColor}
                    label={cat.name}
                    active={selectedCategory === cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
                      setItemPage(1);
                    }}
                  />
                ))}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">
                        Item
                      </th>
                      <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">
                        Category
                      </th>
                      <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">
                        Unit
                      </th>
                      <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <ItemIcon iconKey={item.iconKey} itemId={item.id} size={28} />
                            <div>
                              <div className="text-[13px] font-medium text-text-primary">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-text-muted">
                                {item.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-[13px] text-text-secondary">
                          {item.categoryName}
                        </td>
                        <td className="py-3 text-[13px] text-text-secondary">
                          {item.unit}
                        </td>
                        <td className="py-3 text-right">
                          {isInCart(item.id) ? (
                            <span className="text-[12px] font-medium text-green-600">
                              ✓ Added
                            </span>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="inline-flex items-center gap-1 rounded-button border border-brand-primary px-3 py-1.5 text-[12px] font-medium text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">
                  Showing {(itemPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(itemPage * itemsPerPage, filteredItems.length)} of{" "}
                  {filteredItems.length} items
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                    disabled={itemPage === 1}
                    className="rounded p-1 text-text-secondary hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalFilteredPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setItemPage(i + 1)}
                      className={`min-w-[28px] rounded px-1.5 py-0.5 text-[12px] font-medium ${
                        itemPage === i + 1
                          ? "bg-brand-primary text-white"
                          : "text-text-secondary hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setItemPage((p) => Math.min(totalFilteredPages, p + 1))
                    }
                    disabled={itemPage === totalFilteredPages}
                    className="rounded p-1 text-text-secondary hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom: Save as Draft */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={cart.length === 0}
                className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50 disabled:opacity-40"
              >
                <Save size={14} className="mr-1.5 inline" />
                Save as Draft
              </button>
              <span className="text-[12px] text-text-muted">
                Save your progress and complete later
              </span>
            </div>
          </div>

          {/* Right: Cart */}
          <div className="lg:col-span-2">
            <div className="sticky top-[88px] rounded-card border border-border bg-surface-card p-card-padding">
              <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
                <ShoppingCart size={18} />
                Requisition Cart ({cart.length} Items)
              </h3>

              {cart.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart
                    size={40}
                    className="mx-auto mb-3 text-text-muted"
                  />
                  <p className="text-[13px] text-text-secondary">
                    Your cart is empty
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Add items from the catalog to get started
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex gap-3 rounded-lg border border-border p-3"
                      >
                        <ItemIcon iconKey={item.iconKey} itemId={item.itemId} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-text-primary truncate">
                            {item.itemName}
                          </div>
                          <div className="text-[12px] text-text-secondary">
                            {formatCurrency(item.unitPrice)} / {item.unit}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <QuantityStepper
                              value={item.quantity}
                              onChange={(v) =>
                                updateCartQuantity(item.itemId, v)
                              }
                              min={1}
                              max={9999}
                              size="sm"
                            />
                            <span className="text-[13px] font-semibold text-text-primary">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="flex-shrink-0 self-start text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-text-secondary">Total Items:</span>
                      <span className="font-medium text-text-primary">
                        {cart.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                      <span className="font-medium text-text-primary">
                        Total Amount:
                      </span>
                      <span className="font-bold text-text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Info strip */}
                  <div className="mt-3 flex items-start gap-2 rounded-md bg-tint-blue-bg p-2.5">
                    <Info size={14} className="mt-0.5 flex-shrink-0 text-tint-blue-icon" />
                    <span className="text-[11px] text-tint-blue-icon">
                      Your approver will review quantities and authorise
                      issuance based on availability.
                    </span>
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-button bg-brand-primary py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover transition-colors"
                  >
                    Next: Requisition Details
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Requisition Details ─── */}
      {currentStep === 2 && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-card border border-border bg-surface-card p-card-padding">
            <h3 className="mb-6 text-[15px] font-semibold text-text-primary">
              2. Requisition Details
            </h3>

            <div className="space-y-5">
              {/* Department */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-[14px] text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option>Marketing</option>
                  <option>Finance</option>
                  <option>HR</option>
                  <option>Operations</option>
                  <option>IT</option>
                </select>
              </div>

              {/* Required Date */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Required Date *
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  min={todayStr}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-[14px] text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Purpose *
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-button border border-border px-3 py-2 text-[14px] text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Select purpose...</option>
                  {purposeOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Additional comments or notes..."
                  className="w-full rounded-button border border-border px-3 py-2 text-[14px] text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">
                  Priority
                </label>
                <div className="flex gap-3">
                  {(["LOW", "NORMAL", "URGENT"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`rounded-button border px-4 py-2 text-[13px] font-medium transition-colors ${
                        priority === p
                          ? p === "URGENT"
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-brand-primary bg-tint-blue-bg text-brand-primary"
                          : "border-border text-text-secondary hover:bg-gray-50"
                      }`}
                    >
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!requiredDate || !purpose}
                className="flex items-center gap-1.5 rounded-button bg-brand-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40 transition-colors"
              >
                Next: Review & Submit
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Review & Submit ─── */}
      {currentStep === 3 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-card border border-border bg-surface-card p-card-padding">
            <h3 className="mb-6 text-[15px] font-semibold text-text-primary">
              3. Review & Submit
            </h3>

            {/* Summary details */}
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <span className="text-[12px] text-text-muted">Department</span>
                <p className="text-[14px] font-medium text-text-primary">{department}</p>
              </div>
              <div>
                <span className="text-[12px] text-text-muted">Required Date</span>
                <p className="text-[14px] font-medium text-text-primary">{requiredDate}</p>
              </div>
              <div>
                <span className="text-[12px] text-text-muted">Purpose</span>
                <p className="text-[14px] font-medium text-text-primary">{purpose}</p>
              </div>
              <div>
                <span className="text-[12px] text-text-muted">Priority</span>
                <p className="text-[14px] font-medium text-text-primary">
                  {priority.charAt(0) + priority.slice(1).toLowerCase()}
                </p>
              </div>
              {remarks && (
                <div className="col-span-2">
                  <span className="text-[12px] text-text-muted">Remarks</span>
                  <p className="text-[14px] text-text-primary">{remarks}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <h4 className="mb-3 text-[14px] font-semibold text-text-primary">
              Items ({cart.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">
                      Item
                    </th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">
                      Qty
                    </th>
                    <th className="pb-2 text-left text-table-header uppercase tracking-table-header text-text-secondary">
                      Unit
                    </th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">
                      Unit Price
                    </th>
                    <th className="pb-2 text-right text-table-header uppercase tracking-table-header text-text-secondary">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.itemId} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <ItemIcon iconKey={item.iconKey} itemId={item.itemId} size={24} />
                          <span className="text-[13px] font-medium text-text-primary">
                            {item.itemName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-[13px] text-text-primary">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-[13px] text-text-secondary">
                        {item.unit}
                      </td>
                      <td className="py-3 text-right text-[13px] text-text-primary">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right text-[13px] font-medium text-text-primary">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={4} className="py-3 text-right text-[14px] font-semibold text-text-primary">
                      Total Amount
                    </td>
                    <td className="py-3 text-right text-[16px] font-bold text-brand-primary">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  className="rounded-button border border-border px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-gray-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  className="rounded-button bg-brand-primary px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-primary-hover transition-colors"
                >
                  Submit Requisition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
