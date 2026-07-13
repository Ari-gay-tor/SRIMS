"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ItemIcon, { ITEM_ICON_OPTIONS } from "@/components/icons/items/ItemIcon";
import ToggleSwitch from "@/components/shared/ToggleSwitch";
import { useAppStore } from "@/stores/app-store";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Search, Upload } from "lucide-react";

const unitOptions = ["Piece", "Box", "Ream", "Pack", "Roll"];

export default function ItemsMasterPage() {
  const searchParams = useSearchParams();
  const { stockItems, categories, addItem, updateItem, toggleItemActive, deleteItem } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [unit, setUnit] = useState("Piece");
  const [unitPrice, setUnitPrice] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(20);
  const [currentStock, setCurrentStock] = useState(0);
  const [iconKey, setIconKey] = useState(ITEM_ICON_OPTIONS[0].key);
  const [iconError, setIconError] = useState("");
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (file: File | undefined) => {
    if (!file) return;
    setIconError("");
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      setIconError("Please choose a JPG, PNG, WEBP, or SVG image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setIconError("Icon image must be under 1MB — these render small, so a tiny file is plenty.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setIconKey(reader.result as string);
    reader.readAsDataURL(file);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return stockItems;
    const q = searchQuery.toLowerCase();
    return stockItems.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [stockItems, searchQuery]);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setCategoryId(categories[0]?.id || "");
    setUnit("Piece");
    setUnitPrice(0);
    setMinStockLevel(20);
    setCurrentStock(0);
    setIconKey(ITEM_ICON_OPTIONS[0].key);
    setIconError("");
    setShowModal(true);
  };

  const openEditModal = (id: string) => {
    const item = stockItems.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setName(item.name);
    setCategoryId(item.categoryId);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    setMinStockLevel(item.minStockLevel);
    setCurrentStock(item.currentStock);
    setIconKey(item.iconKey || ITEM_ICON_OPTIONS[0].key);
    setIconError("");
    setShowModal(true);
  };

  // Deep-link support: /masters/items?edit=ITM-0001 (used by Stock Overview's kebab menu)
  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (editParam) openEditModal(editParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSave = () => {
    if (!name.trim() || !categoryId) return;
    const category = categories.find((c) => c.id === categoryId);
    if (editingId) {
      updateItem(editingId, {
        name, categoryId, categoryName: category?.name || "", unit, unitPrice, minStockLevel, currentStock, iconKey,
      });
    } else {
      addItem({
        name, categoryId, categoryName: category?.name || "", unit, unitPrice,
        currentStock, minStockLevel, isActive: true, iconKey,
      });
    }
    setShowModal(false);
  };

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle="Manage the stationery item catalog"
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover"
          >
            <Plus size={16} />
            Add Item
          </button>
        }
      />

      <div className="rounded-card border border-border bg-surface-card">
        <div className="border-b border-border px-4 py-3">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search items..."
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
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Item</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Category</th>
                <th className="px-4 py-3 text-left text-table-header uppercase tracking-table-header text-text-secondary">Unit</th>
                <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Price</th>
                <th className="px-4 py-3 text-right text-table-header uppercase tracking-table-header text-text-secondary">Min Level</th>
                <th className="px-4 py-3 text-center text-table-header uppercase tracking-table-header text-text-secondary">Active</th>
                <th className="px-4 py-3 text-center text-table-header uppercase tracking-table-header text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ItemIcon iconKey={item.iconKey} itemId={item.id} size={28} />
                      <div>
                        <div className="text-[13px] font-medium text-text-primary">{item.name}</div>
                        <div className="text-[11px] text-text-muted">{item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{item.categoryName}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-secondary">{item.minStockLevel}</td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={item.isActive}
                      onChange={() => toggleItemActive(item.id)}
                      showLabel={true}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditModal(item.id)} className="rounded p-1.5 text-text-secondary hover:bg-gray-100 hover:text-brand-primary">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(item.id)} className="rounded p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card bg-surface-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">{editingId ? "Edit Item" : "Add Item"}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
            </div>

            {/* Icon Picker */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-text-primary">
                <ItemIcon iconKey={iconKey} size={22} />
                Icon
              </label>
              <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-border p-2 sm:grid-cols-10">
                {ITEM_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setIconKey(opt.key)}
                    title={opt.label}
                    className={`flex h-8 w-8 items-center justify-center rounded-md border-2 transition-colors ${
                      iconKey === opt.key ? "border-brand-primary bg-tint-blue-bg" : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <ItemIcon iconKey={opt.key} size={18} />
                  </button>
                ))}
              </div>
              <input
                ref={iconFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleIconUpload(e.target.files?.[0])}
              />
              <button
                onClick={() => iconFileInputRef.current?.click()}
                className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-brand-primary hover:underline"
              >
                <Upload size={12} />
                Or upload a custom icon image
              </button>
              {iconError && <p className="mt-1 text-[11px] text-red-600">{iconError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Item Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Category *</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Unit *</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none">
                  {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Unit Price (₹) *</label>
                <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} min={0} step="0.01" className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Min Stock Level *</label>
                <input type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 0)} min={0} className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-text-primary">{editingId ? "Current Stock" : "Opening Stock"}</label>
                <input type="number" value={currentStock} onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)} min={0} className="w-full rounded-button border border-border px-3 py-2 text-[14px] focus:border-brand-primary focus:outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!name.trim()} className="rounded-button bg-brand-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-40">
                {editingId ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-card bg-surface-card p-6 shadow-lg">
            <h3 className="mb-2 text-[15px] font-semibold text-text-primary">Delete item?</h3>
            <p className="mb-4 text-[13px] text-text-secondary">This action cannot be undone. Historical transactions referencing this item will keep their record.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="rounded-button border border-border px-4 py-2 text-[13px] text-text-secondary hover:bg-gray-50">Cancel</button>
              <button onClick={() => { deleteItem(deleteConfirmId); setDeleteConfirmId(null); }} className="rounded-button bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
