import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  MockUser,
  MockItem,
  MockRequisition,
  MockStockTransaction,
  MockCategory,
  users as initialUsers,
  items as initialItems,
  categories as initialCategories,
  suppliers as initialSuppliers,
  requisitions as initialRequisitions,
  stockTransactions as initialStockTransactions,
  generateIssuanceId,
  departments as initialDepartments,
  MockDepartment,
} from "@/lib/data/mock-data";

// ─── Supplier record ───
export interface MockSupplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

// ─── Auto-Approval Rules ───
// Configured by Admin / Inventory Manager under Masters → Auto-Approval.
// When enabled, any requisition submitted (not saved as draft) whose
// priority is in `priorities` skips Pending Approvals entirely and is
// marked APPROVED immediately, attributed to a synthetic "system" actor.
export interface AutoApprovalSettings {
  enabled: boolean;
  priorities: ("LOW" | "NORMAL" | "URGENT")[];
}

const AUTO_APPROVAL_ACTOR_ID = "system-auto-approval";
const AUTO_APPROVAL_ACTOR_NAME = "Auto-Approval System";

/**
 * Pure function — given a requisition that's about to become PENDING and
 * the current auto-approval config, returns either the unchanged
 * requisition or one that's already APPROVED. Deliberately has no side
 * effects (no store writes) so it's safe to call from multiple store
 * actions without worrying about call order.
 */
function computeAutoApproval(
  req: MockRequisition,
  settings: AutoApprovalSettings
): { result: MockRequisition; autoApproved: boolean } {
  // Only an actual submission (PENDING) is eligible — never a draft.
  if (req.status !== "PENDING" || !settings.enabled || !settings.priorities.includes(req.priority)) {
    return { result: req, autoApproved: false };
  }
  return {
    result: {
      ...req,
      status: "APPROVED",
      approvedById: AUTO_APPROVAL_ACTOR_ID,
      approvedByName: AUTO_APPROVAL_ACTOR_NAME,
      approvedAt: new Date().toISOString(),
      items: req.items.map((item) => ({ ...item, approvedQty: item.requestedQty })),
    },
    autoApproved: true,
  };
}

// ─── Cart Item for New Requisition ───
export interface CartItem {
  itemId: string;
  itemName: string;
  categoryName: string;
  unit: string;
  unitPrice: number;
  availableStock: number;
  quantity: number;
  iconKey?: string;
}

// ─── Issuance record ───
export interface MockIssuance {
  id: string;
  requisitionId: string;
  issuedById: string;
  issuedByName: string;
  issuedToId: string;
  issuedToName: string;
  receivedBy: string;
  issueDate: string;
  referenceNo: string;
  remarks: string;
  lines: { itemId: string; itemName: string; issuedQty: number; unitPrice: number }[];
}

// ─── GRN record ───
export interface MockGRN {
  id: string;
  supplierId: string;
  supplierName: string;
  grnDate: string;
  invoiceNo: string;
  invoiceDate: string;
  deliveryChallan: string;
  deliveryDate: string;
  remarks: string;
  totalValue: number;
  lines: { itemId: string; itemName: string; receivedQty: number; unitPrice: number }[];
}

// ─── Audit Log entry ───
export interface MockAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

// ─── App Store ───
interface AppState {
  // Auth
  currentUser: MockUser;
  setCurrentUser: (userId: string) => void;

  // Users (master + auth)
  allUsers: MockUser[];
  addUser: (user: Omit<MockUser, "id">) => void;
  updateUser: (id: string, updates: Partial<MockUser>) => void;
  toggleUserActive: (id: string) => void;
  deleteUser: (id: string) => void;

  // Departments (master — ADMIN only)
  departments: MockDepartment[];
  addDepartment: (name: string) => void;
  updateDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;

  // Categories (master)
  categories: MockCategory[];
  addCategory: (cat: Omit<MockCategory, "id">) => void;
  updateCategory: (id: string, updates: Partial<MockCategory>) => void;
  deleteCategory: (id: string) => void;

  // Suppliers (master)
  suppliers: MockSupplier[];
  addSupplier: (sup: Omit<MockSupplier, "id">) => void;
  updateSupplier: (id: string, updates: Partial<MockSupplier>) => void;
  deleteSupplier: (id: string) => void;

  // Items / Stock (mutable, lives in memory)
  stockItems: MockItem[];
  getItem: (itemId: string) => MockItem | undefined;
  adjustStock: (itemId: string, delta: number) => void;
  addItem: (item: Omit<MockItem, "id">) => void;
  updateItem: (id: string, updates: Partial<MockItem>) => void;
  toggleItemActive: (id: string) => void;
  deleteItem: (id: string) => void;

  // Requisitions
  requisitions: MockRequisition[];
  addRequisition: (req: MockRequisition) => void;
  updateRequisitionStatus: (
    reqId: string,
    status: MockRequisition["status"],
    opts?: {
      approvedById?: string;
      approvedByName?: string;
      rejectedReason?: string;
      approvedQty?: Record<string, number>;
    }
  ) => void;
  updateRequisitionFull: (reqId: string, updates: Partial<MockRequisition>) => void;
  deleteRequisition: (reqId: string) => void;
  loadRequisitionToCart: (reqId: string) => void;

  // Auto-Approval Rules (Masters → Auto-Approval, ADMIN + INVENTORY_MGR only)
  autoApprovalSettings: AutoApprovalSettings;
  updateAutoApprovalSettings: (settings: AutoApprovalSettings) => void;

  // Cart for New Requisition
  cart: CartItem[];
  addToCart: (item: MockItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Issuances
  issuances: MockIssuance[];
  confirmIssuance: (params: {
    requisitionId: string;
    issuedToId: string;
    issuedToName: string;
    receivedBy: string;
    remarks: string;
    lines: { itemId: string; itemName: string; issuedQty: number; approvedQty: number; unitPrice: number }[];
  }) => string;

  /**
   * Approve-and-issue in one atomic action — called from the Pending
   * Approvals page. Replaces the old two-step flow (Approve → Issue Items).
   * Deducts stock, creates outward transactions, sets requisition to
   * ISSUED/PARTIAL, stamps approver info — all in one call.
   */
  approveAndIssue: (
    reqId: string,
    approvedLines: { itemId: string; itemName: string; issuedQty: number; approvedQty: number; unitPrice: number }[],
    approverId: string,
    approverName: string
  ) => string; // returns the generated reference/issuance number // returns issuance referenceNo

  // GRNs / Stock Inward
  grns: MockGRN[];
  stockTransactions: MockStockTransaction[];
  submitGRN: (params: {
    supplierId: string;
    supplierName: string;
    grnDate: string;
    invoiceNo: string;
    invoiceDate: string;
    deliveryChallan: string;
    deliveryDate: string;
    remarks: string;
    lines: { itemId: string; itemName: string; receivedQty: number; unitPrice: number }[];
  }) => string; // returns GRN id

  // Manual Stock Outward / Adjustment
  recordManualMovement: (params: {
    type: "OUTWARD" | "ADJUSTMENT";
    itemId: string;
    itemName: string;
    quantity: number; // signed for adjustment (+/-), positive for outward
    unitPrice: number;
    referenceNo: string;
    remarks?: string;
    linkedRequisitionId?: string;
  }) => void;

  // In-progress drafts for the two-step wizards (Issue Items, Stock Inward).
  // These are session-only — they exist so a half-filled wizard survives
  // navigating away and back, but they are NOT persisted to a backend.
  issueDrafts: Record<string, { itemId: string; itemName: string; unit: string; requestedQty: number; approvedQty: number; availableStock: number; issueQty: number; unitPrice: number; iconKey?: string }[]>;
  saveIssueDraft: (requisitionId: string, lines: { itemId: string; itemName: string; unit: string; requestedQty: number; approvedQty: number; availableStock: number; issueQty: number; unitPrice: number; iconKey?: string }[]) => void;
  clearIssueDraft: (requisitionId: string) => void;

  draftGRNs: {
    id: string;
    supplierId: string;
    grnDate: string;
    invoiceNo: string;
    invoiceDate: string;
    deliveryChallan: string;
    deliveryDate: string;
    remarks: string;
    lines: { id: string; itemId: string; itemName: string; categoryName: string; unit: string; receivedQty: number; unitPrice: number; iconKey?: string }[];
    savedAt: string;
  }[];
  saveGRNDraft: (draft: {
    supplierId: string;
    grnDate: string;
    invoiceNo: string;
    invoiceDate: string;
    deliveryChallan: string;
    deliveryDate: string;
    remarks: string;
    lines: { id: string; itemId: string; itemName: string; categoryName: string; unit: string; receivedQty: number; unitPrice: number; iconKey?: string }[];
  }) => string;
  deleteGRNDraft: (id: string) => void;

  // Audit Logs
  auditLogs: MockAuditLog[];
  addAuditLog: (action: string, entity: string, entityId: string, details: string) => void;

  // Notifications
  notifications: { id: string; message: string; isRead: boolean; link: string; createdAt: string }[];
  markNotificationRead: (id: string) => void;
  addNotification: (message: string, link: string) => void;
}

let grnCounter = 47;
function generateGrnId(): string {
  return `GRN-2025-${String(grnCounter++).padStart(4, "0")}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // ─── Auth ───
  currentUser: initialUsers[0], // Default: Admin (Rahul Sharma)

  setCurrentUser: (userId: string) => {
    const user = get().allUsers.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },

  // ─── Users (master + auth) ───
  allUsers: initialUsers,

  addUser: (user) => {
    const newUser: MockUser = { ...user, id: `user-${Date.now()}` };
    set((s) => ({ allUsers: [...s.allUsers, newUser] }));
    get().addAuditLog("CREATE", "User", newUser.id, `Created user ${newUser.name} (${newUser.role})`);
    get().addNotification(
      `New user added: ${newUser.name} (${newUser.role}) in ${newUser.departmentName}`,
      "/masters/users"
    );

    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        departmentId: newUser.departmentId,
        password: newUser.passwordHash,
      }),
    }).catch(() => {});
  },

  updateUser: (id, updates) => {
    set((s) => ({
      allUsers: s.allUsers.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUser: s.currentUser.id === id ? { ...s.currentUser, ...updates } : s.currentUser,
    }));
    get().addAuditLog("UPDATE", "User", id, `Updated user details`);

    fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(() => {});
  },

  toggleUserActive: (id) => {
    const target = get().allUsers.find((u) => u.id === id);
    const newStatus = !(target?.isActive ?? true);
    set((s) => ({
      allUsers: s.allUsers.map((u) => (u.id === id ? { ...u, isActive: newStatus } : u)),
    }));
    get().addAuditLog(
      "UPDATE", "User", id,
      `${newStatus ? "Activated" : "Deactivated"} user account`
    );
    get().addNotification(
      `User ${target?.name} has been ${newStatus ? "activated" : "deactivated"}`,
      "/masters/users"
    );

    fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }).catch(() => {});
  },

  deleteUser: (id) => {
    const target = get().allUsers.find((u) => u.id === id);
    set((s) => ({ allUsers: s.allUsers.filter((u) => u.id !== id) }));
    get().addAuditLog("DELETE", "User", id, `Deleted user: ${target?.name || id}`);
    get().addNotification(`User ${target?.name || id} was deleted`, "/masters/users");

    fetch(`/api/users/${id}`, { method: "DELETE" }).catch(() => {});
  },

  // ─── Departments (master — ADMIN only) ───
  departments: initialDepartments,

  addDepartment: (name) => {
    const newDept: MockDepartment = { id: `dept-${Date.now()}`, name };
    set((s) => ({ departments: [...s.departments, newDept] }));
    get().addAuditLog("CREATE", "Department", newDept.id, `Created department: ${name}`);
    get().addNotification(`New department added: ${name}`, "/masters/departments");
  },

  updateDepartment: (id, name) => {
    const old = get().departments.find((d) => d.id === id);
    set((s) => ({
      departments: s.departments.map((d) => (d.id === id ? { ...d, name } : d)),
      allUsers: s.allUsers.map((u) =>
        u.departmentId === id ? { ...u, departmentName: name } : u
      ),
    }));
    get().addAuditLog(
      "UPDATE", "Department", id,
      `Renamed department from "${old?.name}" to "${name}"`
    );
  },

  deleteDepartment: (id) => {
    const hasUsers = get().allUsers.some((u) => u.departmentId === id);
    if (hasUsers) return;
    const dept = get().departments.find((d) => d.id === id);
    set((s) => ({ departments: s.departments.filter((d) => d.id !== id) }));
    get().addAuditLog("DELETE", "Department", id, `Deleted department: ${dept?.name || id}`);
  },

  // ─── Categories (master) ───
  categories: initialCategories,

  addCategory: (cat) => {
    const newCat: MockCategory = { ...cat, id: `cat-${Date.now()}` };
    set((s) => ({ categories: [...s.categories, newCat] }));
    get().addAuditLog("CREATE", "Category", newCat.id, `Created category ${newCat.name}`);
  },

  updateCategory: (id, updates) => {
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    get().addAuditLog("UPDATE", "Category", id, `Updated category`);
  },

  deleteCategory: (id) => {
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
    get().addAuditLog("DELETE", "Category", id, `Deleted category`);
  },

  // ─── Suppliers (master) ───
  suppliers: initialSuppliers,

  addSupplier: (sup) => {
    const newSup: MockSupplier = { ...sup, id: `sup-${Date.now()}` };
    set((s) => ({ suppliers: [...s.suppliers, newSup] }));
    get().addAuditLog("CREATE", "Supplier", newSup.id, `Created supplier ${newSup.name}`);
  },

  updateSupplier: (id, updates) => {
    set((s) => ({
      suppliers: s.suppliers.map((sup) => (sup.id === id ? { ...sup, ...updates } : sup)),
    }));
    get().addAuditLog("UPDATE", "Supplier", id, `Updated supplier`);
  },

  deleteSupplier: (id) => {
    set((s) => ({ suppliers: s.suppliers.filter((sup) => sup.id !== id) }));
    get().addAuditLog("DELETE", "Supplier", id, `Deleted supplier`);
  },

  // ─── Items / Stock ───
  stockItems: initialItems,

  getItem: (itemId) => get().stockItems.find((i) => i.id === itemId),

  adjustStock: (itemId, delta) => {
    const item = get().stockItems.find((i) => i.id === itemId);
    const newStock = item ? Math.max(0, item.currentStock + delta) : 0;

    set((state) => ({
      stockItems: state.stockItems.map((i) =>
        i.id === itemId ? { ...i, currentStock: Math.max(0, i.currentStock + delta) } : i
      ),
    }));

    // Trigger a low-stock alert when an item drops to or below its minimum
    if (item && delta < 0 && newStock <= item.minStockLevel && item.currentStock > item.minStockLevel) {
      const severity = newStock === 0 ? "OUT OF STOCK" : newStock <= item.minStockLevel * 0.5 ? "CRITICAL" : "LOW";
      get().addNotification(
        `${severity}: ${item.name} stock is now ${newStock} (min: ${item.minStockLevel})`,
        "/inventory/low-stock"
      );
    }
  },

  addItem: (item) => {
    const newItem: MockItem = { ...item, id: `ITM-${String(Date.now()).slice(-4)}` };
    set((s) => ({ stockItems: [...s.stockItems, newItem] }));
    get().addAuditLog("CREATE", "Item", newItem.id, `Created item ${newItem.name}`);
  },

  updateItem: (id, updates) => {
    const existing = get().stockItems.find((i) => i.id === id);
    set((s) => ({
      stockItems: s.stockItems.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));

    // Build a specific audit message instead of the generic "Updated item details"
    const changes: string[] = [];
    if (updates.name && updates.name !== existing?.name)
      changes.push(`name: "${existing?.name}" → "${updates.name}"`);
    if (updates.unitPrice !== undefined && updates.unitPrice !== existing?.unitPrice)
      changes.push(`price: ₹${existing?.unitPrice} → ₹${updates.unitPrice}`);
    if (updates.minStockLevel !== undefined && updates.minStockLevel !== existing?.minStockLevel)
      changes.push(`min stock: ${existing?.minStockLevel} → ${updates.minStockLevel}`);
    if (updates.categoryId && updates.categoryId !== existing?.categoryId)
      changes.push(`category changed`);

    get().addAuditLog(
      "UPDATE", "Item", id,
      changes.length > 0
        ? `Updated ${existing?.name}: ${changes.join("; ")}`
        : `Updated item ${existing?.name || id}`
    );
  },

  toggleItemActive: (id) => {
    set((s) => ({
      stockItems: s.stockItems.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
    }));
    get().addAuditLog("UPDATE", "Item", id, `Toggled active status`);
  },

  deleteItem: (id) => {
    set((s) => ({ stockItems: s.stockItems.filter((i) => i.id !== id) }));
    get().addAuditLog("DELETE", "Item", id, `Deleted item`);
  },

  // ─── Requisitions ───
  requisitions: initialRequisitions,

  addRequisition: (req) => {
    const { result, autoApproved } = computeAutoApproval(req, get().autoApprovalSettings);
    set((state) => ({
      requisitions: [result, ...state.requisitions],
    }));
    if (autoApproved) {
      get().addAuditLog(
        "AUTO_APPROVE",
        "Requisition",
        result.id,
        `Auto-approved (priority: ${result.priority}) per Auto-Approval Rules`
      );
    } else if (result.status === "PENDING") {
      // Notify approvers that a new requisition is waiting
      get().addNotification(
        `New requisition ${result.id} submitted by ${result.userName} — awaiting approval`,
        "/approvals/pending"
      );
    }
  },

  updateRequisitionStatus: (reqId, status, opts) => {
    let autoApprovedId: string | null = null;
    let autoApprovedPriority = "";

    set((state) => ({
      requisitions: state.requisitions.map((r) => {
        if (r.id !== reqId) return r;
        let updated = { ...r, status };
        if (opts?.approvedById) {
          updated.approvedById = opts.approvedById;
          updated.approvedByName = opts.approvedByName || null;
          updated.approvedAt = new Date().toISOString();
        }
        if (opts?.rejectedReason) {
          updated.rejectedReason = opts.rejectedReason;
        }
        if (opts?.approvedQty) {
          updated.items = r.items.map((item) => ({
            ...item,
            approvedQty: opts.approvedQty![item.itemId] ?? item.requestedQty,
          }));
        }

        // A draft moving straight to PENDING (e.g. the "Submit" action on
        // the Drafts page) is the one transition not already covered by
        // addRequisition/updateRequisitionFull, so check it here too.
        if (status === "PENDING" && r.status !== "PENDING") {
          const { result, autoApproved } = computeAutoApproval(updated, get().autoApprovalSettings);
          updated = result;
          if (autoApproved) {
            autoApprovedId = result.id;
            autoApprovedPriority = result.priority;
          }
        }
        return updated;
      }),
    }));

    if (autoApprovedId) {
      get().addAuditLog(
        "AUTO_APPROVE",
        "Requisition",
        autoApprovedId,
        `Auto-approved (priority: ${autoApprovedPriority}) per Auto-Approval Rules`
      );
    }

    // Push targeted notifications for key status transitions
    const req = get().requisitions.find((r) => r.id === reqId);
    if (req) {
      if (status === "APPROVED") {
        // Notify Inventory team that a req is ready to issue
        get().addNotification(
          `${reqId} approved — ready to issue from ${req.departmentName}`,
          "/issue/queue"
        );
        // Notify the requester their req was approved
        get().addNotification(
          `Your requisition ${reqId} has been approved`,
          "/requisitions/my"
        );
      } else if (status === "REJECTED") {
        get().addNotification(
          `Your requisition ${reqId} was rejected — see Rejected Approvals for reason`,
          "/approvals/rejected"
        );
      } else if (status === "PENDING" && !autoApprovedId) {
        get().addNotification(
          `Requisition ${reqId} submitted by ${req.userName} is awaiting your approval`,
          "/approvals/pending"
        );
      }
    }
  },

  updateRequisitionFull: (reqId, updates) => {
    const existing = get().requisitions.find((r) => r.id === reqId);
    let autoApproved = false;
    let merged: MockRequisition | null = existing ? { ...existing, ...updates } : null;

    if (merged && updates.status === "PENDING" && existing!.status !== "PENDING") {
      const computed = computeAutoApproval(merged, get().autoApprovalSettings);
      merged = computed.result;
      autoApproved = computed.autoApproved;
    }

    set((state) => ({
      requisitions: state.requisitions.map((r) => (r.id === reqId && merged ? merged : r)),
    }));

    if (autoApproved && merged) {
      get().addAuditLog(
        "AUTO_APPROVE",
        "Requisition",
        reqId,
        `Auto-approved (priority: ${merged.priority}) per Auto-Approval Rules`
      );
    }
  },

  deleteRequisition: (reqId) => {
    set((state) => ({
      requisitions: state.requisitions.filter((r) => r.id !== reqId),
    }));
    get().addAuditLog("DELETE", "Requisition", reqId, "Deleted draft requisition");
  },

  // ─── Auto-Approval Rules ───
  // Default: low-priority requisitions auto-approve, everything else still
  // goes through Pending Approvals. Admin / Inventory Manager can change
  // this from Masters → Auto-Approval.
  autoApprovalSettings: { enabled: true, priorities: ["LOW"] },

  updateAutoApprovalSettings: (settings) => {
    set({ autoApprovalSettings: settings });
    get().addAuditLog(
      "UPDATE",
      "AutoApprovalSettings",
      "global",
      `Auto-approval ${settings.enabled ? "enabled" : "disabled"} for priorities: ${settings.priorities.join(", ") || "none"}`
    );
  },

  loadRequisitionToCart: (reqId) => {
    const req = get().requisitions.find((r) => r.id === reqId);
    if (!req) return;
    const stockItems = get().stockItems;
    const cartItems: CartItem[] = req.items.map((item) => {
      const stockItem = stockItems.find((s) => s.id === item.itemId);
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        categoryName: item.categoryName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        availableStock: stockItem?.currentStock ?? item.requestedQty,
        quantity: item.requestedQty,
        iconKey: stockItem?.iconKey,
      };
    });
    set({ cart: cartItems });
  },

  // ─── Cart ───
  cart: [],

  addToCart: (item) =>
    set((state) => {
      if (state.cart.find((c) => c.itemId === item.id)) return state;
      return {
        cart: [
          ...state.cart,
          {
            itemId: item.id,
            itemName: item.name,
            categoryName: item.categoryName,
            unit: item.unit,
            unitPrice: item.unitPrice,
            availableStock: item.currentStock,
            quantity: 1,
            iconKey: item.iconKey,
          },
        ],
      };
    }),

  removeFromCart: (itemId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.itemId !== itemId),
    })),

  updateCartQuantity: (itemId, qty) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.itemId === itemId ? { ...c, quantity: Math.max(1, Math.min(qty, c.availableStock)) } : c
      ),
    })),

  clearCart: () => set({ cart: [] }),

  cartTotal: () => {
    return get().cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  },

  // ─── Issuances ───
  issuances: [],

  confirmIssuance: ({ requisitionId, issuedToId, issuedToName, receivedBy, remarks, lines }) => {
    const state = get();
    const referenceNo = generateIssuanceId();
    const actor = state.currentUser;

    // Determine overall status: Issued if every line fully issued, else Partial
    const isFullyIssued = lines.every((l) => l.issuedQty >= l.approvedQty);

    // Decrement stock for each issued line
    lines.forEach((l) => {
      if (l.issuedQty > 0) {
        state.adjustStock(l.itemId, -l.issuedQty);
      }
    });

    // Record issuance
    const issuance: MockIssuance = {
      id: referenceNo,
      requisitionId,
      issuedById: actor.id,
      issuedByName: actor.name,
      issuedToId,
      issuedToName,
      receivedBy,
      issueDate: new Date().toISOString(),
      referenceNo,
      remarks,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        itemName: l.itemName,
        issuedQty: l.issuedQty,
        unitPrice: l.unitPrice,
      })),
    };

    // Add stock transactions (OUTWARD)
    const newTransactions: MockStockTransaction[] = lines
      .filter((l) => l.issuedQty > 0)
      .map((l, idx) => ({
        id: `st-iss-${referenceNo}-${idx}`,
        type: "OUTWARD" as const,
        itemId: l.itemId,
        itemName: l.itemName,
        quantity: l.issuedQty,
        unitPrice: l.unitPrice,
        referenceNo,
        date: new Date().toISOString().split("T")[0],
        userId: actor.id,
        linkedRequisitionId: requisitionId,
      }));

    // Update requisition: issuedQty per line + overall status
    set((s) => ({
      issuances: [issuance, ...s.issuances],
      stockTransactions: [...newTransactions, ...s.stockTransactions],
      requisitions: s.requisitions.map((r) => {
        if (r.id !== requisitionId) return r;
        return {
          ...r,
          status: isFullyIssued ? "ISSUED" : "PARTIAL",
          items: r.items.map((item) => {
            const line = lines.find((l) => l.itemId === item.itemId);
            return line ? { ...item, issuedQty: line.issuedQty } : item;
          }),
        };
      }),
    }));

    // Audit log
    get().addAuditLog(
      isFullyIssued ? "ISSUE_COMPLETE" : "ISSUE_PARTIAL",
      "Requisition",
      requisitionId,
      `Issued via ${referenceNo}. ${lines.length} line(s) processed.`
    );

    // Notify the requester that their items have been dispatched
    const req = get().requisitions.find((r) => r.id === requisitionId);
    if (req) {
      get().addNotification(
        `Your requisition ${requisitionId} has been ${isFullyIssued ? "fully issued" : "partially issued"} (${referenceNo})`,
        "/requisitions/my"
      );
    }

    return referenceNo;
  },

  // ─── Approve-and-issue in one atomic action ───────────────────────────────
  approveAndIssue: (reqId, approvedLines, approverId, approverName) => {
    const req = get().requisitions.find((r) => r.id === reqId);
    if (!req) return "";

    // Calculate the ACTUAL issued total — this is what the approver confirmed,
    // not the original requested amount (partial issue = lower price).
    const actualIssuedAmount = approvedLines.reduce(
      (sum, l) => sum + l.issuedQty * l.unitPrice,
      0
    );

    // Stamp approver info + update totalAmount to reflect actual issued amount
    set((s) => ({
      requisitions: s.requisitions.map((r) =>
        r.id === reqId
          ? {
              ...r,
              approvedById: approverId,
              approvedByName: approverName,
              approvedAt: new Date().toISOString(),
              totalAmount: actualIssuedAmount,   // ← key fix: recalculate from issued qty
              items: r.items.map((item) => {
                const line = approvedLines.find((l) => l.itemId === item.itemId);
                return line
                  ? { ...item, approvedQty: line.issuedQty, issuedQty: line.issuedQty }
                  : item;
              }),
            }
          : r
      ),
    }));

    // confirmIssuance handles stock deduction, outward transactions,
    // issuance record, ISSUED/PARTIAL status, and notifications
    const referenceNo = get().confirmIssuance({
      requisitionId: reqId,
      issuedToId: req.userId,
      issuedToName: req.userName,
      receivedBy: req.userName,
      remarks: `Approved and auto-issued by ${approverName}`,
      lines: approvedLines,
    });

    get().addAuditLog(
      "APPROVE_AND_ISSUE",
      "Requisition",
      reqId,
      `Approved and auto-issued by ${approverName} → ${referenceNo}. Issued amount: ₹${actualIssuedAmount.toFixed(2)}`
    );

    return referenceNo;
  },

  // ─── GRNs / Stock Inward ───
  grns: [],
  stockTransactions: initialStockTransactions,

  submitGRN: ({ supplierId, supplierName, grnDate, invoiceNo, invoiceDate, deliveryChallan, deliveryDate, remarks, lines }) => {
    const state = get();
    const grnId = generateGrnId();
    const actor = state.currentUser;
    const totalValue = lines.reduce((s, l) => s + l.receivedQty * l.unitPrice, 0);

    // Increment stock for each line
    lines.forEach((l) => {
      state.adjustStock(l.itemId, l.receivedQty);
    });

    const grn: MockGRN = {
      id: grnId,
      supplierId,
      supplierName,
      grnDate,
      invoiceNo,
      invoiceDate,
      deliveryChallan,
      deliveryDate,
      remarks,
      totalValue,
      lines,
    };

    const newTransactions: MockStockTransaction[] = lines.map((l, idx) => ({
      id: `st-grn-${grnId}-${idx}`,
      type: "INWARD" as const,
      itemId: l.itemId,
      itemName: l.itemName,
      quantity: l.receivedQty,
      unitPrice: l.unitPrice,
      referenceNo: grnId,
      date: grnDate,
      userId: actor.id,
    }));

    set((s) => ({
      grns: [grn, ...s.grns],
      stockTransactions: [...newTransactions, ...s.stockTransactions],
    }));

    get().addAuditLog(
      "STOCK_INWARD",
      "GRN",
      grnId,
      `Received ${lines.length} item(s) from ${supplierName}. Total value: ₹${totalValue.toFixed(2)}`
    );

    return grnId;
  },

  // ─── Manual Stock Outward / Adjustment ───
  recordManualMovement: ({ type, itemId, itemName, quantity, unitPrice, referenceNo, remarks, linkedRequisitionId }) => {
    const state = get();
    const actor = state.currentUser;

    // OUTWARD always decrements; ADJUSTMENT applies signed delta directly
    const delta = type === "OUTWARD" ? -Math.abs(quantity) : quantity;
    state.adjustStock(itemId, delta);

    const newTransaction: MockStockTransaction = {
      id: `st-manual-${Date.now()}`,
      type,
      itemId,
      itemName,
      quantity: type === "OUTWARD" ? Math.abs(quantity) : quantity,
      unitPrice,
      referenceNo,
      date: new Date().toISOString().split("T")[0],
      userId: actor.id,
      linkedRequisitionId,
    };

    set((s) => ({
      stockTransactions: [newTransaction, ...s.stockTransactions],
    }));

    get().addAuditLog(
      type === "OUTWARD" ? "STOCK_OUTWARD" : "STOCK_ADJUSTMENT",
      "Item",
      itemId,
      `${type === "OUTWARD" ? "Issued" : "Adjusted"} ${itemName} by ${quantity > 0 ? "+" : ""}${quantity}. Ref: ${referenceNo}${remarks ? ` — ${remarks}` : ""}`
    );
  },

  // ─── Issue Items wizard drafts (per-requisition, session-only) ───
  issueDrafts: {},

  saveIssueDraft: (requisitionId, lines) =>
    set((state) => ({
      issueDrafts: { ...state.issueDrafts, [requisitionId]: lines },
    })),

  clearIssueDraft: (requisitionId) =>
    set((state) => {
      const next = { ...state.issueDrafts };
      delete next[requisitionId];
      return { issueDrafts: next };
    }),

  // ─── Stock Inward (GRN) wizard drafts (session-only) ───
  draftGRNs: [],

  saveGRNDraft: (draft) => {
    const id = `grn-draft-${Date.now()}`;
    set((state) => ({
      draftGRNs: [
        { ...draft, id, savedAt: new Date().toISOString() },
        ...state.draftGRNs,
      ],
    }));
    return id;
  },

  deleteGRNDraft: (id) =>
    set((state) => ({
      draftGRNs: state.draftGRNs.filter((d) => d.id !== id),
    })),

  // ─── Audit Logs ───
  auditLogs: [
    {
      id: "audit-1",
      actorId: "user-4",
      actorName: "Sandeep Kumar",
      action: "STOCK_INWARD",
      entity: "GRN",
      entityId: "GRN-2025-0045",
      details: "Received 500 units of A4 Copier Paper",
      timestamp: "2025-05-31T09:00:00",
    },
    {
      id: "audit-2",
      actorId: "user-1",
      actorName: "Rahul Sharma",
      action: "APPROVE",
      entity: "Requisition",
      entityId: "REQ-2025-00127",
      details: "Approved requisition for Amit Verma",
      timestamp: "2025-05-30T16:00:00",
    },
  ],

  addAuditLog: (action, entity, entityId, details) => {
    const actor = get().currentUser;
    set((s) => ({
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          actorId: actor.id,
          actorName: actor.name,
          action,
          entity,
          entityId,
          details,
          timestamp: new Date().toISOString(),
        },
        ...s.auditLogs,
      ],
    }));
  },

  // ─── Notifications ───
  notifications: [
    {
      id: "notif-1",
      message: "Low stock alert: Ball Pen (Blue) is below minimum level",
      isRead: false,
      link: "/inventory/low-stock",
      createdAt: "2025-05-31T10:00:00",
    },
    {
      id: "notif-2",
      message: "REQ-2025-00128 submitted for your approval",
      isRead: false,
      link: "/approvals/pending",
      createdAt: "2025-05-31T10:30:00",
    },
    {
      id: "notif-3",
      message: "Critical: Highlighter (Yellow) stock is critically low",
      isRead: false,
      link: "/inventory/low-stock",
      createdAt: "2025-05-31T09:00:00",
    },
  ],

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  addNotification: (message, link) =>
    set((state) => ({
      notifications: [
        {
          id: `notif-${Date.now()}`,
          message,
          isRead: false,
          link,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),
}),
  {
    name: "srims-store-v1",
    storage: createJSONStorage(() =>
      typeof window !== "undefined" ? localStorage : (({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        length: 0,
        clear: () => {},
        key: () => null,
      }) as unknown as Storage)
    ),
    // Do NOT persist currentUser (re-synced from NextAuth session on load)
    // or session-only wizard state (cart clears on submit already).
    // Everything else should survive refresh / logout-login / browser restart.
    partialize: (state) => ({
      allUsers: state.allUsers,
      departments: state.departments,
      categories: state.categories,
      suppliers: state.suppliers,
      stockItems: state.stockItems,
      requisitions: state.requisitions,
      grns: state.grns,
      issuances: state.issuances,
      stockTransactions: state.stockTransactions,
      auditLogs: state.auditLogs,
      notifications: state.notifications,
      autoApprovalSettings: state.autoApprovalSettings,
      issueDrafts: state.issueDrafts,
      draftGRNs: state.draftGRNs,
    }),
  }
));
